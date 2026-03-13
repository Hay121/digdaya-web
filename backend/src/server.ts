import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import {
  Connection, Keypair, PublicKey,
  Transaction, TransactionInstruction, sendAndConfirmTransaction
} from "@solana/web3.js";

const CONFIG = {
  PORT:       parseInt(process.env.PORT || "3000"),
  RPC:        process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  PROGRAM_ID: process.env.PROGRAM_ID    || "7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE",
  PII_SALT:   process.env.PII_SALT      || "digdaya_salt",
};

const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

let keypair:    Keypair    | null = null;
let connection: Connection | null = null;

function initWallet(): void {
  const raw = process.env.WALLET_SECRET_JSON;
  if (!raw) { console.warn("⚠️  No wallet — mock mode"); return; }
  try {
    const bytes = new Uint8Array(JSON.parse(raw));
    if (bytes.length !== 64) { console.warn("⚠️  Bad wallet length — mock mode"); return; }
    keypair    = Keypair.fromSecretKey(bytes);
    connection = new Connection(CONFIG.RPC, "confirmed");
    console.log("✅ Wallet ready:", keypair.publicKey.toString());
  } catch(e) {
    console.warn("⚠️  Wallet parse error — mock mode");
  }
}

async function sendMemo(data: object): Promise<string> {
  if (!keypair || !connection) {
    return "mock_tx_" + crypto.randomBytes(16).toString("hex");
  }
  const memo = JSON.stringify(data);
  const ix   = new TransactionInstruction({
    keys:       [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
    programId:  MEMO_PROGRAM,
    data:       Buffer.from(memo, "utf-8"),
  });
  const tx  = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [keypair]);
  return sig;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status:       "ok",
    version:      "1.0.0",
    solana_ready: !!keypair,
    snap_bi_ver:  "2.0",
  });
});

app.post("/api/v1/transactions", async (req: Request, res: Response) => {
  const { entityId, transactionType, amountIdr, hashData } = req.body;
  if (!entityId || !transactionType || !amountIdr) {
    res.status(400).json({ success: false, error: "Missing required fields: entityId, transactionType, amountIdr" });
    return;
  }
  try {
    const raw       = `${entityId}:${transactionType}:${amountIdr}:${hashData||""}:${Date.now()}`;
    const hash      = crypto.createHash("sha256").update(raw).digest("hex");
    const maskedId  = crypto.createHmac("sha256", CONFIG.PII_SALT).update(entityId).digest("hex").slice(0, 16);
    const sig = await sendMemo({
      app:      "digdaya",
      ver:      "1.0",
      type:     transactionType,
      entity:   maskedId,
      hash:     hash.slice(0, 32),
      ts:       new Date().toISOString(),
    });
    res.json({
      success:          true,
      solana_signature: sig,
      hash,
      masked_entity:    maskedId,
      explorer:         `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      snap_bi_ver:      "2.0",
    });
  } catch (e: any) {
    console.error("TX error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/v1/credit-score", async (req: Request, res: Response) => {
  const { entityId, creditScore } = req.body;
  if (!entityId || creditScore === undefined) {
    res.status(400).json({ success: false, error: "Missing entityId or creditScore" });
    return;
  }
  try {
    const maskedId = crypto.createHmac("sha256", CONFIG.PII_SALT).update(entityId).digest("hex").slice(0, 16);
    const sig = await sendMemo({
      app:    "digdaya",
      ver:    "1.0",
      type:   "credit_score",
      entity: maskedId,
      score:  creditScore,
      ts:     new Date().toISOString(),
    });
    res.json({
      success:          true,
      solana_signature: sig,
      masked_entity:    maskedId,
      credit_score:     creditScore,
      explorer:         `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
    });
  } catch (e: any) {
    console.error("Credit error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: "Internal server error" });
});

initWallet();
app.listen(CONFIG.PORT, () => {
  console.log(`🚀 Digdaya API running on port ${CONFIG.PORT}`);
  console.log(`   Solana RPC  : ${CONFIG.RPC}`);
  console.log(`   Program ID  : ${CONFIG.PROGRAM_ID}`);
  console.log(`   SNAP BI ver : 2.0`);
});
