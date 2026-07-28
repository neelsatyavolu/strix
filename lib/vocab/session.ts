import { VOCAB_BANK, VOCAB_BY_ID, listCategories } from "./bank";
import { CATEGORY_LABELS, type PracticeItem, type PracticeMode, type VocabCategory, type VocabProgressRow } from "./types";
import { isMastered, MAX_BOX } from "./schedule";

const DEFAULT_COUNT = 12;
const NEW_PER_SESSION = 4;
// ~70% context / ~30% produce in a mixed session.
const PRODUCE_RATIO = 0.3;

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
  // Unseen words are "due" for introduction purposes in the hub snapshot.
  const dueTotal = due + Math.min(newCount, NEW_PER_SESSION > 0 ? newCount : 0);
  return {
    total,
    new: newCount,
    due: due + newCount, // any unseen or scheduled-due
    learning,
    mastered,
    seen: seen.size,
    categories: listCategories(),
    dueNow: dueTotal,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toItem(wordId: string, mode: PracticeMode): PracticeItem | null {
  const w = VOCAB_BY_ID[wordId];
  if (!w) return null;
  const base: PracticeItem = {
    wordId: w.id,
    word: w.word,
    definition: w.definition,
    category: w.category,
    categoryLabel: CATEGORY_LABELS[w.category],
    mode,
  };
  if (mode === "context") {
    return { ...base, passage: w.passage, choices: w.choices };
  }
  return base;
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

  // Prefer: due → new → learning not due → rare mastered refresh
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

  // Assign modes: first-time words get context; ~30% of rest produce.
  const items: PracticeItem[] = [];
  for (const id of picked) {
    const p = map.get(id);
    let mode: PracticeMode = "context";
    if (p && p.times_seen >= 1 && Math.random() < PRODUCE_RATIO) {
      mode = "produce";
    }
    // Ensure at least ~1 produce item when session is large enough and student has history
    const item = toItem(id, mode);
    if (item) items.push(item);
  }

  // Guarantee some produce if student has seen anything
  const hasHistory = opts.progress.some((r) => r.times_seen > 0);
  if (hasHistory && items.length >= 4 && !items.some((i) => i.mode === "produce")) {
    const idx = Math.min(items.length - 1, Math.floor(items.length * 0.7));
    const flipped = toItem(items[idx].wordId, "produce");
    if (flipped) items[idx] = flipped;
  }

  return items;
}

/** Server-side check for produce mode: word used + minimum substance. */
export function scoreProduce(word: string, sentence: string): { correct: boolean; reason?: string } {
  const s = (sentence || "").trim();
  if (s.length < 24) return { correct: false, reason: "Write a fuller sentence (at least a few words)." };
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 5) return { correct: false, reason: "Use at least 5 words." };
  const re = new RegExp(`\\b${escapeRe(word)}\\b`, "i");
  // Allow common inflections for verbs/adjectives lightly
  const reLoose = new RegExp(`\\b${escapeRe(word)}(s|ed|ing|ly|tion|ation)?\\b`, "i");
  if (!re.test(s) && !reLoose.test(s)) {
    return { correct: false, reason: `Include the word “${word}” (or a clear form of it).` };
  }
  return { correct: true };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getEntry(wordId: string) {
  return VOCAB_BY_ID[wordId] ?? null;
}

export { MAX_BOX };
