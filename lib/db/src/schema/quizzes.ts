import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull().default("General"),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("medium"),
  questionType: text("question_type").notNull().default("mcq"),
  questionCount: integer("question_count").notNull().default(10),
  questions: jsonb("questions"),  // QuizQuestion[]
  score: integer("score"),
  totalCorrect: integer("total_correct"),
  totalWrong: integer("total_wrong"),
  timeTakenSeconds: integer("time_taken_seconds"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;
