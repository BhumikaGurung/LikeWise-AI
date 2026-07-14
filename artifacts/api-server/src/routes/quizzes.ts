import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, quizzesTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetQuizzesResponse,
  CreateQuizBody,
  CreateQuizResponse,
  GetQuizParams,
  GetQuizResponse,
  DeleteQuizParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

// GET /quizzes
router.get("/quizzes", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const items = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.userId, user.id))
    .orderBy(desc(quizzesTable.createdAt));

  const parsed = GetQuizzesResponse.safeParse(
    items.map((q) => ({ ...q, score: q.score ?? null, createdAt: q.createdAt.toISOString() })),
  );
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /quizzes
router.post("/quizzes", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateQuizBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      userId: user.id,
      title: body.data.title,
      topic: body.data.topic,
      questionCount: body.data.questionCount,
      status: "pending",
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "quiz",
    title: `Created quiz: ${quiz.title}`,
    description: `${quiz.questionCount} questions on ${quiz.topic}`,
  });

  const parsed = CreateQuizResponse.safeParse({ ...quiz, score: quiz.score ?? null, createdAt: quiz.createdAt.toISOString() });
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /quizzes/:id
router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetQuizParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.userId, user.id)));

  if (!quiz) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetQuizResponse.safeParse({ ...quiz, score: quiz.score ?? null, createdAt: quiz.createdAt.toISOString() });
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /quizzes/:id
router.delete("/quizzes/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteQuizParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(quizzesTable)
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.userId, user.id)));

  res.status(204).send();
});

export default router;
