import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studyPlansTable = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  durationWeeks: integer("duration_weeks").notNull(),
  hoursPerWeek: integer("hours_per_week").notNull(),
  status: text("status").notNull().default("active"),
  progressPercent: integer("progress_percent").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlansTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
export type StudyPlan = typeof studyPlansTable.$inferSelect;
