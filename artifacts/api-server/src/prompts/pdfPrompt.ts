/**
 * Prompts for PDF document analysis via Gemini.
 */

export function getPdfAnalysisPrompt(text: string): string {
  return `You are an expert educational content analyser. Analyse the following document text and produce structured learning content.

Return ONLY a valid JSON object with exactly this structure (no markdown, no code fences):
{
  "summary": "A comprehensive 2-3 paragraph summary of the document",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "...up to 10 key points"],
  "importantQuestions": ["Question 1?", "Question 2?", "...up to 10 important questions a student should be able to answer"],
  "flashcards": [
    { "front": "Term or concept", "back": "Definition or explanation" }
  ],
  "quiz": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ]
}

Rules:
- summary: 2-3 paragraphs, markdown allowed (bold key terms)
- keyPoints: 5-10 bullet points, concise and factual
- importantQuestions: 5-10 questions covering core concepts
- flashcards: 8-12 cards covering key terms, definitions, and concepts
- quiz: exactly 5 multiple-choice questions, 4 options each, one correct answer

Document text:
---
${text.slice(0, 12000)}
---`;
}
