import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface PdfFlashcard {
  front: string;
  back: string;
}

export interface PdfQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export const pdfDocumentsTable = pgTable("pdf_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count"),
  status: text("status").notNull().default("processing"),
  // Extracted PDF text (stored for reprocess support)
  extractedText: text("extracted_text"),
  // AI-generated content (populated after processing)
  summary: text("summary"),
  keyPoints: jsonb("key_points").$type<string[]>(),
  importantQuestions: jsonb("important_questions").$type<string[]>(),
  flashcards: jsonb("flashcards").$type<PdfFlashcard[]>(),
  quiz: jsonb("quiz").$type<PdfQuizQuestion[]>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocumentsTable).omit({ id: true, createdAt: true });
export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type PdfDocument = typeof pdfDocumentsTable.$inferSelect;
