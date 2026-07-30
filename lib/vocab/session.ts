import { VOCAB_BANK, VOCAB_BY_ID, listCategories } from "./bank";
import { CATEGORY_LABELS, type PracticeItem, type VocabCategory, type VocabProgressRow } from "./types";
import { isMastered, MAX_BOX } from "./schedule";

const DEFAULT_COUNT = 12;

export type ProgressMap = Map<string, VocabProgressRow>;

export function progressMap(rows: VocabProgressRow[]): ProgressMap {
  return new Map(rows.map((r) => [r.word_id, r]));
}

export function summarize(rows: VocabProgressRow[], now = new Date()) {
  const seen = new Set(rows.map((r) => r.word_id));
  const nowIso = now.getTime();
  let due = 0;
  let learning = 0;
  let mastered = 0;
  for (const r of rows) {
    if (isMastered(r.box)) {
      mastered += 1;
      continue;
    }
    if (r.box >= 1) learning += 1;
    if (new Date(r.due_at).getTime() <= nowIso && !isMastered(r.box)) due += 1;
  }
  const total = VOCAB_BANK.length;
  const newCount = total - seen.size;
  return {
    total,
    new: newCount,
    due: due + newCount,
    learning,
    mastered,
    known: mastered, // checklist "known" === Leitner graduated
    seen: seen.size,
    categories: listCategories(),
    dueNow: due + newCount,
  };
}

function shuffle<T>(arr: T[], rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a flashcard practice item with shuffled usage passages. */
export function toItem(wordId: string): PracticeItem | null {
  const w = VOCAB_BY_ID[wordId];
  if (!w) return null;
  const options = [w.correctPassage, ...w.wrongPassages];
  const order = shuffle([0, 1, 2, 3]);
  const passages = order.map((i) => options[i]);
  const correctIndex = order.indexOf(0);
  return {
    wordId: w.id,
    word: w.word,
    definition: w.definition,
    memoryTip: w.memoryTip,
    category: w.category,
    categoryLabel: CATEGORY_LABELS[w.category],
    mode: "flash",
    passages,
    correctIndex,
  };
}

/**
 * Build a practice session in PDF / bank order (w001 → w400).
 * Skips words already marked known; does not randomize word order.
 * (Passage choices within a card are still shuffled.)
 */
export function buildSession(opts: {
  progress: VocabProgressRow[];
  count?: number;
  category?: VocabCategory | null;
  now?: Date;
}): PracticeItem[] {
  const count = Math.min(20, Math.max(4, opts.count ?? DEFAULT_COUNT));
  const map = progressMap(opts.progress);
  const pool = opts.category
    ? VOCAB_BANK.filter((w) => w.category === opts.category)
    : VOCAB_BANK;

  const picked: string[] = [];
  for (const w of pool) {
    const p = map.get(w.id);
    if (p && isMastered(p.box)) continue; // known / graduated — skip
    picked.push(w.id);
    if (picked.length >= count) break;
  }

  // If everything is known, offer a short refresh in bank order
  if (picked.length === 0) {
    for (const w of pool) {
      picked.push(w.id);
      if (picked.length >= Math.min(count, 4)) break;
    }
  }

  const items: PracticeItem[] = [];
  for (const id of picked) {
    const item = toItem(id);
    if (item) items.push(item);
  }
  return items;
}

export function getEntry(wordId: string) {
  return VOCAB_BY_ID[wordId] ?? null;
}

export { MAX_BOX };
