import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardSetsTable = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cardCount: integer("card_count").notNull().default(0),
  cards: jsonb("cards"), // array of FlashcardCard: { id, front, back, isLearned, isBookmarked, difficulty }
  lastStudiedAt: timestamp("last_studied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSetsTable).omit({ id: true, createdAt: true });
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;
export type FlashcardSet = typeof flashcardSetsTable.$inferSelect;
