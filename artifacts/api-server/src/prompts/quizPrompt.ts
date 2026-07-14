export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizQuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer";

/**
 * System + user prompts for AI quiz generation.
 * Replace these when wiring a real AI provider.
 */
export function getQuizSystemPrompt(): string {
  return `You are an expert quiz generator for educational content.
Generate quiz questions that are accurate, clear, and appropriate for the requested difficulty.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;
}

export function getQuizUserPrompt(
  subject: string,
  topic: string,
  difficulty: QuizDifficulty,
  questionType: QuizQuestionType,
  questionCount: number,
): string {
  const typeInstructions: Record<QuizQuestionType, string> = {
    mcq: `Multiple choice questions. Each question must have exactly 4 options (A, B, C, D) and one correct answer. The "options" array must contain exactly 4 strings.`,
    true_false: `True/False questions. Each question must have exactly 2 options: ["True", "False"]. The correctAnswer must be "True" or "False".`,
    fill_blank: `Fill-in-the-blank questions. The question should contain "___" as the blank. No options needed (empty array). The correctAnswer is the word/phrase that fills the blank.`,
    short_answer: `Short answer questions. No options needed (empty array). The correctAnswer is a brief 1-2 sentence answer.`,
  };

  return `Generate exactly ${questionCount} ${difficulty}-difficulty ${questionType.replace("_", " ")} questions about "${topic}" in the subject of "${subject}".

Question type rules:
${typeInstructions[questionType]}

Return ONLY a JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "...",
    "type": "${questionType}",
    "options": [...],
    "correctAnswer": "...",
    "explanation": "A brief explanation of why this is the correct answer."
  }
]

Rules:
- Generate exactly ${questionCount} questions.
- Difficulty: ${difficulty} (${difficulty === "easy" ? "basic recall" : difficulty === "medium" ? "understanding and application" : "analysis and synthesis"}).
- Explanations must be educational and 1-3 sentences.
- correctAnswer must exactly match one of the options (for MCQ/T-F).`;
}

export function getExplanationPrompt(question: string, correctAnswer: string, userAnswer: string): string {
  return `A student answered a quiz question incorrectly.

Question: ${question}
Correct answer: ${correctAnswer}
Student's answer: ${userAnswer}

Explain in 2-3 friendly sentences why the correct answer is right and where the student went wrong.`;
}
