import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetNotesResponse,
  CreateNoteBody,
  CreateNoteResponse,
  GetNoteParams,
  GetNoteResponse,
  UpdateNoteParams,
  UpdateNoteBody,
  UpdateNoteResponse,
  DeleteNoteParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

const toRow = (n: typeof notesTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

// GET /notes
router.get("/notes", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const notes = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, user.id))
    .orderBy(desc(notesTable.updatedAt));

  const parsed = GetNotesResponse.safeParse(notes.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /notes
router.post("/notes", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateNoteBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [note] = await db
    .insert(notesTable)
    .values({
      userId: user.id,
      title: body.data.title,
      content: body.data.content ?? "",
      isPinned: body.data.isPinned ?? false,
      isFavorite: body.data.isFavorite ?? false,
      color: body.data.color ?? "white",
    })
    .returning();

  const parsed = CreateNoteResponse.safeParse(toRow(note));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /notes/:id
router.get("/notes/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetNoteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [note] = await db
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, user.id)));

  if (!note) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetNoteResponse.safeParse(toRow(note));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// PATCH /notes/:id
router.patch("/notes/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateNoteParams.safeParse({ id: parseInt(raw, 10) });
  const body = UpdateNoteBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [updated] = await db
    .update(notesTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, user.id)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = UpdateNoteResponse.safeParse(toRow(updated));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /notes/:id
router.delete("/notes/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteNoteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, params.data.id), eq(notesTable.userId, user.id)));

  res.status(204).send();
});

export default router;
