import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { TextAnalyticsClient, AzureKeyCredential } from "@azure/ai-text-analytics";
import OpenAI from "openai";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import multer from "multer";
import PDFDocument from "pdfkit";
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

// ── Azure AI Language Client (Sentiment Analysis) ─────────────────────────
let langClient: TextAnalyticsClient | null = null;
function initAzureLanguage() {
  const key      = process.env.AZURE_LANGUAGE_KEY;
  const endpoint = process.env.AZURE_LANGUAGE_ENDPOINT;
  if(!key || !endpoint) { console.warn("⚠️  Azure Language not configured"); return; }
  langClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(key));
  console.log("✅ Azure AI Language ready (sentiment analysis)");
}
initAzureLanguage();

// ── OpenAI Client (Chat AI Brain) ──────────────────────────────────────────
// Uses standard OpenAI API (global, no region restrictions)
// Falls back to Azure OpenAI if OPENAI_API_KEY not set but Azure keys present
let openaiClient: OpenAI | null = null;
let aiSource = "none";

function initOpenAI() {
  // Priority 1: Standard OpenAI API (works globally without region issues)
  const standardKey = process.env.OPENAI_API_KEY;
  if (standardKey) {
    openaiClient = new OpenAI({ apiKey: standardKey });
    aiSource = "openai";
    console.log("✅ OpenAI ready (standard API)");
    return;
  }

  // Priority 2: Azure OpenAI (may have region restrictions)
  const azureKey      = process.env.AZURE_OPENAI_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeploy   = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  if (azureKey && azureEndpoint) {
    openaiClient = new OpenAI({
      apiKey:     azureKey,
      baseURL:    `${azureEndpoint}openai/deployments/${azureDeploy}`,
      defaultQuery: { "api-version": "2024-08-01-preview" },
      defaultHeaders: { "api-key": azureKey },
    });
    aiSource = "azure-openai";
    console.log("✅ Azure OpenAI ready (deployment:", azureDeploy, ")");
    return;
  }

  console.warn("⚠️  No OpenAI/Azure OpenAI configured — using local fallback only");
}
initOpenAI();

// ── Azure Blob Storage ───────────────────────────────────────────────────
const CHAT_CONTAINER = "chat-history";
let blobContainer: ContainerClient | null = null;

async function initBlobStorage() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION;
  if (!connStr) { console.warn("⚠️  Azure Blob Storage not configured"); return; }
  try {
    const blobService = BlobServiceClient.fromConnectionString(connStr);
    blobContainer = blobService.getContainerClient(CHAT_CONTAINER);
    await blobContainer.createIfNotExists({ access: undefined });
    console.log("✅ Azure Blob Storage ready (container:", CHAT_CONTAINER, ")");
  } catch (e: any) {
    console.warn("⚠️  Azure Blob Storage init error:", e.message);
  }
}

function hashEntityId(entityId: string): string {
  return crypto.createHmac("sha256", CONFIG.PII_SALT).update(entityId).digest("hex").slice(0, 24);
}

async function loadChatHistory(entityId: string): Promise<any[]> {
  if (!blobContainer) return [];
  const blobName = `${hashEntityId(entityId)}.json`;
  try {
    const blob = blobContainer.getBlockBlobClient(blobName);
    const exists = await blob.exists();
    if (!exists) return [];
    const downloaded = await blob.download(0);
    const body = await streamToString(downloaded.readableStreamBody!);
    return JSON.parse(body);
  } catch { return []; }
}

async function saveChatHistory(entityId: string, messages: any[]): Promise<void> {
  if (!blobContainer) return;
  const blobName = `${hashEntityId(entityId)}.json`;
  try {
    const blob = blobContainer.getBlockBlobClient(blobName);
    const content = JSON.stringify(messages, null, 2);
    await blob.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });
  } catch (e: any) {
    console.error("Blob save error:", e.message);
  }
}

async function streamToString(readable: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}

