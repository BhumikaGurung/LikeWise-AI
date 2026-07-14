---
name: SSE chat pattern
description: How AI Tutor streaming chat works — client and server pattern.
---

# SSE Streaming Chat Pattern

**Rule:** The `POST /api/tutor/sessions/{id}/messages` endpoint returns SSE. Orval cannot generate a typed hook for it. Always use raw `fetch` + `ReadableStream` on the client.

**Why:** Orval only generates hooks for JSON responses. SSE endpoints (text/event-stream) must be consumed manually.

**Server pattern** (`artifacts/api-server/src/routes/tutor.ts`):
```
res.setHeader("Content-Type", "text/event-stream")
res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
res.end()
```

**Client pattern** (`artifacts/learnwise-ai/src/pages/ai-tutor.tsx`):
```typescript
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const res = await fetch(`${BASE}/api/tutor/sessions/${id}/messages`, { method: "POST", ... });
const reader = res.body!.getReader();
// parse `data: {...}\n\n` events from ReadableStream chunks
```

**Auth:** Cookie-based (Clerk). No Authorization header needed on client — session cookie is sent automatically by browser.

**After stream:** Invalidate `getGetTutorMessagesQueryKey(sessionId)` to persist messages from DB.
