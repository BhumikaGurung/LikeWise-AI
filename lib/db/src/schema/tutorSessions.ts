import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tutorSessionsTable = pgTable("tutor_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTutorSessionSchema = createInsertSchema(tutorSessionsTable).omit({ id: true, createdAt: true });
export type InsertTutorSession = z.infer<typeof insertTutorSessionSchema>;
export type TutorSession = typeof tutorSessionsTable.$inferSelect;
