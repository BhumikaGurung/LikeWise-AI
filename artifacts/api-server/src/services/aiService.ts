/**
 * AI Service — modular AI provider abstraction.
 *
 * chat() uses Google Gemini (GEMINI_API_KEY) for streaming tutor responses.
 * generateQuizQuestions() remains stubbed — wire separately when needed.
 *
 * To swap providers, only change this file.
 * The rest of the codebase (routes, frontend) stays untouched.
 */

import { GoogleGenAI } from "@google/genai";
import type { QuizDifficulty, QuizQuestionType } from "../prompts/quizPrompt";
import { getTutorSystemPrompt, getQuizSystemPrompt, getQuizUserPrompt } from "../prompts/index";
import { getPdfAnalysisPrompt } from "../prompts/pdfPrompt";
import type { PdfFlashcard, PdfQuizQuestion } from "@workspace/db";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface QuizQuestion {
  id: number;
  question: string;
  type: QuizQuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatChunk {
  content?: string;
  done?: boolean;
}

// ─── Stubbed stub AI responses ───────────────────────────────────────────────

/** Streams real Gemini tutor response chunks, with stub fallback if no API key. */
export async function* chat(
  sessionSubject: string,
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
): AsyncGenerator<ChatChunk> {
  if (!ai) {
    // Fallback: no GEMINI_API_KEY configured — stream a clear error message
    const msg = "⚠️ GEMINI_API_KEY is not configured. Please add it to your environment secrets.";
    for (const word of msg.split(" ")) {
      yield { content: word + " " };
    }
    yield { done: true };
    return;
  }

  // Map history to Gemini format (assistant → model); messageHistory already
  // includes the current user message as its last entry.
  const contents = messageHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = await ai.models.generateContentStream({
    model: "ge",
    contents,
    config: {
      systemInstruction: getTutorSystemPrompt(sessionSubject),
      maxOutputTokens: 8192,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) {
      yield { content: text };
    }
  }

  yield { done: true };
}

export interface PdfAnalysisResult {
  summary: string;
  keyPoints: string[];
  importantQuestions: string[];
  flashcards: PdfFlashcard[];
  quiz: PdfQuizQuestion[];
}

/**
 * Analyses extracted PDF text with Gemini and returns structured learning content.
 * Throws on Gemini error so the caller can set status → "error".
 */
export async function processPdfText(text: string): Promise<PdfAnalysisResult> {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured — cannot process PDF.");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("PDF contains no extractable text.");
  }

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: [{ role: "user", parts: [{ text: getPdfAnalysisPrompt(trimmed) }] }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
    },
  });

  const raw = response.text ?? "";
  // Strip markdown code fences if the model wraps them anyway
  const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  // Basic structural validation
  const result = parsed as Record<string, unknown>;
  if (
    typeof result.summary !== "string" ||
    !Array.isArray(result.keyPoints) ||
    !Array.isArray(result.importantQuestions) ||
    !Array.isArray(result.flashcards) ||
    !Array.isArray(result.quiz)
  ) {
    throw new Error("Gemini response is missing required fields.");
  }

  return {
    summary: result.summary,
    keyPoints: result.keyPoints as string[],
    importantQuestions: result.importantQuestions as string[],
    flashcards: result.flashcards as PdfFlashcard[],
    quiz: result.quiz as PdfQuizQuestion[],
  };
}

/** Generates quiz questions. Returns stubbed data until a real provider is wired. */
export async function generateQuizQuestions(
  subject: string,
  topic: string,
  difficulty: QuizDifficulty,
  questionType: QuizQuestionType,
  questionCount: number,
): Promise<QuizQuestion[]> {
  // When a real AI is wired, replace everything below this comment:
  // const systemPrompt = getQuizSystemPrompt();
  // const userPrompt = getQuizUserPrompt(subject, topic, difficulty, questionType, questionCount);
  // const text = await gemini.complete({ system: systemPrompt, prompt: userPrompt });
  // return JSON.parse(text) as QuizQuestion[];

  void getQuizSystemPrompt; // referenced so import isn't flagged unused after real wiring
  void getQuizUserPrompt;
  void getTutorSystemPrompt;

  return generateStubQuestions(subject, topic, difficulty, questionType, questionCount);
}

// ─── Stub generators ─────────────────────────────────────────────────────────

function generateStubQuestions(
  subject: string,
  topic: string,
  difficulty: QuizDifficulty,
  questionType: QuizQuestionType,
  count: number,
): QuizQuestion[] {
  const templates = getStubTemplates(topic, questionType);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    questions.push({
      id: i + 1,
      question: t.question.replace("{n}", String(i + 1)).replace("{topic}", topic),
      type: questionType,
      options: t.options,
      correctAnswer: t.correctAnswer,
      explanation: `${t.explanation} (${difficulty} level — ${subject})`,
    });
  }

  return questions;
}

