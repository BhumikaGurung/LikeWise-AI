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
    model: "gemini-3.5-flash",
    contents,
    config: {
      systemInstruction: getTutorSystemPrompt(sessionSubject),
      maxOutputTokens: 1024,
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
    model: "gemini-3.5-flash",
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
  if (!ai) {
    throw new Error("Gemini API key is missing. Check GEMINI_API_KEY in the backend environment.");
  }

  const systemPrompt = getQuizSystemPrompt();

  const userPrompt = getQuizUserPrompt(
    subject,
    topic,
    difficulty,
    questionType,
    questionCount,
  );

  const prompt = `${userPrompt}

IMPORTANT ADDITIONAL RULES:
- Every question must test a different concept within the requested topic.
- Do not repeat or rephrase questions.
- Do not generate generic questions unrelated to the requested topic.
- Use different examples, scenarios, and question styles.
- Follow the requested question type and difficulty exactly.
- Return exactly ${questionCount} questions.
`;

let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });

    break;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    const retryable = /503|429|500|502|504|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(
      message,
    );

    if (!retryable || attempt === 3) {
      throw new Error(`Quiz generation failed: ${message}`);
    }

    console.log(`Gemini attempt ${attempt} failed. Retrying...`);

    await new Promise((resolve) =>
      setTimeout(resolve, 1000 * 2 ** (attempt - 1)),
    );
  }
}

if (!response) {
  throw new Error("Gemini could not generate the quiz. Please try again.");
}

  const responseText = response.text;

  if (!responseText) {
    throw new Error("Gemini returned an empty quiz response.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Gemini returned invalid JSON while generating the quiz.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Gemini did not return a valid array of quiz questions.");
  }

  const questions: QuizQuestion[] = parsed.map((item, index) => {
    if (
      !item ||
      typeof item.question !== "string" ||
      typeof item.correctAnswer !== "string" ||
      typeof item.explanation !== "string" ||
      !Array.isArray(item.options)
    ) {
      throw new Error(`Invalid quiz question received at position ${index + 1}.`);
    }

    const options = item.options;

    if (!options.every((option: unknown) => typeof option === "string")) {
      throw new Error(`Invalid options in question ${index + 1}.`);
    }

    if (
      questionType === "mcq" &&
      (options.length !== 4 || !options.includes(item.correctAnswer))
    ) {
      throw new Error(`Invalid MCQ options or answer in question ${index + 1}.`);
    }

    if (
      questionType === "true_false" &&
      (options.length !== 2 ||
        !options.includes("True") ||
        !options.includes("False") ||
        !options.includes(item.correctAnswer))
    ) {
      throw new Error(`Invalid True/False question ${index + 1}.`);
    }

    if (
      (questionType === "fill_blank" || questionType === "short_answer") &&
      options.length !== 0
    ) {
      throw new Error(`Unexpected options in question ${index + 1}.`);
    }

    return {
      id: index + 1,
      question: item.question.trim(),
      type: questionType,
      options,
      correctAnswer: item.correctAnswer.trim(),
      explanation: item.explanation.trim(),
    };
  });

  if (questions.length !== questionCount) {
    throw new Error(
      `Gemini generated ${questions.length} questions instead of ${questionCount}. Please try again.`,
    );
  }

  // Prevent duplicate questions within the same quiz.
  const uniqueQuestions = new Set(
    questions.map((q) => q.question.toLowerCase().replace(/\s+/g, " ").trim()),
  );

  if (uniqueQuestions.size !== questions.length) {
    throw new Error("Gemini generated duplicate questions. Please generate the quiz again.");
  }

  return questions;
}