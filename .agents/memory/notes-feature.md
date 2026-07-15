---
name: Notes feature
description: Notes CRUD — all layers: DB, OpenAPI, backend, frontend.
---

# Notes Feature

**DB table:** `notes` in `lib/db/src/schema/notes.ts`
- Columns: id, userId, title, content, isPinned, isFavorite, color, createdAt, updatedAt

**OpenAPI paths:** GET/POST /notes, GET/PATCH/DELETE /notes/{id}
- Schemas: Note, NoteInput, NoteUpdate

**Backend route:** `artifacts/api-server/src/routes/notes.ts`
- Mounted in `routes/index.ts`
- On PATCH: sets `updatedAt = new Date()` explicitly (DB default only applies on insert)

**Frontend page:** `artifacts/learnwise-ai/src/pages/notes.tsx`
- Route: /notes (in App.tsx)
- Nav: "Notes" with StickyNote icon (in shell.tsx, between Progress and Settings)
- Features: create, edit (inline panel), delete, pin, favorite, 7-color coding, search filter

**Generated hooks:** useGetNotes, useCreateNote, useGetNote, useUpdateNote, useDeleteNote
**Query key:** getGetNotesQueryKey()
