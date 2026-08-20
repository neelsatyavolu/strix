import { ACTIVE_BANK, VOCAB_BY_ID, listCategories } from "./bank";
import { CATEGORY_LABELS, type PracticeItem, type VocabCategory, type VocabProgressRow } from "./types";
import { isMastered, MAX_BOX } from "./schedule";
import { buildUsageOptions } from "./usageOptions";

const DEFAULT_COUNT = 12;

export type ProgressMap = Map<string, VocabProgressRow>;

export function progressMap(rows: VocabProgressRow[]): ProgressMap {
  return new Map(rows.map((r) => [r.word_id, r]));
}

export function summarize(rows: VocabProgressRow[], now = new Date()) {
  const activeIds = new Set(ACTIVE_BANK.map((w) => w.id));
  const activeRows = rows.filter((r) => activeIds.has(r.word_id));
  const seen = new Set(activeRows.map((r) => r.word_id));
  const nowIso = now.getTime();
  let due = 0;
  let learning = 0;
  let mastered = 0;
  for (const r of activeRows) {
    if (isMastered(r.box)) {
      mastered += 1;
      continue;
    }
    if (r.box >= 1) learning += 1;
    if (new Date(r.due_at).getTime() <= nowIso && !isMastered(r.box)) due += 1;
  }
  const total = ACTIVE_BANK.length;
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

/**
 * Build a flashcard practice item with a fresh usage MCQ set.
 * Correct + wrongs are re-sampled every call so retries never reuse the same quartet.
 * @param salt optional entropy (e.g. times_seen, timestamp) so samples differ across sessions
 */
export function toItem(wordId: string, salt?: number): PracticeItem | null {
  const w = VOCAB_BY_ID[wordId];
  if (!w) return null;
  // Mix Math.random with salt so each practice appearance gets a new set
  let s = ((salt ?? Date.now()) ^ (wordId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 2654435761)) >>> 0;
  const rng = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    // blend with Math.random so consecutive toItem calls still diverge
    return ((s >>> 0) / 0x100000000 + Math.random()) / 2;
  };
  const { passages, correctIndex } = buildUsageOptions(w, rng);
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
 * Build a practice session:
 * 1) Missed last time (retry) — first, bank order
 * 2) Other due words — bank order
 * 3) Rest of the list in PDF order (skip known)
 * Passage choices within a card are still shuffled.
 */
export function buildSession(opts: {
  progress: VocabProgressRow[];
  count?: number;
  category?: VocabCategory | null;
  now?: Date;
}): PracticeItem[] {
  const count = Math.min(20, Math.max(4, opts.count ?? DEFAULT_COUNT));
  const nowMs = (opts.now ?? new Date()).getTime();
  const map = progressMap(opts.progress);
  const pool = opts.category
    ? ACTIVE_BANK.filter((w) => w.category === opts.category)
    : ACTIVE_BANK;

  const retries: string[] = []; // last attempt wrong — show next session
  const due: string[] = [];
  const rest: string[] = [];

  for (const w of pool) {
    const p = map.get(w.id);
    if (p && isMastered(p.box)) continue; // known — skip

    if (p && p.last_result === false) {
      retries.push(w.id);
      continue;
    }
    if (p && new Date(p.due_at).getTime() <= nowMs) {
      due.push(w.id);
      continue;
    }
    rest.push(w.id);
  }

  const ordered = [...retries, ...due, ...rest];
  let picked = ordered.slice(0, count);

  // If everything is known, short refresh in bank order
  if (picked.length === 0) {
    picked = pool.slice(0, Math.min(count, 4)).map((w) => w.id);
  }

  const items: PracticeItem[] = [];
  const sessionSalt = nowMs ^ (picked.length * 9973);
  for (let i = 0; i < picked.length; i += 1) {
    const p = map.get(picked[i]);
    const salt = sessionSalt + i * 131 + (p?.times_seen ?? 0) * 17 + (p?.times_correct ?? 0) * 31;
    const item = toItem(picked[i], salt);
    if (item) items.push(item);
  }
  return items;
}

export function getEntry(wordId: string) {
  return VOCAB_BY_ID[wordId] ?? null;
}

export { MAX_BOX };
