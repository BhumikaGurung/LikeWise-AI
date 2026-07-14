import { Router, type IRouter } from "express";
import { eq, and, asc, desc } from "drizzle-orm";
import { db, tutorSessionsTable, activityItemsTable, chatMessagesTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetTutorSessionsResponse,
  CreateTutorSessionBody,
  CreateTutorSessionResponse,
  GetTutorSessionParams,
  GetTutorSessionResponse,
  DeleteTutorSessionParams,
  GetTutorMessagesParams,
  GetTutorMessagesResponse,
  SendTutorMessageParams,
  SendTutorMessageBody,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";
import { chat } from "../services/aiService";

const router: IRouter = Router();

const toSessionRow = (s: typeof tutorSessionsTable.$inferSelect) => ({
  ...s,
  lastMessageAt: s.lastMessageAt?.toISOString() ?? null,
  createdAt: s.createdAt.toISOString(),
});

const toMessageRow = (m: typeof chatMessagesTable.$inferSelect) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
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

  const parsed = GetTutorSessionsResponse.safeParse(sessions.map(toSessionRow));
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

  const parsed = CreateTutorSessionResponse.safeParse(toSessionRow(session));
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

  const parsed = GetTutorSessionResponse.safeParse(toSessionRow(session));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /tutor/sessions/:id
router.delete("/tutor/sessions/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTutorSessionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  // Delete messages first, then session
  const [session] = await db
    .select()
    .from(tutorSessionsTable)
    .where(and(eq(tutorSessionsTable.id, params.data.id), eq(tutorSessionsTable.userId, user.id)));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.sessionId, session.id));
  await db.delete(tutorSessionsTable).where(eq(tutorSessionsTable.id, session.id));

  res.status(204).send();
});

// GET /tutor/sessions/:id/messages
router.get("/tutor/sessions/:id/messages", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTutorMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  // Verify session ownership
  const [session] = await db
    .select()
    .from(tutorSessionsTable)
    .where(and(eq(tutorSessionsTable.id, params.data.id), eq(tutorSessionsTable.userId, user.id)));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, session.id))
    .orderBy(asc(chatMessagesTable.createdAt));

  const parsed = GetTutorMessagesResponse.safeParse(messages.map(toMessageRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /tutor/sessions/:id/messages — SSE streaming response
router.post("/tutor/sessions/:id/messages", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendTutorMessageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const body = SendTutorMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [session] = await db
    .select()
    .from(tutorSessionsTable)
    .where(and(eq(tutorSessionsTable.id, params.data.id), eq(tutorSessionsTable.userId, user.id)));
  if (!session) { res.status(404).json({ error: "Not found" }); return; }

  // Persist user message
  await db.insert(chatMessagesTable).values({
    sessionId: session.id,
    role: "user",
    content: body.data.content,
  });

  // Fetch conversation history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, session.id))
    .orderBy(asc(chatMessagesTable.createdAt));

  const messageHistory = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  let fullResponse = "";

  try {
    for await (const chunk of chat(session.subject, messageHistory, body.data.content)) {
      if (chunk.content) {
        fullResponse += chunk.content;
        res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
      if (chunk.done) {
        break;
      }
    }
  } catch (err) {
    req.log.error({ err }, "AI chat stream error");
    res.write(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`);
  }

  // Persist assistant response
  if (fullResponse) {
    await db.insert(chatMessagesTable).values({
      sessionId: session.id,
      role: "assistant",
      content: fullResponse,
    });

    // Update session metadata
    await db
      .update(tutorSessionsTable)
      .set({
        messageCount: history.length + 1, // user message was added
        lastMessageAt: new Date(),
      })
      .where(eq(tutorSessionsTable.id, session.id));
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
