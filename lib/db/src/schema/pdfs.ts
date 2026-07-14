import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pdfDocumentsTable = pgTable("pdf_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count"),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPdfDocumentSchema = createInsertSchema(pdfDocumentsTable).omit({ id: true, createdAt: true });
export type InsertPdfDocument = z.infer<typeof insertPdfDocumentSchema>;
export type PdfDocument = typeof pdfDocumentsTable.$inferSelect;
