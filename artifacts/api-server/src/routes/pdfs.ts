import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, pdfDocumentsTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import {
  GetPdfsResponse,
  CreatePdfBody,
  CreatePdfResponse,
  GetPdfParams,
  GetPdfResponse,
  DeletePdfParams,
  ReprocessPdfParams,
  ReprocessPdfResponse,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";
import { processPdfText } from "../services/aiService";
const router: IRouter = Router();

// ─── Multer (in-memory, 20 MB limit, PDF only) ───────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

const toRow = (p: typeof pdfDocumentsTable.$inferSelect) => ({
  ...p,
  pageCount: p.pageCount ?? null,
  summary: p.summary ?? null,
  keyPoints: (p.keyPoints as string[] | null) ?? null,
  importantQuestions: (p.importantQuestions as string[] | null) ?? null,
  flashcards: (p.flashcards as { front: string; back: string }[] | null) ?? null,
  quiz: (p.quiz as { question: string; options: string[]; correctAnswer: string; explanation: string }[] | null) ?? null,
  errorMessage: p.errorMessage ?? null,
  createdAt: p.createdAt.toISOString(),
});

/**
 * Background processor: runs AI analysis and updates the DB record.
 * Called fire-and-forget after the upload response is sent.
 */
async function runPdfProcessing(docId: number, extractedText: string): Promise<void> {
  try {
    const result = await processPdfText(extractedText);
    await db
      .update(pdfDocumentsTable)
      .set({
        status: "ready",
        summary: result.summary,
        keyPoints: result.keyPoints,
        importantQuestions: result.importantQuestions,
        flashcards: result.flashcards,
        quiz: result.quiz,
        errorMessage: null,
      })
      .where(eq(pdfDocumentsTable.id, docId));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await db
      .update(pdfDocumentsTable)
      .set({ status: "error", errorMessage: msg })
      .where(eq(pdfDocumentsTable.id, docId));
  }
}

// GET /pdfs
router.get("/pdfs", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const docs = await db
    .select()
    .from(pdfDocumentsTable)
    .where(eq(pdfDocumentsTable.userId, user.id))
    .orderBy(desc(pdfDocumentsTable.createdAt));

  const parsed = GetPdfsResponse.safeParse(docs.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /pdfs/upload — multipart file upload + async AI processing
// NOTE: must be registered before /pdfs/:id to avoid "upload" matching the :id param
router.post(
  "/pdfs/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large. Maximum size is 20 MB." });
        } else {
          res.status(400).json({ error: `Upload error: ${err.message}` });
        }
        return;
      }
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : "Upload failed." });
        return;
      }
      next();
    });
  },
  async (req, res): Promise<void> => {
    const auth = getAuth(req);
    if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    if (!req.file) {
      res.status(400).json({ error: "No file provided. Send a PDF as multipart field 'file'." });
      return;
    }

    // ── Extract text ──────────────────────────────────────────────────────────
    let extractedText = "";
    let pageCount: number | null = null;
    try {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text ?? "";
      pageCount = pdfData.numpages ?? null;
    } catch {
      res.status(422).json({ error: "Could not parse the PDF. The file may be corrupted, password-protected, or contain only images." });
      return;
    }

    if (!extractedText.trim()) {
      res.status(422).json({ error: "This PDF appears to contain only images or no extractable text. Please upload a text-based PDF." });
      return;
    }

    // ── Persist record ────────────────────────────────────────────────────────
    const user = await getOrCreateUser(auth.userId);
    const [doc] = await db
      .insert(pdfDocumentsTable)
      .values({
        userId: user.id,
        fileName: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        pageCount,
        status: "processing",
        extractedText,
      })
      .returning();

    await db.insert(activityItemsTable).values({
      userId: user.id,
      type: "pdf",
      title: `Uploaded PDF: ${doc.originalName}`,
      description: `${Math.round(doc.fileSize / 1024)} KB · ${pageCount ?? "?"} pages`,
    });

    // ── Respond immediately, process in background ────────────────────────────
    const parsed = CreatePdfResponse.safeParse(toRow(doc));
    if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
    res.status(202).json(parsed.data);

    // Fire-and-forget
    runPdfProcessing(doc.id, extractedText).catch(() => {/* already handled inside */});
  }
);

// POST /pdfs/:id/reprocess — retry AI analysis for an existing record
router.post("/pdfs/:id/reprocess", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ReprocessPdfParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [doc] = await db
    .select()
    .from(pdfDocumentsTable)
    .where(and(eq(pdfDocumentsTable.id, params.data.id), eq(pdfDocumentsTable.userId, user.id)));

  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  if (!doc.extractedText?.trim()) {
    res.status(422).json({ error: "No extracted text available. Please re-upload the PDF." });
    return;
  }

  // Reset to processing
  const [updated] = await db
    .update(pdfDocumentsTable)
    .set({ status: "processing", errorMessage: null })
    .where(eq(pdfDocumentsTable.id, doc.id))
    .returning();

  const parsed = ReprocessPdfResponse.safeParse(toRow(updated));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(202).json(parsed.data);

  // Fire-and-forget
  runPdfProcessing(doc.id, doc.extractedText).catch(() => {/* already handled inside */});
});

// POST /pdfs — legacy JSON metadata registration (kept for backward compat)
router.post("/pdfs", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreatePdfBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [doc] = await db
    .insert(pdfDocumentsTable)
    .values({
      userId: user.id,
      fileName: body.data.fileName,
      originalName: body.data.originalName,
      fileSize: body.data.fileSize,
      pageCount: body.data.pageCount ?? null,
      status: "processing",
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "pdf",
    title: `Uploaded PDF: ${doc.originalName}`,
    description: `${Math.round(doc.fileSize / 1024)} KB`,
  });

  const parsed = CreatePdfResponse.safeParse(toRow(doc));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /pdfs/:id
router.get("/pdfs/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPdfParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [doc] = await db
    .select()
    .from(pdfDocumentsTable)
    .where(and(eq(pdfDocumentsTable.id, params.data.id), eq(pdfDocumentsTable.userId, user.id)));

  if (!doc) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetPdfResponse.safeParse(toRow(doc));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /pdfs/:id
router.delete("/pdfs/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePdfParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(pdfDocumentsTable)
    .where(and(eq(pdfDocumentsTable.id, params.data.id), eq(pdfDocumentsTable.userId, user.id)));

  res.status(204).send();
});

export default router;
