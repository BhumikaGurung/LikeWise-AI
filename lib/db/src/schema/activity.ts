import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityItemsTable = pgTable("activity_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // quiz | flashcard | pdf | study_plan | tutor
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivityItemSchema = createInsertSchema(activityItemsTable).omit({ id: true, createdAt: true });
export type InsertActivityItem = z.infer<typeof insertActivityItemSchema>;
export type ActivityItem = typeof activityItemsTable.$inferSelect;