// ── Azure AI Language: Sentiment Analysis ─────────────────────────────────
async function analyzeSentiment(text: string, lang: string = "id"): Promise<{sentiment: string; confidence: number; keyPhrases: string[]}> {
  const defaultResult = { sentiment: "neutral", confidence: 0, keyPhrases: [] as string[] };
  if (!langClient) return defaultResult;
  try {
    const sentimentResults = await langClient.analyzeSentiment([text], lang === "en" ? "en" : "id");
    const keyPhraseResults = await langClient.extractKeyPhrases([text], lang === "en" ? "en" : "id");

    const sr = sentimentResults[0] as any;
    const kr = keyPhraseResults[0] as any;

    if (sr.error) return defaultResult;

    const sentiment = sr.sentiment || "neutral";
    const confidence = sr.confidenceScores?.[sentiment] || 0;
    const keyPhrases = (!kr.error && kr.keyPhrases) ? kr.keyPhrases.slice(0, 5) : [];

    return { sentiment, confidence, keyPhrases };
  } catch (e: any) {
    console.error("Sentiment analysis error:", e.message);
    return defaultResult;
  }
}

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
    ai_source:    aiSource,
    azure_lang:   !!langClient,
    blob_storage: !!blobContainer,
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

// ── Sentiment Analysis Endpoint (Azure AI Language) ──────────────────────
app.post("/api/v1/analyze-sentiment", async (req: Request, res: Response) => {
  const { text, lang } = req.body;
  if (!text) { res.status(400).json({ success: false, error: "Text required" }); return; }
  try {
    const result = await analyzeSentiment(text, lang || "id");
    res.json({
      success: true,
      ...result,
      service: langClient ? "azure-ai-language" : "unavailable",
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Chat History Endpoints (Azure Blob Storage) ──────────────────────────
app.get("/api/v1/chat-history/:entityId", async (req: Request, res: Response) => {
  const entityId = req.params.entityId as string;
  if (!entityId) { res.status(400).json({ success: false, error: "Missing entityId" }); return; }
  try {
    const history = await loadChatHistory(entityId);
    res.json({ success: true, messages: history, storage: blobContainer ? "azure-blob" : "unavailable" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/v1/chat-history", async (req: Request, res: Response) => {
  const { entityId, messages } = req.body;
  if (!entityId || !messages) { res.status(400).json({ success: false, error: "Missing entityId or messages" }); return; }
  try {
    await saveChatHistory(entityId, messages);
    res.json({ success: true, saved: messages.length, storage: blobContainer ? "azure-blob" : "unavailable" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete("/api/v1/chat-history/:entityId", async (req: Request, res: Response) => {
  const entityId = req.params.entityId as string;
  if (!entityId) { res.status(400).json({ success: false, error: "Missing entityId" }); return; }
  try {
    if (blobContainer) {
      const blobName = `${hashEntityId(entityId)}.json`;
      const blob = blobContainer.getBlockBlobClient(blobName);
      await blob.deleteIfExists();
    }
    res.json({ success: true, deleted: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── AI Advisor Chat (OpenAI + Azure AI Language Sentiment) ───────────────
app.post("/api/v1/ai-advisor", async (req: Request, res: Response) => {
  const {
    message, history: chatHistory,
    creditScore, bizType, onTimePayment, deliveryRate, digitalRatio,
    monthlyRevenue, monthlyExpense, lang, entityId
  } = req.body;
  if (!message) { res.status(400).json({ success: false, error: "Message required" }); return; }

  // Smart fallback: picks a contextually different tip each call
  const fallbackResponse = (msg: string, score: number): string => {
    const msgLower = msg.toLowerCase();
    if (msgLower.includes("pinjam") || msgLower.includes("loan") || msgLower.includes("limit")) {
      const max = score >= 740 ? "Rp 150 juta" : score >= 670 ? "Rp 75 juta" : score >= 580 ? "Rp 25 juta" : "Rp 10 juta";
      return lang==="en"
        ? `Based on your score of ${score}/850, your estimated maximum credit limit is ${max}. Improve your score to access higher limits.`
        : `Berdasarkan skor ${score}/850, estimasi limit kredit Anda adalah ${max}. Tingkatkan skor untuk limit lebih tinggi.`;
    }
    if (msgLower.includes("digital") || msgLower.includes("online") || msgLower.includes("tokopedia") || msgLower.includes("shopee")) {
      return lang==="en"
        ? `Expanding to digital platforms like Tokopedia or Shopee can increase your digital signal score by 15–25 points. Start with one platform and build from there.`
        : `Berjualan di Tokopedia atau Shopee bisa menambah sinyal digital Anda 15–25 poin. Mulai dari satu platform, bangun secara konsisten.`;
    }
    if (msgLower.includes("supplier") || msgLower.includes("bayar") || msgLower.includes("payment")) {
      return lang==="en"
        ? `On-time payment to suppliers is the #1 behavioral factor in your score. Even one late payment can drop your score by 20–40 points.`
        : `Pembayaran tepat waktu ke supplier adalah faktor behavioral terbesar. Satu keterlambatan bisa menurunkan skor 20–40 poin.`;
    }
    if (score < 580) return lang==="en"
      ? `Your score of ${score} is in the 'needs improvement' zone. Focus on: (1) paying suppliers on time, (2) increasing digital sales, (3) documenting all transactions consistently.`
      : `Skor ${score} Anda berada di zona 'perlu ditingkatkan'. Fokus pada: (1) bayar supplier tepat waktu, (2) perluas penjualan digital, (3) dokumentasikan semua transaksi.`;
    if (score < 670) return lang==="en"
      ? `Your score of ${score} is fair. You're close to the 'Good' tier (670+). Boost your on-time payment rate to above 90% and expand digital channels.`
      : `Skor ${score} Anda sudah lumayan. Anda dekat ke tier 'Baik' (670+). Tingkatkan pembayaran tepat waktu ke 90%+ dan perluas kanal digital.`;
    return lang==="en"
      ? `Your score of ${score} is great! Maintain payment consistency and consider applying for a higher credit limit to support business expansion.`
      : `Skor ${score} Anda sudah bagus! Pertahankan konsistensi bayar dan pertimbangkan ajukan limit lebih tinggi untuk ekspansi usaha.`;
  };

  // Run sentiment analysis on user message (Azure AI Language)
  let sentiment: any = null;
  try {
    sentiment = await analyzeSentiment(message, lang || "id");
  } catch {}

  // Validate and clean incoming chat history
  const validHistory: {role: string; content: string}[] = Array.isArray(chatHistory)
    ? chatHistory
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
        .slice(-16) // keep last 16 messages (8 turns) for context without overflowing tokens
    : [];

  try {
    if (!openaiClient) {
      res.json({
        success: true,
        reply: fallbackResponse(message, creditScore||500),
        source: "local",
        sentiment: sentiment?.sentiment,
        keyPhrases: sentiment?.keyPhrases,
      });
      return;
    }

    const netCashflow = parseInt(monthlyRevenue||"0") - parseInt(monthlyExpense||"0");
    const cashflowHealth = netCashflow > 0 ? (lang==="en" ? "positive" : "positif") : (lang==="en" ? "negative (expenses exceed revenue)" : "negatif (pengeluaran melebihi pendapatan)");

    const systemPrompt = lang === "en"
      ? `You are DigdayaAI, an expert credit advisor for Indonesian SME (UMKM) owners. You speak with warmth, clarity, and expertise.

User Profile:
- Credit Score: ${creditScore || "unknown"}/850 (${creditScore >= 740 ? "Excellent" : creditScore >= 670 ? "Good" : creditScore >= 580 ? "Fair" : "Needs Improvement"})
- Business Type: ${bizType || "not specified"}
- On-Time Payment Rate: ${onTimePayment || "unknown"}%
- Delivery Success Rate: ${deliveryRate || "unknown"}%
- Digital Sales Ratio: ${digitalRatio || "unknown"}%
- Monthly Revenue: Rp ${parseInt(monthlyRevenue||"0").toLocaleString("id-ID")}
- Monthly Expenses: Rp ${parseInt(monthlyExpense||"0").toLocaleString("id-ID")}
- Cashflow: ${cashflowHealth}
${sentiment ? `\nUser sentiment: ${sentiment.sentiment} | Key topics: ${sentiment.keyPhrases?.join(", ") || "none"}` : ""}

Rules:
- Give personalized, specific advice referencing their actual data
- NEVER repeat the same advice you gave in previous turns
- Vary your response style: sometimes give numbered steps, sometimes ask a follow-up question, sometimes share a quick insight
- Keep response to 2–4 sentences max
- Always be encouraging and constructive`
      : `Kamu adalah DigdayaAI, konsultan kredit ahli untuk pelaku UMKM Indonesia. Kamu berbicara dengan hangat, jelas, dan profesional.

Profil Pengguna:
- Skor Kredit: ${creditScore || "belum diketahui"}/850 (${creditScore >= 740 ? "Sangat Baik" : creditScore >= 670 ? "Baik" : creditScore >= 580 ? "Cukup" : "Perlu Ditingkatkan"})
- Jenis Usaha: ${bizType || "belum ditentukan"}
- Pembayaran Tepat Waktu: ${onTimePayment || "belum diketahui"}%
- Tingkat Delivery: ${deliveryRate || "belum diketahui"}%
- Rasio Digital: ${digitalRatio || "belum diketahui"}%
- Pendapatan Bulanan: Rp ${parseInt(monthlyRevenue||"0").toLocaleString("id-ID")}
- Pengeluaran Bulanan: Rp ${parseInt(monthlyExpense||"0").toLocaleString("id-ID")}
- Arus Kas: ${cashflowHealth}
${sentiment ? `\nSentimen pesan: ${sentiment.sentiment} | Topik kunci: ${sentiment.keyPhrases?.join(", ") || "tidak ada"}` : ""}

Aturan:
- Berikan saran personal dan spesifik merujuk data pengguna yang ada
- JANGAN pernah mengulang saran yang sama dengan giliran sebelumnya
- Variasikan gaya respons: kadang langkah bernomor, kadang tanya balik, kadang bagi insight singkat
- Jawab maksimal 2–4 kalimat
- Selalu bersikap mendorong dan konstruktif`;

    // Build messages array with full conversation history for context
    const openaiMessages: {role: "system"|"user"|"assistant"; content: string}[] = [
      { role: "system", content: systemPrompt },
      ...validHistory.map((m: any) => ({ role: m.role as "user"|"assistant", content: m.content })),
      { role: "user", content: message },
    ];

    const response = await openaiClient.chat.completions.create({
      model: aiSource === "azure-openai" ? (process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o") : "gpt-4o-mini",
      messages: openaiMessages,
      max_tokens: 400,
      temperature: 0.85,
      presence_penalty: 0.7,   // penalize topics already discussed
      frequency_penalty: 0.4,  // penalize repeated phrases/words
    });

    const reply = response.choices[0]?.message?.content?.trim() || fallbackResponse(message, creditScore||500);

    // Auto-save conversation to Azure Blob Storage
    if (entityId) {
      try {
        const blobHistory = await loadChatHistory(entityId);
        blobHistory.push(
          { role: "user", content: message, time: new Date().toISOString(), sentiment: sentiment?.sentiment },
          { role: "assistant", content: reply, source: aiSource, time: new Date().toISOString() }
        );
        await saveChatHistory(entityId, blobHistory.slice(-100));
      } catch {}
    }

    res.json({
      success: true,
      reply,
      source: aiSource,
      sentiment: sentiment?.sentiment,
      keyPhrases: sentiment?.keyPhrases,
    });

  } catch(e: any) {
    console.error("AI advisor error:", e.message);
    res.json({
      success: true,
      reply: fallbackResponse(message, creditScore||500),
      source: "fallback",
      sentiment: sentiment?.sentiment,
      keyPhrases: sentiment?.keyPhrases,
    });
  }
});

// ── Feature C: Document AI Scanner (OpenAI Vision) ──────────────────────
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

app.post("/api/v1/scan-document", upload.single("file"), async (req: Request, res: Response) => {
  const file = (req as any).file;
  const docType = req.body.docType || "NIB"; // NIB, SKDU, KTP

  if (!file) { res.status(400).json({ success: false, error: "No file uploaded" }); return; }

  try {
    if (!openaiClient) {
      // Cleanup file
      fs.unlinkSync(file.path);
      res.status(503).json({ success: false, error: "AI not configured for document scanning" });
      return;
    }

    // Read file as base64
    const fileBuffer = fs.readFileSync(file.path);
    const base64Image = fileBuffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";

    const prompt = docType === "NIB"
      ? `You are an expert OCR system specialized in Indonesian government business documents.
Analyze this NIB (Nomor Induk Berusaha) document image carefully.

Extract EXACTLY these fields (use empty string "" if a field is not clearly visible):
- nib: The 13-digit NIB number (digits only, no spaces/dashes)
- bizName: Full business/company name as written
- bizType: Business category or KBLI code
- ownerName: Full name of the business owner/director
- address: Complete business address
- issueDate: Issue date in original format

Return ONLY valid JSON, no markdown, no explanation:
{ "nib": "", "bizName": "", "bizType": "", "ownerName": "", "address": "", "issueDate": "" }`
      : docType === "SKDU"
      ? `You are an expert OCR system specialized in Indonesian local government documents.
Analyze this SKDU (Surat Keterangan Domisili Usaha) document image carefully.

Extract EXACTLY these fields (use empty string "" if not clearly visible):
- docNumber: Official document number (Nomor Surat)
- bizName: Full business name
- ownerName: Full name of business owner
- address: Complete business address
- village: Kelurahan/Desa name
- district: Kecamatan name
- issueDate: Issue date in original format

Return ONLY valid JSON, no markdown, no explanation:
{ "docNumber": "", "bizName": "", "ownerName": "", "address": "", "village": "", "district": "", "issueDate": "" }`
      : `You are an expert OCR system specialized in Indonesian national ID cards (KTP).
Analyze this KTP (Kartu Tanda Penduduk) image carefully.

Extract EXACTLY these fields (use empty string "" if not clearly visible):
- nik: The 16-digit NIK number (digits only)
- name: Full name (Nama) as written
- birthPlaceDate: Combined birth place and date (Tempat/Tgl Lahir)
- address: Full address (Alamat)
- rtRw: RT/RW numbers
- village: Kelurahan/Desa
- district: Kecamatan

Return ONLY valid JSON, no markdown, no explanation:
{ "nik": "", "name": "", "birthPlaceDate": "", "address": "", "rtRw": "", "village": "", "district": "" }`;

    const response = await openaiClient.chat.completions.create({
      model: aiSource === "azure-openai" ? (process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o") : "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" } }
          ],
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    // Cleanup uploaded file
    fs.unlinkSync(file.path);

    const content = response.choices[0]?.message?.content || "{}";
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    res.json({
      success: true,
      docType,
      extracted,
      source: aiSource,
      raw: content,
    });

  } catch (e: any) {
    // Cleanup on error
    try { fs.unlinkSync(file.path); } catch {}
    console.error("Document scan error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── Feature D: Commodity Price Data (PIHPS-inspired) ────────────────────
const COMMODITIES = [
  { id: "beras_medium", name: "Beras Medium", unit: "kg", basePrice: 13500, category: "Beras" },
  { id: "beras_premium", name: "Beras Premium", unit: "kg", basePrice: 15200, category: "Beras" },
  { id: "gula_pasir", name: "Gula Pasir", unit: "kg", basePrice: 17800, category: "Gula" },
  { id: "minyak_goreng", name: "Minyak Goreng", unit: "liter", basePrice: 18500, category: "Minyak" },
  { id: "daging_sapi", name: "Daging Sapi", unit: "kg", basePrice: 135000, category: "Daging" },
  { id: "daging_ayam", name: "Daging Ayam", unit: "kg", basePrice: 37500, category: "Daging" },
  { id: "telur_ayam", name: "Telur Ayam", unit: "kg", basePrice: 28500, category: "Telur" },
  { id: "cabai_merah", name: "Cabai Merah Keriting", unit: "kg", basePrice: 42000, category: "Cabai" },
  { id: "cabai_rawit", name: "Cabai Rawit Merah", unit: "kg", basePrice: 48000, category: "Cabai" },
  { id: "bawang_merah", name: "Bawang Merah", unit: "kg", basePrice: 38000, category: "Bumbu" },
  { id: "bawang_putih", name: "Bawang Putih", unit: "kg", basePrice: 42000, category: "Bumbu" },
  { id: "kedelai", name: "Kedelai Impor", unit: "kg", basePrice: 12500, category: "Kacang" },
];

function generateCommodityData(days: number = 30) {
  const now = new Date();
  return COMMODITIES.map(c => {
    const history = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));
      // Simulate realistic price movements with seasonal patterns
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const seasonal = Math.sin(dayOfYear / 365 * Math.PI * 2) * 0.05; // 5% seasonal
      const trend = (i / days) * 0.02; // slight uptrend
      const noise = (Math.random() - 0.5) * 0.08; // 8% random noise
      const factor = 1 + seasonal + trend + noise;
      const price = Math.round(c.basePrice * factor);
      return {
        date: date.toISOString().split("T")[0],
        price,
        change: i > 0 ? 0 : 0, // will be calculated
      };
    });
    // Calculate daily changes
    for (let i = 1; i < history.length; i++) {
      history[i].change = Number(((history[i].price - history[i - 1].price) / history[i - 1].price * 100).toFixed(2));
    }
    const latest = history[history.length - 1].price;
    const weekAgo = history[Math.max(0, history.length - 8)]?.price || latest;
    const monthAgo = history[0].price;
    return {
      ...c,
      currentPrice: latest,
      weeklyChange: Number(((latest - weekAgo) / weekAgo * 100).toFixed(2)),
      monthlyChange: Number(((latest - monthAgo) / monthAgo * 100).toFixed(2)),
      history,
      inflationRisk: Math.abs(((latest - monthAgo) / monthAgo * 100)) > 10 ? "high" : Math.abs(((latest - monthAgo) / monthAgo * 100)) > 5 ? "medium" : "low",
    };
  });
}

app.get("/api/v1/commodity-prices", (_req: Request, res: Response) => {
  const days = parseInt((_req.query.days as string) || "30");
  const data = generateCommodityData(Math.min(days, 90));
  const avgInflation = data.reduce((sum, c) => sum + c.monthlyChange, 0) / data.length;
  res.json({
    success: true,
    source: "pihps-simulated",
    updated: new Date().toISOString(),
    commodities: data,
    summary: {
      totalItems: data.length,
      avgMonthlyInflation: Number(avgInflation.toFixed(2)),
      highRiskItems: data.filter(c => c.inflationRisk === "high").map(c => c.name),
      riskLevel: avgInflation > 5 ? "high" : avgInflation > 2 ? "medium" : "low",
    },
  });
});

// ── Feature E: PDF Credit Report Export ──────────────────────────────────
app.post("/api/v1/generate-report-pdf", async (req: Request, res: Response) => {
  const { user, umkm, score, txSig, txHash, txExplorer, maskedEntity, loanAmount, tenor, lang } = req.body;
  if (!user || !score) { res.status(400).json({ success: false, error: "Missing user or score data" }); return; }

  try {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Digdaya_Credit_Report_${user.name || "User"}.pdf"`);
      res.send(pdfBuffer);
    });

    const isId = lang !== "en";
    const sc = score >= 740 ? "Excellent" : score >= 670 ? "Good" : score >= 580 ? "Fair" : "Poor";
    const maxLoan = score >= 740 ? 150000000 : score >= 670 ? 75000000 : score >= 580 ? 25000000 : score >= 520 ? 10000000 : 0;

    // ── Header ──
    doc.rect(0, 0, 595.28, 100).fill("#0A1628");
    doc.fontSize(24).fill("#02C39A").text("DIGDAYA", 50, 30, { continued: true })
       .fontSize(10).fill("#94A3B8").text("  Credit Intelligence Report", { baseline: "middle" });
    doc.fontSize(8).fill("#64748B").text("Powered by AI · Solana Blockchain · Azure Cloud", 50, 60);
    doc.fontSize(8).fill("#475569").text(`Generated: ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`, 50, 75);

    doc.moveDown(3);

    // ── Borrower Info ──
    doc.fontSize(14).fill("#1E293B").text(isId ? "Profil Peminjam" : "Borrower Profile", 50, 120);
    doc.moveTo(50, 138).lineTo(545, 138).stroke("#E2E8F0");
    doc.moveDown(0.5);

    const infoY = 148;
    const info = [
      [isId ? "Nama" : "Name", user.name || "-"],
      [isId ? "Usaha" : "Business", umkm?.bizName || "-"],
      [isId ? "Jenis" : "Type", umkm?.bizType || "-"],
      [isId ? "Lokasi" : "Location", [umkm?.cityName, umkm?.provinceName].filter(Boolean).join(", ") || "-"],
      [isId ? "Pendapatan/Bulan" : "Revenue/Month", umkm?.monthlyRevenue ? `Rp ${parseInt(umkm.monthlyRevenue).toLocaleString("id-ID")}` : "-"],
      [isId ? "Pengeluaran/Bulan" : "Expenses/Month", umkm?.monthlyExpense ? `Rp ${parseInt(umkm.monthlyExpense).toLocaleString("id-ID")}` : "-"],
    ];
    info.forEach(([k, v], i) => {
      const y = infoY + i * 18;
      doc.fontSize(9).fill("#64748B").text(k as string, 60, y, { width: 140 });
      doc.fontSize(9).fill("#1E293B").text(v as string, 200, y, { width: 340 });
    });

    // ── Credit Score ──
    const scoreY = infoY + info.length * 18 + 20;
    doc.fontSize(14).fill("#1E293B").text(isId ? "Skor Kredit" : "Credit Score", 50, scoreY);
    doc.moveTo(50, scoreY + 18).lineTo(545, scoreY + 18).stroke("#E2E8F0");

    // Score display
    const scoreBoxY = scoreY + 30;
    const scoreColor = score >= 740 ? "#02C39A" : score >= 670 ? "#028090" : score >= 580 ? "#F4A261" : "#EF4444";
    doc.roundedRect(60, scoreBoxY, 120, 80, 10).fill(scoreColor);
    doc.fontSize(36).fill("#FFFFFF").text(score.toString(), 60, scoreBoxY + 12, { width: 120, align: "center" });
    doc.fontSize(10).fill("#FFFFFF").text(sc, 60, scoreBoxY + 55, { width: 120, align: "center" });

    // Score bar
    doc.fontSize(9).fill("#64748B").text(isId ? "Rentang Skor: 300 — 850" : "Score Range: 300 — 850", 200, scoreBoxY + 5);
    doc.rect(200, scoreBoxY + 22, 330, 8).fill("#E2E8F0");
    const barWidth = Math.max(5, ((score - 300) / 550) * 330);
    doc.rect(200, scoreBoxY + 22, barWidth, 8).fill(scoreColor);

    // Score breakdown
    const metrics = [
      [isId ? "Bayar Tepat Waktu" : "On-Time Payment", `${umkm?.onTimePayment || 0}%`],
      [isId ? "Sukses Delivery" : "Delivery Rate", `${umkm?.deliveryRate || 0}%`],
      [isId ? "Rasio Digital" : "Digital Ratio", `${umkm?.digitalRatio || 0}%`],
      [isId ? "Plafon Maksimum" : "Max Credit Limit", `Rp ${maxLoan.toLocaleString("id-ID")}`],
    ];
    metrics.forEach(([k, v], i) => {
      const y = scoreBoxY + 42 + i * 16;
      doc.fontSize(9).fill("#64748B").text(k as string, 200, y, { width: 160 });
      doc.fontSize(9).fill("#1E293B").text(v as string, 380, y, { width: 150 });
    });

    // ── Loan Application ──
    if (loanAmount && loanAmount > 0) {
      const loanY = scoreBoxY + 130;
      doc.fontSize(14).fill("#1E293B").text(isId ? "Detail Pengajuan Kredit" : "Credit Application Details", 50, loanY);
      doc.moveTo(50, loanY + 18).lineTo(545, loanY + 18).stroke("#E2E8F0");
      const loanInfo = [
        [isId ? "Nominal Pinjaman" : "Loan Amount", `Rp ${parseInt(loanAmount).toLocaleString("id-ID")}`],
        [isId ? "Tenor" : "Tenor", `${tenor || 12} ${isId ? "bulan" : "months"}`],
      ];
      loanInfo.forEach(([k, v], i) => {
        doc.fontSize(9).fill("#64748B").text(k as string, 60, loanY + 28 + i * 18, { width: 160 });
        doc.fontSize(9).fill("#1E293B").text(v as string, 220, loanY + 28 + i * 18, { width: 300 });
      });
    }

    // ── AI Recommendations ──
    doc.addPage();
    doc.rect(0, 0, 595.28, 50).fill("#0A1628");
    doc.fontSize(14).fill("#02C39A").text(isId ? "Rekomendasi AI" : "AI Recommendations", 50, 18);

    const recommendations = [
      { title: isId ? "Perluas Channel Digital" : "Expand Digital Channels", desc: isId ? "Tokopedia, Shopee, atau GoFood meningkatkan sinyal digital +15-25 poin pada model AI." : "Tokopedia, Shopee, or GoFood increases digital signal +15-25 points.", impact: "+15-25" },
      { title: isId ? "Konsistensi Pembayaran" : "Payment Consistency", desc: isId ? "On-time payment >90% memberikan dampak terbesar pada behavioral scoring." : "On-time payment >90% has biggest behavioral impact.", impact: "+20-30" },
      { title: isId ? "Lengkapi Dokumen" : "Complete Documents", desc: isId ? "SKDU dari kelurahan menambah kepercayaan lender dan skor +12 poin." : "SKDU from local office adds lender trust +12 points.", impact: "+12" },
      { title: isId ? "Diversifikasi Pelanggan" : "Customer Diversification", desc: isId ? "Pelanggan unik >50/bulan menunjukkan pasar yang stabil dan mengurangi risiko." : "Unique customers >50/month shows stable market.", impact: "+10-20" },
    ];

    recommendations.forEach((r, i) => {
      const y = 70 + i * 65;
      doc.roundedRect(50, y, 495, 55, 6).fill("#F8FAFC").stroke("#E2E8F0");
      doc.fontSize(11).fill("#1E293B").text(r.title, 65, y + 10, { width: 350 });
      doc.fontSize(8).fill("#64748B").text(r.desc, 65, y + 26, { width: 380 });
      doc.roundedRect(460, y + 12, 70, 24, 4).fill("#02C39A");
      doc.fontSize(10).fill("#FFFFFF").text(r.impact, 460, y + 17, { width: 70, align: "center" });
    });

    // ── Blockchain Proof ──
    const blockY = 70 + recommendations.length * 65 + 20;
    doc.fontSize(14).fill("#1E293B").text(isId ? "Bukti Blockchain" : "Blockchain Proof", 50, blockY);
    doc.moveTo(50, blockY + 18).lineTo(545, blockY + 18).stroke("#E2E8F0");

    const blockInfo = [
      ["Program ID", "7L1FRY6iPwCYoppBWEdTzMh1EsyKwubQc1U1YXnTLUeE"],
      ["Network", "Solana Devnet"],
      ["TX Signature", txSig || "—"],
      ["TX Hash", txHash || "—"],
      ["Masked Entity", maskedEntity || "—"],
      ["Timestamp", new Date().toISOString()],
    ];
    blockInfo.forEach(([k, v], i) => {
      const y = blockY + 28 + i * 16;
      doc.fontSize(8).fill("#64748B").text(k as string, 60, y, { width: 100 });
      doc.fontSize(7).fill("#475569").text((v as string).slice(0, 70), 165, y, { width: 370 });
    });

    // ── Footer ──
    const footY = blockY + 28 + blockInfo.length * 16 + 30;
    doc.moveTo(50, footY).lineTo(545, footY).stroke("#E2E8F0");
    doc.fontSize(7).fill("#94A3B8").text("© 2026 Digdaya — AI-Powered Credit Intelligence for Indonesian SMEs", 50, footY + 8, { align: "center", width: 495 });
    doc.fontSize(7).fill("#94A3B8").text("UU PDP Compliant · SNAP BI v2 · OJK Sandbox · Solana Devnet", 50, footY + 20, { align: "center", width: 495 });
    doc.fontSize(6).fill("#CBD5E1").text(isId ? "Laporan ini dihasilkan secara otomatis oleh sistem AI Digdaya. Keputusan akhir kredit ada di tangan lender." : "This report is auto-generated by Digdaya AI. Final credit decision rests with the lender.", 50, footY + 36, { align: "center", width: 495 });

    doc.end();

  } catch (e: any) {
    console.error("PDF generation error:", e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: "Internal server error" });
});

initWallet();

// Init blob storage then start server
initBlobStorage().then(() => {
  app.listen(CONFIG.PORT, () => {
    console.log(`🚀 Digdaya API running on port ${CONFIG.PORT}`);
    console.log(`   Solana RPC  : ${CONFIG.RPC}`);
    console.log(`   Program ID  : ${CONFIG.PROGRAM_ID}`);
    console.log(`   AI Brain    : ${aiSource}`);
    console.log(`   Azure Lang  : ${langClient ? "connected" : "unavailable"}`);
    console.log(`   Blob Storage: ${blobContainer ? "connected" : "unavailable"}`);
    console.log(`   SNAP BI ver : 2.0`);
  });
});
