import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, flashcardSetsTable, activityItemsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  GetFlashcardSetsResponse,
  CreateFlashcardSetBody,
  CreateFlashcardSetResponse,
  GetFlashcardSetParams,
  GetFlashcardSetResponse,
  DeleteFlashcardSetParams,
} from "@workspace/api-zod";
import { getOrCreateUser } from "../lib/userHelpers";

const router: IRouter = Router();

interface FlashcardCard {
  id: number;
  front: string;
  back: string;
  isLearned: boolean;
  isBookmarked: boolean;
  difficulty: "easy" | "medium" | "hard";
}

/** Generate realistic stub flashcard Q&A pairs from a topic */
function generateStubCards(topic: string, count: number): FlashcardCard[] {
  const t = topic.trim() || "General Knowledge";

  const templates = [
    { front: `What is the definition of ${t}?`, back: `${t} is a core concept referring to a structured system or method that enables effective understanding and application in its domain.` },
    { front: `What are the main characteristics of ${t}?`, back: `Key characteristics include: (1) systematic structure, (2) clear principles, (3) practical applications, and (4) well-defined scope and boundaries.` },
    { front: `Why is ${t} important in its field?`, back: `${t} is fundamental because it provides a standardized framework for solving problems, improving efficiency, and building consistent solutions.` },
    { front: `What are the key components of ${t}?`, back: `The key components are: core concepts, supporting principles, implementation strategies, and evaluation criteria — all working together cohesively.` },
    { front: `How does ${t} differ from related concepts?`, back: `Unlike related concepts, ${t} focuses specifically on a defined domain with unique rules, terminology, and application areas that set it apart.` },
    { front: `Give a real-world example of ${t}.`, back: `A classic example: applying ${t} principles in a practical scenario where the concept directly influences outcomes, decisions, or system behavior.` },
    { front: `What are common misconceptions about ${t}?`, back: `Common misconceptions include: thinking ${t} is only theoretical (it has wide practical use), or that it applies only in limited contexts (it's broadly applicable).` },
    { front: `What is the history and origin of ${t}?`, back: `${t} evolved over time through contributions from researchers and practitioners, building on earlier foundations to become the well-established concept it is today.` },
    { front: `What are the advantages of using ${t}?`, back: `Advantages include: improved clarity, better problem-solving capability, standardization, and a solid theoretical foundation that supports advanced learning.` },
    { front: `What are the limitations of ${t}?`, back: `Limitations include: complexity in edge cases, dependency on prerequisite knowledge, and situations where alternative approaches may be more efficient.` },
    { front: `How is ${t} applied in practice?`, back: `Practical application involves: identifying the problem, selecting the appropriate method, implementing the solution step-by-step, and validating the result.` },
    { front: `What are the types or categories within ${t}?`, back: `${t} can be categorized into: fundamental types, advanced variations, specialized sub-fields, and hybrid applications depending on the context.` },
    { front: `What tools or technologies are associated with ${t}?`, back: `Associated tools include purpose-built software, frameworks, libraries, and methodologies specifically designed to work with ${t} concepts.` },
    { front: `How do you evaluate or measure ${t}?`, back: `Evaluation involves: defining success criteria, applying appropriate metrics, benchmarking against standards, and iterating based on feedback.` },
    { front: `What is the relationship between ${t} and problem-solving?`, back: `${t} provides a structured lens for problem-solving: it defines the problem space, offers established methods, and guides toward reliable solutions.` },
    { front: `What are best practices when working with ${t}?`, back: `Best practices: start with fundamentals, build incrementally, validate at each step, document your work, and review against established standards.` },
    { front: `How does ${t} relate to other subjects or disciplines?`, back: `${t} intersects with several disciplines, borrowing concepts and contributing insights that enrich adjacent fields and foster cross-disciplinary innovation.` },
    { front: `What challenges arise when learning ${t}?`, back: `Common challenges: abstract concepts, prerequisite knowledge gaps, lack of practical context, and the need for consistent practice and review.` },
    { front: `What is a key formula or rule in ${t}?`, back: `A core rule in ${t}: the relationship between inputs and outputs follows a consistent pattern, which can be expressed as a principle or formula unique to the domain.` },
    { front: `Summarize the most important point about ${t}.`, back: `The most critical point: mastering ${t} requires understanding its foundational principles, practicing application, and building on knowledge progressively.` },
  ];

  const cards: FlashcardCard[] = [];
  const difficulties: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    cards.push({
      id: i + 1,
      front: templates[i].front,
      back: templates[i].back,
      isLearned: false,
      isBookmarked: false,
      difficulty: difficulties[i % 3],
    });
  }

  return cards;
}

const toRow = (s: typeof flashcardSetsTable.$inferSelect) => ({
  ...s,
  cards: (s.cards as FlashcardCard[] | null) ?? [],
  lastStudiedAt: s.lastStudiedAt?.toISOString() ?? null,
  createdAt: s.createdAt.toISOString(),
});

// GET /flashcards
router.get("/flashcards", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const sets = await db
    .select()
    .from(flashcardSetsTable)
    .where(eq(flashcardSetsTable.userId, user.id))
    .orderBy(desc(flashcardSetsTable.createdAt));

  const parsed = GetFlashcardSetsResponse.safeParse(sets.map(toRow));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// POST /flashcards
router.post("/flashcards", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const body = CreateFlashcardSetBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = await getOrCreateUser(auth.userId);
  const count = body.data.cardCount ?? 10;
  const cards = generateStubCards(body.data.topic, count);

  const [set] = await db
    .insert(flashcardSetsTable)
    .values({
      userId: user.id,
      title: body.data.title,
      topic: body.data.topic,
      cardCount: cards.length,
      cards: cards as any,
    })
    .returning();

  await db.insert(activityItemsTable).values({
    userId: user.id,
    type: "flashcard",
    title: `Created flashcard set: ${set.title}`,
    description: `${set.cardCount} cards on ${set.topic}`,
  });

  const parsed = CreateFlashcardSetResponse.safeParse(toRow(set));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.status(201).json(parsed.data);
});

// GET /flashcards/:id
router.get("/flashcards/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFlashcardSetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  const [set] = await db
    .select()
    .from(flashcardSetsTable)
    .where(and(eq(flashcardSetsTable.id, params.data.id), eq(flashcardSetsTable.userId, user.id)));

  if (!set) { res.status(404).json({ error: "Not found" }); return; }

  const parsed = GetFlashcardSetResponse.safeParse(toRow(set));
  if (!parsed.success) { res.status(500).json({ error: "Internal server error" }); return; }
  res.json(parsed.data);
});

// DELETE /flashcards/:id
router.delete("/flashcards/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFlashcardSetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const user = await getOrCreateUser(auth.userId);
  await db
    .delete(flashcardSetsTable)
    .where(and(eq(flashcardSetsTable.id, params.data.id), eq(flashcardSetsTable.userId, user.id)));

  res.status(204).send();
});

export default router;
