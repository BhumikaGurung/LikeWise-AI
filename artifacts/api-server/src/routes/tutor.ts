import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, tutorSessionsTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetTutorSessionsResponse,
  CreateTutorSessionBody,
  CreateTutorSessionResponse,
  GetTutorSessionParams,
  GetTutorSessionResponse,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

const toRow = (s: typeof tutorSessionsTable.$inferSelect) => ({
  ...s,
  lastMessageAt: s.lastMessageAt?.toISOString() ?? null,
  createdAt: s.createdAt.toISOString(),
});

// GET /tutor/sessions
router.get("/tutor/sessions", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const sessions = await db
    .select()
    .from(tutorSessionsTable)
    .where(eq(tutorSessionsTable.userId, user.id))
    .orderBy(desc(tutorSessionsTable.createdAt));

  const parsed = GetTutorSessionsResponse.safeParse(sessions.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /tutor/sessions
router.post("/tutor/sessions", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateTutorSessionBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [session] = await db
    .insert(tutorSessionsTable)
    .values({
      userId: user.id,
      subject: body.data.subject,
      messageCount: 0,
      status: "active",
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "tutor",
    title: `Started AI Tutor session: ${session.subject}`,
    description: "New tutoring session",
  });

  const parsed = CreateTutorSessionResponse.safeParse(toRow(session));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /tutor/sessions/:id
router.get("/tutor/sessions/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTutorSessionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [session] = await db
    .select()
    .from(tutorSessionsTable)
    .where(and(eq(tutorSessionsTable.id, params.data.id), eq(tutorSessionsTable.userId, user.id)));

  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetTutorSessionResponse.safeParse(toRow(session));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

export default router;