function getStubTemplates(topic: string, type: QuizQuestionType) {
  if (type === "true_false") {
    return [
      { question: `${topic} is a fundamental concept in computer science.`, options: ["True", "False"], correctAnswer: "True", explanation: `This is correct. ${topic} is widely studied and applied in computer science.` },
      { question: `${topic} was invented after the year 2000.`, options: ["True", "False"], correctAnswer: "False", explanation: `${topic} has roots that predate the year 2000 by many decades.` },
      { question: `Understanding ${topic} helps in writing efficient code.`, options: ["True", "False"], correctAnswer: "True", explanation: `Knowledge of ${topic} directly improves code quality and efficiency.` },
      { question: `${topic} is only used in academic settings.`, options: ["True", "False"], correctAnswer: "False", explanation: `${topic} is widely used in real-world industry applications.` },
      { question: `${topic} requires advanced mathematics to understand.`, options: ["True", "False"], correctAnswer: "False", explanation: `While math helps, ${topic} can be understood with basic logic and reasoning.` },
    ];
  }

  if (type === "fill_blank") {
    return [
      { question: `In ${topic}, a ___ is the basic unit of data storage.`, options: [], correctAnswer: "node", explanation: `A node is the fundamental building block in ${topic} data structures.` },
      { question: `The time complexity of ___ search is O(log n).`, options: [], correctAnswer: "binary", explanation: `Binary search halves the search space each step, giving O(log n) complexity.` },
      { question: `___ is used to manage memory allocation in programs.`, options: [], correctAnswer: "heap", explanation: `The heap is the memory region used for dynamic memory allocation.` },
      { question: `A ___ traversal visits nodes level by level.`, options: [], correctAnswer: "breadth-first", explanation: `Breadth-first traversal (BFS) processes nodes level by level using a queue.` },
      { question: `${topic} uses ___ to ensure data integrity.`, options: [], correctAnswer: "constraints", explanation: `Constraints enforce rules that maintain data accuracy and consistency.` },
    ];
  }

  if (type === "short_answer") {
    return [
      { question: `What is the main purpose of ${topic}?`, options: [], correctAnswer: `${topic} organises and manages information efficiently to solve computational problems.`, explanation: `Understanding the purpose of ${topic} is the foundation for using it effectively.` },
      { question: `Name two real-world applications of ${topic}.`, options: [], correctAnswer: `Search engines and database indexing are common applications of ${topic}.`, explanation: `${topic} is used extensively in search and data management systems.` },
      { question: `What is the time complexity of a linear search algorithm?`, options: [], correctAnswer: `O(n), where n is the number of elements in the collection.`, explanation: `Linear search checks each element one by one, so it scales linearly.` },
      { question: `Explain the difference between stack and queue.`, options: [], correctAnswer: `A stack follows LIFO (Last In First Out) while a queue follows FIFO (First In First Out).`, explanation: `The order of insertion and removal is the key distinguishing factor.` },
      { question: `What problem does ${topic} solve?`, options: [], correctAnswer: `${topic} solves the problem of efficiently organising, storing, and retrieving data.`, explanation: `Without such structures, data operations would be slow and error-prone.` },
    ];
  }

  // Default: MCQ
  return [
    { question: `Which of the following best describes ${topic}?`, options: [`A method for organising and managing data`, `A type of programming language`, `An operating system component`, `A network protocol`], correctAnswer: `A method for organising and managing data`, explanation: `${topic} is primarily about organising and managing data efficiently.` },
    { question: `What is the time complexity of binary search?`, options: [`O(n)`, `O(log n)`, `O(n²)`, `O(1)`], correctAnswer: `O(log n)`, explanation: `Binary search divides the search space in half each iteration, resulting in O(log n).` },
    { question: `Which data structure uses LIFO order?`, options: [`Queue`, `Stack`, `Heap`, `Graph`], correctAnswer: `Stack`, explanation: `A Stack uses Last-In-First-Out (LIFO) ordering, where the last element added is the first removed.` },
    { question: `In ${topic}, which operation has O(1) average complexity in a hash table?`, options: [`Search`, `Sort`, `Traverse`, `Merge`], correctAnswer: `Search`, explanation: `Hash tables use hashing to achieve constant-time O(1) average-case search operations.` },
    { question: `What does DFS stand for in graph traversal?`, options: [`Data Flow Search`, `Depth-First Search`, `Direct File System`, `Dynamic Function Stack`], correctAnswer: `Depth-First Search`, explanation: `DFS (Depth-First Search) explores as far as possible down each branch before backtracking.` },
    { question: `Which sorting algorithm has O(n log n) average time complexity?`, options: [`Bubble Sort`, `Insertion Sort`, `Merge Sort`, `Selection Sort`], correctAnswer: `Merge Sort`, explanation: `Merge Sort consistently achieves O(n log n) by dividing the array and merging sorted halves.` },
    { question: `What is a linked list?`, options: [`A list stored in contiguous memory`, `A list where each node points to the next`, `A sorted array`, `A type of binary tree`], correctAnswer: `A list where each node points to the next`, explanation: `A linked list is a dynamic data structure where each node contains data and a pointer to the next node.` },
    { question: `Which of these is NOT a tree traversal method?`, options: [`Inorder`, `Preorder`, `Postorder`, `Sideorder`], correctAnswer: `Sideorder`, explanation: `The standard tree traversal methods are Inorder, Preorder, and Postorder. "Sideorder" does not exist.` },
    { question: `What is the worst-case time complexity of Quick Sort?`, options: [`O(n log n)`, `O(n)`, `O(n²)`, `O(log n)`], correctAnswer: `O(n²)`, explanation: `Quick Sort degrades to O(n²) when the pivot is always the smallest or largest element (poor pivot selection).` },
    { question: `Which data structure is ideal for BFS traversal?`, options: [`Stack`, `Queue`, `Heap`, `Array`], correctAnswer: `Queue`, explanation: `BFS uses a Queue (FIFO) to process nodes level by level, ensuring breadth-first exploration.` },
  ];
}
