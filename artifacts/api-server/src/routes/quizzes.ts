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
  SubmitQuizBody,
  SubmitQuizParams,
  SubmitQuizResponse,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";
import { generateQuizQuestions, type QuizQuestion } from "../services/aiService";
import type { QuizDifficulty, QuizQuestionType } from "../prompts/index";

const router: IRouter = Router();

function toRow(q: typeof quizzesTable.$inferSelect) {
  return {
    ...q,
    subject: q.subject ?? "General",
    difficulty: (q.difficulty ?? "medium") as QuizDifficulty,
    questionType: (q.questionType ?? "mcq") as QuizQuestionType,
    questions: (q.questions as QuizQuestion[] | null) ?? null,
    score: q.score ?? null,
    totalCorrect: q.totalCorrect ?? null,
    totalWrong: q.totalWrong ?? null,
    timeTakenSeconds: q.timeTakenSeconds ?? null,
    createdAt: q.createdAt.toISOString(),
  };
}

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

  const parsed = GetQuizzesResponse.safeParse(items.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /quizzes — create + generate questions via AI service
router.post("/quizzes", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateQuizBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const {
    title,
    topic,
    subject = "General",
    difficulty = "medium",
    questionType = "mcq",
    questionCount,
  } = body.data;

  // Insert quiz in "generating" state first
  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      userId: user.id,
      title,
      subject,
      topic,
      difficulty,
      questionType,
      questionCount,
      status: "generating",
    })
    .returning();

  // Generate questions via AI service (currently stubbed)
  let questions: QuizQuestion[] = [];
  try {
    questions = await generateQuizQuestions(
      subject,
      topic,
      difficulty as QuizDifficulty,
      questionType as QuizQuestionType,
      questionCount,
    );
  } catch (err) {
    req.log.error({ err }, "Failed to generate quiz questions");
    await db.update(quizzesTable).set({ status: "archived" }).where(eq(quizzesTable.id, quiz.id));
    res.status(502).json({ error: "Failed to generate quiz questions" });
    return;
  }

  // Update quiz to "ready" with questions
  const [updated] = await db
    .update(quizzesTable)
    .set({ questions, status: "ready", questionCount: questions.length })
    .where(eq(quizzesTable.id, quiz.id))
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "quiz",
    title: `Generated quiz: ${updated.title}`,
    description: `${updated.questionCount} ${updated.questionType} questions on ${updated.topic} (${updated.difficulty})`,
  });

  const parsed = CreateQuizResponse.safeParse(toRow(updated));
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

  const parsed = GetQuizResponse.safeParse(toRow(quiz));
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

// POST /quizzes/:id/submit
router.post("/quizzes/:id/submit", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SubmitQuizParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = SubmitQuizBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.userId, user.id)));

  if (!quiz) { res.status(404).json({ error: "Not found" }); return; }

  const questions = (quiz.questions as QuizQuestion[]) ?? [];
  const answers = body.data.answers;
  const timeTaken = body.data.timeTakenSeconds;

  // Score each answer
  const results = questions.map((q) => {
    const submitted = answers.find((a) => a.questionId === q.id);
    const yourAnswer = submitted?.answer ?? "";
    const isCorrect = yourAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    return {
      questionId: q.id,
      question: q.question,
      yourAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      options: q.options ?? [],
    };
  });

  const totalCorrect = results.filter((r) => r.isCorrect).length;
  const totalWrong = results.length - totalCorrect;
  const score = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;

  // Persist result
  await db
    .update(quizzesTable)
    .set({ score, totalCorrect, totalWrong, timeTakenSeconds: timeTaken, status: "completed" })
    .where(eq(quizzesTable.id, quiz.id));

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "quiz",
    title: `Completed quiz: ${quiz.title}`,
    description: `Score ${score}% — ${totalCorrect}/${questions.length} correct (${quiz.difficulty})`,
  });

  const parsed = SubmitQuizResponse.safeParse({
    quizId: quiz.id,
    score,
    percentage: score,
    totalCorrect,
    totalWrong,
    timeTakenSeconds: timeTaken,
    results,
  });
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

export default router;
