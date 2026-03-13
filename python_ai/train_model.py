"""
digdaya_trust_layer / Intelligence Layer
========================================
train_model.py — Federated-Learning-style Credit Scoring & Fraud Detection
Author  : Senior Blockchain & AI Architect
Stack   : Python 3.10+ · scikit-learn · XGBoost · pandas · hashlib

Architecture note
-----------------
In a true Federated Learning setup each edge node (bank branch, e-wallet)
trains a local model on its own shard; only *model parameters* (not raw data)
are aggregated here at the coordinator.  This script simulates that flow:

  1. Each "client" trains on its local data slice  →  local_model
  2. The coordinator collects parameter arrays      →  aggregate_models()
  3. The global model is evaluated & serialised     →  export artefacts
  4. A SHA-256 hash of the model weights is pushed  →  Solana (Trust Layer)
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBClassifier

# ─── Logging ────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("digdaya.train")

# ─── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
ARTIFACT_DIR = BASE_DIR / "artifacts"
ARTIFACT_DIR.mkdir(exist_ok=True)

# ============================================================
#  DATA STRUCTURES
# ============================================================

@dataclass
class ModelManifest:
    """Serialisable artefact manifest — written to artifacts/manifest.json."""
    model_type:       str
    task:             str          # "credit_scoring" | "fraud_detection"
    trained_at:       str
    feature_names:    list[str]
    model_hash_sha256: str
    cv_roc_auc_mean:  float
    cv_roc_auc_std:   float
    threshold:        float


# ============================================================
#  SYNTHETIC DATA GENERATOR
# ============================================================

def generate_synthetic_msme_data(n_samples: int = 5_000, seed: int = 42) -> pd.DataFrame:
    """
    Generates anonymised, synthetic MSME transaction features.
    In production this is replaced by anonymised DB queries — zero PII.

    Feature dictionary
    ------------------
    avg_monthly_cashflow    : Mean monthly net cash (IDR, normalised)
    cashflow_volatility     : Std-dev of monthly cashflow (risk proxy)
    total_transactions_6m   : Total tx count last 6 months
    on_time_payment_ratio   : [0, 1] fraction of payments made on time
    logistics_delivery_rate : [0, 1] order fulfilment rate
    avg_order_value         : Average sale/order value (IDR, normalised)
    months_in_business      : Business age in months
    num_unique_buyers       : Distinct buyer entities
    agri_sector_flag        : 1 if agriculture/food sector
    digital_channel_ratio   : Fraction of sales via digital channels
    """
    rng = np.random.default_rng(seed)

    n = n_samples
    df = pd.DataFrame({
        "avg_monthly_cashflow":    rng.normal(50, 30, n).clip(0),
        "cashflow_volatility":     rng.exponential(10, n).clip(0, 60),
        "total_transactions_6m":   rng.integers(5, 300, n).astype(float),
        "on_time_payment_ratio":   rng.beta(5, 2, n),          # skewed high
        "logistics_delivery_rate": rng.beta(6, 1.5, n),
        "avg_order_value":         rng.lognormal(3, 1, n).clip(0, 500),
        "months_in_business":      rng.integers(1, 120, n).astype(float),
        "num_unique_buyers":       rng.integers(1, 200, n).astype(float),
        "agri_sector_flag":        rng.integers(0, 2, n).astype(float),
        "digital_channel_ratio":   rng.beta(2, 3, n),
    })

    # ── Credit label: 1 = creditworthy ─────────────────────────────────
    credit_score_latent = (
        0.30 * df["on_time_payment_ratio"]
        + 0.20 * df["avg_monthly_cashflow"] / 100
        + 0.15 * df["logistics_delivery_rate"]
        + 0.15 * np.log1p(df["months_in_business"]) / 5
        + 0.10 * df["digital_channel_ratio"]
        + 0.10 * np.log1p(df["num_unique_buyers"]) / 6
        - 0.10 * df["cashflow_volatility"] / 60
        + rng.normal(0, 0.05, n)
    )
    df["credit_label"] = (credit_score_latent > 0.55).astype(int)

    # ── Fraud label: 1 = suspicious ────────────────────────────────────
    fraud_score_latent = (
        0.40 * df["cashflow_volatility"] / 60
        - 0.25 * df["on_time_payment_ratio"]
        - 0.20 * df["logistics_delivery_rate"]
        + 0.15 * (df["total_transactions_6m"] > 250).astype(float)
        + rng.normal(0, 0.05, n)
    )
    df["fraud_label"] = (fraud_score_latent > 0.25).astype(int)

    log.info(
        "Synthetic data: %d rows | credit pos=%.1f%% | fraud pos=%.1f%%",
        n,
        df["credit_label"].mean() * 100,
        df["fraud_label"].mean() * 100,
    )
    return df


# ============================================================
#  FEDERATED AGGREGATION HELPERS
# ============================================================

def _get_xgb_params(trees: list[np.ndarray]) -> np.ndarray:
    """
    Naive federated mean aggregation over XGBoost leaf-value arrays.
    Production systems use secure aggregation (e.g., Flower / PySyft).
    """
    stacked = np.stack(trees, axis=0)
    return stacked.mean(axis=0)


def aggregate_models(local_models: list, model_class: type) -> Any:
    """
    Simulate federated aggregation:
    collect feature_importances_ (a public proxy for weights)
    and return the model from the client with the highest local AUC
    as the 'global' model (FedAvg-lite).

    In production: replace with proper parameter averaging using
    Flower (flwr) or OpenFL.
    """
    if not local_models:
        raise ValueError("No local models to aggregate.")

    # Select the best-performing local model as the global representative
    best_model, best_auc = local_models[0][0], local_models[0][1]
    for model, auc in local_models[1:]:
        if auc > best_auc:
            best_model, best_auc = model, auc

    log.info("Federated aggregation complete. Best local AUC: %.4f", best_auc)
    return best_model


# ============================================================
#  TRAINING PIPELINE
# ============================================================

FEATURE_COLS = [
    "avg_monthly_cashflow",
    "cashflow_volatility",
    "total_transactions_6m",
    "on_time_payment_ratio",
    "logistics_delivery_rate",
    "avg_order_value",
    "months_in_business",
    "num_unique_buyers",
    "agri_sector_flag",
    "digital_channel_ratio",
]


def preprocess(df: pd.DataFrame) -> tuple[np.ndarray, StandardScaler]:
    """Scale features; return (X_scaled, fitted_scaler)."""
    scaler = StandardScaler()
    X = scaler.fit_transform(df[FEATURE_COLS].fillna(0))
    return X, scaler


def train_credit_scoring(df: pd.DataFrame) -> tuple[Any, ModelManifest, float]:
    """Train XGBoost credit scoring model with 5-fold CV."""
    log.info("── Training Credit Scoring Model (XGBoost) ──")

    X, scaler = preprocess(df)
    y = df["credit_label"].values

    # Simulate federated: split into 3 'client shards'
    n_clients = 3
    shards = np.array_split(np.arange(len(X)), n_clients)
    local_models = []

    for i, idx in enumerate(shards):
        X_shard, y_shard = X[idx], y[idx]
        X_tr, X_val, y_tr, y_val = train_test_split(
            X_shard, y_shard, test_size=0.2, stratify=y_shard, random_state=i
        )
        clf = XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=(y_shard == 0).sum() / max((y_shard == 1).sum(), 1),
            eval_metric="logloss",
            random_state=42,
            verbosity=0,
        )
        clf.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
        local_auc = roc_auc_score(y_val, clf.predict_proba(X_val)[:, 1])
        local_models.append((clf, local_auc))
        log.info("  Client %d | local AUC: %.4f", i + 1, local_auc)

    global_model = aggregate_models(local_models, XGBClassifier)

    # Cross-validate global model on full dataset
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(global_model, X, y, cv=cv, scoring="roc_auc")
    log.info(
        "Credit Scoring CV AUC: %.4f ± %.4f", cv_scores.mean(), cv_scores.std()
    )

    # Final eval
    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=99
    )
    global_model.fit(X_tr, y_tr)
    y_prob = global_model.predict_proba(X_te)[:, 1]
    threshold = 0.5
    y_pred = (y_prob >= threshold).astype(int)

    print("\n📊 CREDIT SCORING — Classification Report")
    print(classification_report(y_te, y_pred, target_names=["Not Creditworthy", "Creditworthy"]))
    print("Confusion Matrix:\n", confusion_matrix(y_te, y_pred))

    # Serialise & hash
    model_path = ARTIFACT_DIR / "credit_model.joblib"
    scaler_path = ARTIFACT_DIR / "credit_scaler.joblib"
    joblib.dump(global_model, model_path)
    joblib.dump(scaler, scaler_path)

    model_hash = _sha256_file(model_path)
    log.info("Credit model SHA-256: %s", model_hash)

    manifest = ModelManifest(
        model_type="XGBClassifier",
        task="credit_scoring",
        trained_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        feature_names=FEATURE_COLS,
        model_hash_sha256=model_hash,
        cv_roc_auc_mean=float(cv_scores.mean()),
        cv_roc_auc_std=float(cv_scores.std()),
        threshold=threshold,
    )
    return global_model, manifest, float(cv_scores.mean())


def train_fraud_detection(df: pd.DataFrame) -> tuple[Any, ModelManifest]:
    """Train Random Forest fraud detection model."""
    log.info("── Training Fraud Detection Model (Random Forest) ──")

    X, scaler = preprocess(df)
    y = df["fraud_label"].values

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        min_samples_leaf=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(clf, X, y, cv=cv, scoring="roc_auc")
    log.info(
        "Fraud Detection CV AUC: %.4f ± %.4f", cv_scores.mean(), cv_scores.std()
    )

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=99
    )
    clf.fit(X_tr, y_tr)
    proba = clf.predict_proba(X_te)
    y_prob = proba[:, 1] if proba.shape[1] > 1 else proba[:, 0]
    threshold = 0.40  # Lower threshold: prefer recall over precision for fraud
    y_pred = (y_prob >= threshold).astype(int)

    print("\n🚨 FRAUD DETECTION — Classification Report")
    print(classification_report(y_te, y_pred, target_names=["Legitimate", "Fraud"]))
    print("Confusion Matrix:\n", confusion_matrix(y_te, y_pred))

    model_path = ARTIFACT_DIR / "fraud_model.joblib"
    scaler_path = ARTIFACT_DIR / "fraud_scaler.joblib"
    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)

    model_hash = _sha256_file(model_path)
    log.info("Fraud model SHA-256: %s", model_hash)

    manifest = ModelManifest(
        model_type="RandomForestClassifier",
        task="fraud_detection",
        trained_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        feature_names=FEATURE_COLS,
        model_hash_sha256=model_hash,
        cv_roc_auc_mean=float(cv_scores.mean()),
        cv_roc_auc_std=float(cv_scores.std()),
        threshold=threshold,
    )
    return clf, manifest


# ============================================================
#  INFERENCE HELPER  (used by the backend API)
# ============================================================

class DigdayaInferenceEngine:
    """
    Lightweight wrapper for real-time inference.
    Load once on service startup; call score() per request.
    """

    def __init__(self, artifact_dir: Path = ARTIFACT_DIR):
        self.credit_model  = joblib.load(artifact_dir / "credit_model.joblib")
        self.credit_scaler = joblib.load(artifact_dir / "credit_scaler.joblib")
        self.fraud_model   = joblib.load(artifact_dir / "fraud_model.joblib")
        self.fraud_scaler  = joblib.load(artifact_dir / "fraud_scaler.joblib")
        self.manifest      = json.loads((artifact_dir / "manifest.json").read_text())
        log.info("InferenceEngine loaded — credit & fraud models ready.")

    def score(self, features: dict) -> dict:
        """
        Parameters
        ----------
        features : dict
            Keys must match FEATURE_COLS exactly.
            Values must be anonymised (no PII).

        Returns
        -------
        dict with keys:
          credit_probability [0, 1]
          credit_score_fico  [300, 850]
          fraud_probability  [0, 1]
          is_fraud_flag      bool
          credit_band        str  (e.g. "Good", "Fair", "Poor")
        """
        row = pd.DataFrame([features])[FEATURE_COLS].fillna(0)

        # Credit scoring
        X_credit = self.credit_scaler.transform(row)
        credit_prob = float(self.credit_model.predict_proba(X_credit)[0, 1])
        credit_fico = int(300 + credit_prob * 550)  # map [0,1] → [300, 850]

        # Fraud detection
        X_fraud = self.fraud_scaler.transform(row)
        fraud_prob = float(self.fraud_model.predict_proba(X_fraud)[0, 1])
        threshold  = self.manifest["credit_scoring"]["threshold"]

        return {
            "credit_probability": round(credit_prob, 4),
            "credit_score_fico":  credit_fico,
            "credit_band":        _fico_band(credit_fico),
            "fraud_probability":  round(fraud_prob, 4),
            "is_fraud_flag":      fraud_prob >= 0.40,
        }


# ============================================================
#  UTILITIES
# ============================================================

def _sha256_file(path: Path) -> str:
    """Return hex SHA-256 digest of a file — used as model_hash for Solana."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _fico_band(score: int) -> str:
    if score >= 740:
        return "Excellent"
    if score >= 670:
        return "Good"
    if score >= 580:
        return "Fair"
    return "Poor"


# ============================================================
#  MAIN ENTRY POINT
# ============================================================

def main() -> None:
    log.info("═══ DIGDAYA Intelligence Layer — Training Pipeline ═══")

    df = generate_synthetic_msme_data(n_samples=5_000)

    credit_model, credit_manifest, _auc = train_credit_scoring(df)
    fraud_model,  fraud_manifest        = train_fraud_detection(df)

    # Write combined manifest
    manifest_path = ARTIFACT_DIR / "manifest.json"
    manifest_data = {
        "credit_scoring": asdict(credit_manifest),
        "fraud_detection": asdict(fraud_manifest),
    }
    manifest_path.write_text(json.dumps(manifest_data, indent=2))
    log.info("Manifest written → %s", manifest_path)

    # Print hashes to be pushed to Solana Trust Layer
    print("\n" + "═" * 60)
    print("  ARTEFACT HASHES — push these to Solana Trust Layer")
    print("═" * 60)
    print(f"  credit_model SHA-256 : {credit_manifest.model_hash_sha256}")
    print(f"  fraud_model  SHA-256 : {fraud_manifest.model_hash_sha256}")
    print("═" * 60)
    log.info("Training complete. Artefacts → %s", ARTIFACT_DIR)


if __name__ == "__main__":
    main()
