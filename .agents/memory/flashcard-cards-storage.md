---
name: Flashcard cards storage
description: How individual flashcard cards are generated and stored.
---

# Flashcard Cards Storage

**Rule:** Individual flashcard cards are stored as JSONB in `flashcard_sets.cards`. They are generated server-side when a set is created (POST /flashcards). The frontend reads cards directly from the FlashcardSet response.

**Why:** Follows the same JSONB pattern as quiz questions. Avoids a separate join table for the MVP. Keeps the API surface clean (one response has everything needed for the study view).

**Card shape:**
```typescript
{ id: number; front: string; back: string; isLearned: boolean; isBookmarked: boolean; difficulty: "easy"|"medium"|"hard" }
```

**Generation:** `generateStubCards(topic, count)` in `artifacts/api-server/src/routes/flashcards.ts` produces 20 topic-templated Q&A pairs. To wire Gemini: replace `generateStubCards` body with an AI completion call.

**Frontend:** `FlashcardSet.cards` is typed as `FlashcardCard[] | null` from @workspace/api-client-react. The study view reads `set.cards ?? []`.
