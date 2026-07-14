import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, pdfDocumentsTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetPdfsResponse,
  CreatePdfBody,
  CreatePdfResponse,
  GetPdfParams,
  GetPdfResponse,
  DeletePdfParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

const toRow = (p: typeof pdfDocumentsTable.$inferSelect) => ({
  ...p,
  pageCount: p.pageCount ?? null,
  createdAt: p.createdAt.toISOString(),
});

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

// POST /pdfs
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
