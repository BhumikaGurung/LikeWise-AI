import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, activityItemsTable, quizzesTable, flashcardSetsTable, studyPlansTable, pdfDocumentsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { GetActivityResponse, GetProgressResponse } from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

// GET /activity
router.get("/activity", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const items = await db
    .select()
    .from(activityItemsTable)
    .where(eq(activityItemsTable.userId, user.id))
    .orderBy(desc(activityItemsTable.createdAt))
    .limit(20);

  const parsed = GetActivityResponse.safeParse(
    items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  );
  if (!parsed.success) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.json(parsed.data);
});

// GET /progress
router.get("/progress", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkId);

  const [quizzes, flashcards, pdfs, plans] = await Promise.all([
    db.select().from(quizzesTable).where(eq(quizzesTable.userId, user.id)),
    db.select().from(flashcardSetsTable).where(eq(flashcardSetsTable.userId, user.id)),
    db.select().from(pdfDocumentsTable).where(eq(pdfDocumentsTable.userId, user.id)),
    db.select().from(studyPlansTable).where(eq(studyPlansTable.userId, user.id)),
  ]);

  const weeklyGoal = user.weeklyGoalHours ?? 5;
  const activePlans = plans.filter((p) => p.status === "active").length;
  const completedQuizzes = quizzes.filter((q) => q.status === "completed").length;
  const totalFlashcards = flashcards.reduce((sum, s) => sum + s.cardCount, 0);

  const summary = {
    totalStudyMinutes: completedQuizzes * 15 + totalFlashcards * 2,
    currentStreak: 0,
    weeklyGoalHours: weeklyGoal,
    weeklyMinutesStudied: completedQuizzes * 5,
    quizzesCompleted: completedQuizzes,
    flashcardsReviewed: totalFlashcards,
    pdfsUploaded: pdfs.length,
    studyPlansActive: activePlans,
  };

  const parsed = GetProgressResponse.safeParse(summary);
  if (!parsed.success) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.json(parsed.data);
});

export default router;
