// Pure helpers for the Vocabulary word list and Leitner strip.
// Filter semantics are unchanged from the original Vocabulary screen.
import { INTERVALS_DAYS, MAX_BOX } from '@/lib/vocab/schedule';

export const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To learn' },
  { value: 'known', label: 'Known' },
  { value: 'due', label: 'Due' },
  { value: 'learning', label: 'Learning' },
];

function isDue(w, now) {
  return !w.known && (w.box === 0 || (w.dueAt && new Date(w.dueAt) <= now));
}

const PREDICATES = {
  all: () => true,
  todo: (w) => !w.known,
  known: (w) => w.known,
  due: isDue,
  learning: (w) => !w.known && w.box >= 1 && (w.timesSeen || 0) > 0,
};

export function applyFilter(words, filter, now = new Date()) {
  const pred = PREDICATES[filter] || PREDICATES.all;
  return words.filter((w) => pred(w, now));
}

export function applySearch(words, query) {
  const q = query.trim().toLowerCase();
  if (!q) return words;
  return words.filter((w) =>
    w.word.toLowerCase().includes(q) || (w.definition || '').toLowerCase().includes(q),
  );
}

/** Status shown on a word row: known | new | due | learning. */
export function wordStatus(w, now = new Date()) {
  if (w.known) return 'known';
  if (w.box === 0) return 'new';
  if (w.dueAt && new Date(w.dueAt) <= now) return 'due';
  return 'learning';
}

export const STATUS_BADGE = {
  known: { label: 'Known', variant: 'success' },
  new: { label: 'New', variant: 'neutral' },
  due: { label: 'Due', variant: 'warning' },
  learning: { label: 'Learning', variant: 'brand' },
};

function intervalLabel(days) {
  if (days === 0) return 'Seen again the same day';
  if (days === 1) return 'Seen again tomorrow';
  return `Seen again in ${days} days`;
}

/** Leitner segments: New, Box 1..MAX_BOX, Known — each with a count. */
export function leitnerSegments(words) {
  const boxes = Array.from({ length: MAX_BOX }, (_, i) => i + 1);
  const count = (pred) => words.filter(pred).length;
  return [
    { id: 'new', label: 'New', hint: 'Not studied yet', count: count((w) => !w.known && w.box === 0) },
    ...boxes.map((b) => ({
      id: `box-${b}`,
      label: `Box ${b}`,
      hint: intervalLabel(INTERVALS_DAYS[b - 1]),
      count: count((w) => !w.known && w.box === b),
      level: b,
    })),
    { id: 'known', label: 'Known', hint: 'Learned — out of rotation', count: count((w) => w.known) },
  ];
}
