import { VOCAB_BANK, VOCAB_BY_ID, listCategories } from "./bank";
import { CATEGORY_LABELS, type PracticeItem, type VocabCategory, type VocabProgressRow } from "./types";
import { isMastered, MAX_BOX } from "./schedule";

const DEFAULT_COUNT = 12;
const NEW_PER_SESSION = 4;

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
    dueNow: due + Math.min(newCount, NEW_PER_SESSION > 0 ? newCount : 0),
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

/** Build a mixed practice session: due/weak first, then new words. */
export function buildSession(opts: {
  progress: VocabProgressRow[];
  count?: number;
  category?: VocabCategory | null;
  now?: Date;
}): PracticeItem[] {
  const count = Math.min(20, Math.max(4, opts.count ?? DEFAULT_COUNT));
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const map = progressMap(opts.progress);
  const pool = opts.category
    ? VOCAB_BANK.filter((w) => w.category === opts.category)
    : VOCAB_BANK;

  const due: string[] = [];
  const learningNotDue: string[] = [];
  const unseen: string[] = [];
  const mastered: string[] = [];

  for (const w of pool) {
    const p = map.get(w.id);
    if (!p) {
      unseen.push(w.id);
      continue;
    }
    if (isMastered(p.box)) {
      mastered.push(w.id);
      continue;
    }
    if (new Date(p.due_at).getTime() <= nowMs) due.push(w.id);
    else learningNotDue.push(w.id);
  }

  const ordered = [
    ...shuffle(due),
    ...shuffle(unseen).slice(0, NEW_PER_SESSION + count),
    ...shuffle(learningNotDue),
    ...shuffle(mastered).slice(0, 2),
  ];

  const picked: string[] = [];
  const seenPick = new Set<string>();
  for (const id of ordered) {
    if (seenPick.has(id)) continue;
    seenPick.add(id);
    picked.push(id);
    if (picked.length >= count) break;
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
