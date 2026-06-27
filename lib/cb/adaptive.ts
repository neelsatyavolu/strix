import type { Difficulty } from "./types";

// Per-answer weight decays with how long ago it was attempted. Mirrors the value
// used by /api/stats so adaptive drills and the dashboard agree on what "recent"
// means: 0.97 gives a half-life of ~23 answers.
export const RECENCY_DECAY = 0.97;

export type DifficultyMix = Record<Difficulty, number>;

// Below this many recent answers in a domain we don't trust the signal enough to
// skew difficulty — fall back to the balanced mix.
const MIN_ATTEMPTS = 3;

/**
 * Target difficulty distribution (relative weights, not required to sum to 1)
 * for an adaptive drill, given the student's recency-weighted accuracy (0–100)
 * in the drilled domain.
 *
 * No / too little history → a balanced "good mix". As recent accuracy climbs the
 * mix shifts toward harder questions; when they're struggling it leans easier to
 * rebuild fluency before pushing difficulty back up.
 */
export function difficultyMix(
  recentAccuracy: number | null,
  attempts: number,
): DifficultyMix {
  if (recentAccuracy == null || attempts < MIN_ATTEMPTS) {
    return { E: 3, M: 4, H: 3 }; // balanced default
  }
  if (recentAccuracy < 50) return { E: 5, M: 4, H: 1 };
  if (recentAccuracy < 70) return { E: 3, M: 5, H: 2 };
  if (recentAccuracy < 85) return { E: 1, M: 4, H: 4 };
  return { E: 1, M: 3, H: 6 }; // mastering it — mostly hard
}

/**
 * Recency-weighted accuracy (0–100) over answer rows ordered newest-first.
 * Each answer contributes RECENCY_DECAY^rank, so recent attempts dominate.
 * Returns null when there are no answered rows.
 */
export function recentAccuracy(
  rows: ReadonlyArray<{ is_correct: boolean | null }>,
): number | null {
  let wDone = 0;
  let wCorrect = 0;
  rows.forEach((row, rank) => {
    const w = Math.pow(RECENCY_DECAY, rank);
    wDone += w;
    if (row.is_correct) wCorrect += w;
  });
  return wDone > 0 ? (wCorrect / wDone) * 100 : null;
}
