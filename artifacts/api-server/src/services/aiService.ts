/**
 * AI Service — modular AI provider abstraction.
 *
 * Currently stubbed with deterministic sample data.
 * To switch to Google Gemini (or any other provider), only change this file:
 * 1. Import the Gemini SDK.
 * 2. Replace the body of `chat()` with Gemini's streaming chat API.
 * 3. Replace the body of `generateQuizQuestions()` with a Gemini completion call.
 *
 * The rest of the codebase (routes, frontend) stays untouched.
 */

import type { QuizDifficulty, QuizQuestionType } from "../prompts/quizPrompt";
import { getTutorSystemPrompt, getQuizSystemPrompt, getQuizUserPrompt } from "../prompts/index";

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

/** Streams simulated AI tutor response chunks. */
export async function* chat(
  sessionSubject: string,
  messageHistory: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
): AsyncGenerator<ChatChunk> {
  void sessionSubject; // will be used by real provider with getTutorSystemPrompt()
  void messageHistory;

  // When a real AI is wired, replace everything below this comment:
  // const response = await gemini.chat({ system: getTutorSystemPrompt(sessionSubject), messages: [...messageHistory, { role: "user", content: userMessage }], stream: true });
  // for await (const chunk of response) { yield { content: chunk.text }; }

  const stubResponses: Record<string, string> = {
    default: `Great question! Here's a clear explanation:

**${userMessage.replace(/^explain\s*/i, "")}** is a fundamental concept in computer science.

Key points to understand:
1. **Definition** — It refers to the way systems organize and manage information efficiently.
2. **Why it matters** — Understanding this helps you build better software and solve problems more elegantly.
3. **Real-world example** — Think of it like a well-organized library where every book has a clear place.

Would you like me to go deeper into any of these points, or shall we try a practice exercise? 🎯`,
  };

  const words = (stubResponses.default).split(" ");
  for (let i = 0; i < words.length; i++) {
    await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
    yield { content: words[i] + (i < words.length - 1 ? " " : "") };
  }
  yield { done: true };
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
