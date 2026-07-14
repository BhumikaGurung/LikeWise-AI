# LearnWise AI

An AI-powered learning platform where students can learn with an AI Tutor, generate quizzes, upload PDF notes, create flashcards, build study plans, and track their learning progress.

## Run & Operate

- `pnpm --filter @workspace/learnwise-ai run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS v4, Wouter, Framer Motion, Recharts, Lucide React
- Auth: Clerk (Replit-managed, cookie-based on web)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (users, quizzes, flashcards, studyPlans, pdfs, tutorSessions, activity)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas used by the server (do not hand-edit)
- `artifacts/learnwise-ai/src/` — React frontend (pages, components, App.tsx)
- `artifacts/api-server/src/routes/` — Express route handlers (users, quizzes, flashcards, studyPlans, pdfs, tutor, activity)
- `artifacts/api-server/src/lib/userHelpers.ts` — Clerk → local DB user provisioning (JIT)
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy for production

## Architecture decisions

- **Contract-first API**: OpenAPI spec gates codegen, which gates the frontend. Never hand-write types the codegen produces.
- **Clerk for auth**: Cookie-based on web (no bearer tokens in browser code). JIT user provisioning in `userHelpers.ts` creates a local DB row on first sign-in via `getOrCreateUser()`.
- **No AI yet**: All AI feature pages (Tutor, Quiz Generator, Flashcards, PDF Learning, Study Planner) are UI-complete placeholders. AI logic is the next phase.
- **Activity log**: Every create action appends an `activity_items` row so the dashboard activity feed is always populated with real data.
- **Progress summary**: Computed from actual DB counts (no separate tracking table needed for the foundation).

## Product

LearnWise AI is a student learning platform with six core features:
1. **AI Tutor** — chat-based tutoring (UI ready, AI not yet wired)
2. **Quiz Generator** — create and review quizzes by topic (UI + CRUD ready)
3. **PDF Learning** — upload PDFs for AI-powered study (UI + CRUD ready)
4. **Flashcards** — manage flashcard sets (UI + CRUD ready)
5. **Study Planner** — weekly study plans with progress tracking (UI + CRUD ready)
6. **Progress Dashboard** — charts and stats (wired to real data)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, run codegen before touching route or frontend code.
- After any `lib/*` change, run `pnpm run typecheck:libs` before leaf artifact checks.
- Clerk warning about `pk_test` keys in dev is expected — do not try to fix it.
- The `getOrCreateUser()` helper auto-provisions a DB user on first Clerk sign-in. Routes should always call it, not query `usersTable` directly by clerkId.

## Next development phase

1. Wire OpenAI (or Anthropic) to the AI Tutor session endpoint for streaming chat
2. Implement PDF processing pipeline (extract text, chunk, embed for RAG)
3. Build actual quiz generation from topics using LLM
4. Generate flashcard content from PDFs or topics using LLM
5. AI-powered study plan scheduling
6. Add spaced-repetition algorithm to flashcard review sessions

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for auth customization and troubleshooting
