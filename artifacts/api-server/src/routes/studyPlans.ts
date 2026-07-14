import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, studyPlansTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetStudyPlansResponse,
  CreateStudyPlanBody,
  CreateStudyPlanResponse,
  GetStudyPlanParams,
  GetStudyPlanResponse,
  UpdateStudyPlanParams,
  UpdateStudyPlanBody,
  UpdateStudyPlanResponse,
  DeleteStudyPlanParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

const toRow = (p: typeof studyPlansTable.$inferSelect) => ({
  ...p,
  progressPercent: p.progressPercent ?? 0,
  createdAt: p.createdAt.toISOString(),
});

// GET /study-plans
router.get("/study-plans", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const plans = await db
    .select()
    .from(studyPlansTable)
    .where(eq(studyPlansTable.userId, user.id))
    .orderBy(desc(studyPlansTable.createdAt));

  const parsed = GetStudyPlansResponse.safeParse(plans.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /study-plans
router.post("/study-plans", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateStudyPlanBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [plan] = await db
    .insert(studyPlansTable)
    .values({
      userId: user.id,
      title: body.data.title,
      subject: body.data.subject,
      durationWeeks: body.data.durationWeeks,
      hoursPerWeek: body.data.hoursPerWeek,
      status: "active",
      progressPercent: 0,
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "study_plan",
    title: `Created study plan: ${plan.title}`,
    description: `${plan.durationWeeks} weeks, ${plan.hoursPerWeek}h/week`,
  });

  const parsed = CreateStudyPlanResponse.safeParse(toRow(plan));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /study-plans/:id
router.get("/study-plans/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetStudyPlanParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [plan] = await db
    .select()
    .from(studyPlansTable)
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, user.id)));

  if (!plan) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetStudyPlanResponse.safeParse(toRow(plan));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// PATCH /study-plans/:id
router.patch("/study-plans/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateStudyPlanParams.safeParse({ id: parseInt(raw, 10) });
  const body = UpdateStudyPlanBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid request" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [updated] = await db
    .update(studyPlansTable)
    .set(body.data)
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, user.id)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = UpdateStudyPlanResponse.safeParse(toRow(updated));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /study-plans/:id
router.delete("/study-plans/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStudyPlanParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(studyPlansTable)
    .where(and(eq(studyPlansTable.id, params.data.id), eq(studyPlansTable.userId, user.id)));

  res.status(204).send();
});

export default router;
