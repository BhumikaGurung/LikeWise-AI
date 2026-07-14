import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, flashcardSetsTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetFlashcardSetsResponse,
  CreateFlashcardSetBody,
  CreateFlashcardSetResponse,
  GetFlashcardSetParams,
  GetFlashcardSetResponse,
  DeleteFlashcardSetParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

const toRow = (s: typeof flashcardSetsTable.$inferSelect) => ({
  ...s,
  lastStudiedAt: s.lastStudiedAt?.toISOString() ?? null,
  createdAt: s.createdAt.toISOString(),
});

// GET /flashcards
router.get("/flashcards", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const sets = await db
    .select()
    .from(flashcardSetsTable)
    .where(eq(flashcardSetsTable.userId, user.id))
    .orderBy(desc(flashcardSetsTable.createdAt));

  const parsed = GetFlashcardSetsResponse.safeParse(sets.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /flashcards
router.post("/flashcards", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateFlashcardSetBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [set] = await db
    .insert(flashcardSetsTable)
    .values({
      userId: user.id,
      title: body.data.title,
      topic: body.data.topic,
      cardCount: body.data.cardCount ?? 0,
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "flashcard",
    title: `Created flashcard set: ${set.title}`,
    description: `${set.cardCount} cards on ${set.topic}`,
  });

  const parsed = CreateFlashcardSetResponse.safeParse(toRow(set));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /flashcards/:id
router.get("/flashcards/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFlashcardSetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [set] = await db
    .select()
    .from(flashcardSetsTable)
    .where(and(eq(flashcardSetsTable.id, params.data.id), eq(flashcardSetsTable.userId, user.id)));

  if (!set) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetFlashcardSetResponse.safeParse(toRow(set));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /flashcards/:id
router.delete("/flashcards/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFlashcardSetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(flashcardSetsTable)
    .where(and(eq(flashcardSetsTable.id, params.data.id), eq(flashcardSetsTable.userId, user.id)));

  res.status(204).send();
});

export default router;
