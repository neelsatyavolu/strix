export type VocabCategory = "core";

export const CATEGORY_LABELS: Record<VocabCategory, string> = {
  core: "SAT 500",
};

export type VocabEntry = {
  id: string;
  word: string;
  definition: string;
  category: VocabCategory;
  /** Short sticky mnemonic shown on the flashcard back. */
  memoryTip: string;
  /** Passage that uses the word correctly. */
  correctPassage: string;
  /** Three passages that misuse the word. */
  wrongPassages: [string, string, string];
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

/** Flashcard session item: word first, then usage check. */
export type PracticeMode = "flash";

export type PracticeItem = {
  wordId: string;
  word: string;
  definition: string;
  memoryTip: string;
  category: VocabCategory;
  categoryLabel: string;
  mode: PracticeMode;
  /** Four passages (shuffled); student picks which uses the word correctly. */
  passages: string[];
  correctIndex: number;
};
