// Internal, normalized representation of a College Board question.
// Both the qbank (external_id) and disclosed (ibn) sources map into this shape.

export type Section = "rw" | "math";
export type QuestionType = "mcq" | "spr";
export type Difficulty = "E" | "M" | "H";

export interface Choice {
  /** CB answerOption id (mcq); used to match `keys`. */
  id: string;
  /** Display letter A–D. */
  letter: string;
  /** Sanitized HTML (may contain MathML for math). */
  html: string;
}

export interface Question {
  /** external_id (qbank) or ibn (disclosed). */
  id: string;
  source: "qbank" | "disclosed";
  section: Section;
  /** CB primary_class_cd, e.g. "INI" (RW) or "H" (Math). */
  domain: string;
  domainLabel: string;
  /** CB skill_cd / skill_desc. */
  skill: string;
  skillLabel: string;
  difficulty: Difficulty;
  type: QuestionType;
  /** Sanitized question prompt HTML. */
  stemHtml: string;
  /** Sanitized passage/stimulus HTML (RW), or null. */
  stimulusHtml: string | null;
  /** mcq options (empty for spr). */
  choices: Choice[];
  /** Correct answer letters (mcq) or literal accepted answers (spr). */
  correct: string[];
  /** Correct answerOption ids (mcq only). */
  correctIds: string[];
  /** Sanitized rationale/explanation HTML. */
  rationaleHtml: string;
  /** Unscored field-test item, indistinguishable during the module UI. */
  pretest?: boolean;
}

/** A lightweight stub from the list endpoint. */
export interface QuestionStub {
  questionId: string;
  externalId: string | null;
  ibn: string | null;
  section: Section;
  domain: string;
  domainLabel: string;
  skill: string;
  skillLabel: string;
  difficulty: Difficulty;
}
