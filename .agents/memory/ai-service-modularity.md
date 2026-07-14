---
name: AI service modularity
description: How to swap the AI provider — only one file needs changing.
---

# AI Service Modularity

**Rule:** All AI calls go through `artifacts/api-server/src/services/aiService.ts`. To replace the stub with a real provider (Gemini, OpenAI, Anthropic), only edit this one file.

**Why:** The user explicitly requested a modular design so Gemini can be wired later without touching routes or frontend.

**How to apply:**
- `chat()` — async generator that yields `{ content?: string, done?: boolean }` chunks. Currently stubbed with word-by-word delays. Replace the body with a real streaming SDK call.
- `generateQuizQuestions()` — returns `QuizQuestion[]`. Currently returns stub templates. Replace with a real completion call parsing JSON from the model.
- Prompt templates live in `artifacts/api-server/src/prompts/` (tutorPrompt.ts, quizPrompt.ts). The stub currently ignores them but they are referenced so imports don't break when real AI is wired.
- When wiring Gemini: import Gemini SDK, use `getTutorSystemPrompt(subject)` for chat system prompt, use `getQuizSystemPrompt()` + `getQuizUserPrompt(...)` for quiz generation.
