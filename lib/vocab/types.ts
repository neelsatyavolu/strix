export type VocabCategory =
  | "argument"
  | "analysis"
  | "tone"
  | "change"
  | "importance"
  | "description"
  | "precision"
  | "transitions"
  | "multi-meaning"
  | "domain";

export const CATEGORY_LABELS: Record<VocabCategory, string> = {
  argument: "Argument & evidence",
  analysis: "Analysis & evaluation",
  tone: "Tone & attitude",
  change: "Change & development",
  importance: "Importance & value",
  description: "Description",
  precision: "Precision & rigor",
  transitions: "Transitions",
  "multi-meaning": "Multiple meanings",
  domain: "Domain (science / social)",
};

export type VocabEntry = {
  id: string;
  word: string;
  definition: string;
  category: VocabCategory;
  /** Short passage with _____ where the answer fits (DSAT-style context). */
  passage: string;
  /** Four options; may be single words or short phrases. */
  choices: string[];
  correctIndex: number;
  /** Optional tip shown after answer. */
  tip?: string;
};

export type VocabProgressRow = {
  word_id: string;
  box: number;
  due_at: string;
  times_seen: number;
  times_correct: number;
  last_result: boolean | null;
  last_mode: string | null;
};

export type PracticeMode = "context" | "produce";

export type PracticeItem = {
  wordId: string;
  word: string;
  definition: string;
  category: VocabCategory;
  categoryLabel: string;
  mode: PracticeMode;
  // context
  passage?: string;
  choices?: string[];
  // produce — no choices; client validates usage
};
