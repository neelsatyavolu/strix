// Shared labels + small pure helpers for the result / review screens.

export const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

export const SECTION_COLOR = { rw: 'var(--rw-color)', math: 'var(--math-color)' };

export const MODE_LABEL = {
  drill: 'Drill',
  review: 'Review',
  'mock-m1': 'Module 1',
  'mock-full': 'Full section',
  'mock-exam': 'Full SAT',
};

// A score range only renders when it's fully populated with finite numbers —
// older sessions predate ranges, so hide rather than show "NaN–NaN".
export const finiteRange = (r) =>
  !!r && Number.isFinite(r.lower) && Number.isFinite(r.upper);

export const rangeHint = (r) => (finiteRange(r) ? `Likely ${r.lower}–${r.upper}` : null);

/** 'correct' | 'incorrect' | 'skipped' for one review item. */
export function outcomeOf(item) {
  if (item.isCorrect) return 'correct';
  return item.response?.value ? 'incorrect' : 'skipped';
}

/** Counts over a review list. `timeMs` is null when no item carries a time. */
export function tally(review = []) {
  return review.reduce(
    (acc, item) => {
      const outcome = outcomeOf(item);
      const t = Number.isFinite(item.timeMs) ? item.timeMs : null;
      return {
        ...acc,
        [outcome]: acc[outcome] + 1,
        flagged: acc.flagged + (item.response?.flagged ? 1 : 0),
        timeMs: t == null ? acc.timeMs : (acc.timeMs ?? 0) + t,
      };
    },
    { correct: 0, incorrect: 0, skipped: 0, flagged: 0, timeMs: null },
  );
}

/** 45s · 3m 05s · 1h 12m */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Standard header stats: correct / incorrect / skipped (only when any) /
 * time (only when known). `extra` stats go first (e.g. section scores).
 */
export function outcomeStats(counts, { timeMs = counts.timeMs, extra = [] } = {}) {
  const time = formatDuration(timeMs);
  return [
    ...extra,
    { label: 'Correct', value: counts.correct, color: 'var(--success)' },
    { label: 'Incorrect', value: counts.incorrect, color: counts.incorrect ? 'var(--error)' : undefined },
    ...(counts.skipped ? [{ label: 'Skipped', value: counts.skipped }] : []),
    ...(time ? [{ label: 'Time', value: time }] : []),
  ];
}
