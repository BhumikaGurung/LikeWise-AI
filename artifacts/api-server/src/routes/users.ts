import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { UpdateMeBody, GetMeResponse, UpdateMeResponse } from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

// GET /users/me
router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const parsed = GetMeResponse.safeParse({
    ...user,
    clerkId: user.clerkId,
    createdAt: user.createdAt.toISOString(),
  });
  if (!parsed.success) {
    req.log.error({ error: parsed.error }, "Failed to parse user response");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.json(parsed.data);
});

// PATCH /users/me
router.patch("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, user.id))
    .returning();

  const out = UpdateMeResponse.safeParse({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
  });
  if (!out.success) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.json(out.data);
});

export default router;
