import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

/**
 * Gets or creates a local user record for a given Clerk user ID.
 * On first login the user row is provisioned with fallback display name.
 */
export async function getOrCreateUser(
  clerkId: string,
  email?: string,
  displayName?: string,
): Promise<User> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      clerkId,
      email: email ?? "",
      displayName: displayName ?? "Learner",
      weeklyGoalHours: 5,
    })
    .returning();

  return newUser;
}
