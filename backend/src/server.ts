import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import { AzureOpenAI } from "openai";
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

// Azure OpenAI Client
let azureAI: AzureOpenAI | null = null;
function initAzureAI() {
  const key      = process.env.AZURE_OPENAI_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploy   = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  if(!key || !endpoint) { console.warn("⚠️  Azure OpenAI not configured"); return; }
  azureAI = new AzureOpenAI({ apiKey: key, endpoint, apiVersion: "2024-02-01", deployment: deploy });
  console.log("✅ Azure OpenAI ready");
}
initAzureAI();

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

// ── AI Advisor Chat ──────────────────────────────────────────────────────
app.post("/api/v1/ai-advisor", async (req: Request, res: Response) => {
  const { message, creditScore, bizType, onTimePayment, deliveryRate, digitalRatio, monthlyRevenue, monthlyExpense, lang } = req.body;
  if (!message) { res.status(400).json({ success: false, error: "Message required" }); return; }

  const fallbackResponse = (msg: string, score: number) => {
    const tips: string[] = [];
    if (score < 580) tips.push(lang==="en" ? "Focus on paying suppliers on time to boost your behavioral score." : "Fokus bayar supplier tepat waktu untuk meningkatkan skor behavioral.");
    if (score < 670) tips.push(lang==="en" ? "Expand your digital sales channels (Tokopedia, Shopee) to increase digital signal." : "Perluas penjualan digital (Tokopedia, Shopee) untuk meningkatkan sinyal digital.");
    if (score >= 670) tips.push(lang==="en" ? "Your score is good! Maintain consistency and consider applying for a higher limit." : "Skor Anda sudah bagus! Pertahankan konsistensi dan pertimbangkan limit lebih tinggi.");
    return tips[0] || (lang==="en" ? "Keep improving your business metrics for a better score." : "Terus tingkatkan metrik usaha Anda untuk skor yang lebih baik.");
  };

  try {
    if (!azureAI) {
      res.json({ success: true, reply: fallbackResponse(message, creditScore||500), source: "local" });
      return;
    }

    const systemPrompt = lang === "en"
      ? `You are ModalAI's friendly credit advisor helping Indonesian SME (UMKM) owners understand and improve their credit scores.\nThe user's profile:\n- Credit Score: ${creditScore || "unknown"}/850\n- Business Type: ${bizType || "unknown"}\n- On-Time Payment Rate: ${onTimePayment || "unknown"}%\n- Delivery Success Rate: ${deliveryRate || "unknown"}%\n- Digital Sales Ratio: ${digitalRatio || "unknown"}%\n- Monthly Revenue: Rp ${parseInt(monthlyRevenue||"0").toLocaleString("id-ID")}\n- Monthly Expense: Rp ${parseInt(monthlyExpense||"0").toLocaleString("id-ID")}\n\nRespond helpfully, concisely (max 3 sentences), and in English. Give specific actionable advice based on their profile.`
      : `Kamu adalah konsultan kredit ModalAI yang ramah, membantu pelaku UMKM Indonesia memahami dan meningkatkan skor kredit mereka.\nProfil pengguna:\n- Skor Kredit: ${creditScore || "belum diketahui"}/850\n- Jenis Usaha: ${bizType || "belum diketahui"}\n- Pembayaran Tepat Waktu: ${onTimePayment || "belum diketahui"}%\n- Tingkat Delivery: ${deliveryRate || "belum diketahui"}%\n- Rasio Digital: ${digitalRatio || "belum diketahui"}%\n- Pendapatan Bulanan: Rp ${parseInt(monthlyRevenue||"0").toLocaleString("id-ID")}\n- Pengeluaran Bulanan: Rp ${parseInt(monthlyExpense||"0").toLocaleString("id-ID")}\n\nJawab dengan ramah, singkat (maks 3 kalimat), dalam Bahasa Indonesia. Berikan saran spesifik dan actionable berdasarkan profil mereka.`;

    const response = await azureAI.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || fallbackResponse(message, creditScore||500);
    res.json({ success: true, reply, source: "azure" });

  } catch(e: any) {
    console.error("Azure AI error:", e.message);
    res.json({ success: true, reply: fallbackResponse(message, creditScore||500), source: "fallback" });
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
