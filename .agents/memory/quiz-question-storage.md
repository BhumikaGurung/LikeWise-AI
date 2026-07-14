---
name: Quiz question storage
description: How quiz questions are stored and scored.
---

# Quiz Question Storage

**Rule:** Questions are stored as JSONB in `quizzes.questions` column. Scoring is done server-side in `POST /quizzes/{id}/submit`.

**Why:** Keeping questions in the quiz row avoids a separate join table for the foundation phase. The JSONB approach works for up to ~50 questions with no performance concerns.

**QuizQuestion shape:**
```typescript
{
  id: number;
  question: string;
  type: "mcq" | "true_false" | "fill_blank" | "short_answer";
  options: string[]; // empty for fill_blank and short_answer
  correctAnswer: string; // must match one of options for MCQ/T-F
  explanation: string;
}
```

**Scoring:** `POST /quizzes/{id}/submit` receives `{ answers: [{questionId, answer}], timeTakenSeconds }`. Server compares each answer to `correctAnswer` (case-insensitive trim). Returns `QuizResult` with per-question breakdown.

**Status flow:** generating → ready → (in_progress) → completed
