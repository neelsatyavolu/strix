import type { Question } from "./types";

// A question as served to a test-taker: everything needed to render and answer
// it, but no answer key or rationale. The key is disclosed only through
// POST /api/questions/grade once an answer is committed.
export type PublicQuestion = Omit<Question, "correct" | "correctIds" | "rationaleHtml">;

export function sanitizeQuestion(q: Question): PublicQuestion {
  const pub: Partial<Question> = { ...q };
  delete pub.correct;
  delete pub.correctIds;
  delete pub.rationaleHtml;
  return pub as PublicQuestion;
}

export function sanitizeQuestions(qs: Question[]): PublicQuestion[] {
  return qs.map(sanitizeQuestion);
}
