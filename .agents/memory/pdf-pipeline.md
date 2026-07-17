---
name: PDF pipeline implementation
description: How the PDF Learning module works end-to-end after the fix
---

## Root cause that was fixed
The PDF Learning module was a skeleton — no actual file upload, no parsing library, no AI processing, no result columns in DB, all AI buttons hard-disabled.

## Architecture (post-fix)

### Upload flow
1. Frontend sends `POST /api/pdfs/upload` with `multipart/form-data`, field name `file`
2. `multer.memoryStorage()` handles the file (20 MB limit, PDF only)
3. `pdf-parse@1.1.1` extracts text — import via `pdf-parse/lib/pdf-parse.js` (NOT `pdf-parse` default; the default reads a test file at module load time and crashes esbuild bundles)
4. DB record inserted with `status: "processing"`, `extractedText` stored
5. HTTP 202 returned immediately; `runPdfProcessing()` fires and forgets
6. Gemini processes text → updates DB to `status: "ready"` with summary/keyPoints/importantQuestions/flashcards/quiz, or `status: "error"` with errorMessage

### Polling
Frontend polls `GET /api/pdfs` every 3 seconds while any PDF has `status: "processing"` (useEffect + queryClient.invalidateQueries).

### Reprocess
`POST /api/pdfs/:id/reprocess` — resets status to "processing", re-runs Gemini on the stored `extractedText`. Requires extractedText to be present (populated on upload).

## Critical pdf-parse import
```ts
// CORRECT — avoids test file loading at startup
import pdfParse from "pdf-parse/lib/pdf-parse.js";
// WRONG — crashes Node.js at startup via esbuild bundle
import pdfParse from "pdf-parse";
```
Requires custom type declaration at `artifacts/api-server/src/types/pdf-parse.d.ts`.

## DB columns added to pdf_documents
summary (text), key_points (jsonb), important_questions (jsonb), flashcards (jsonb), quiz (jsonb), error_message (text), extracted_text (text)

## Gemini model used
`gemini-flash-latest` (same as AI Tutor). `processPdfText()` in aiService.ts uses `responseMimeType: "application/json"` for structured output. Strips markdown code fences from response before JSON.parse.

## pdf-parse v2 incompatibility
pdf-parse@2.x is a completely different package (uses pdfjs-dist + @napi-rs/canvas). Requires DOMMatrix at module load — crashes in Node.js without canvas polyfill. Always use v1.1.1.
