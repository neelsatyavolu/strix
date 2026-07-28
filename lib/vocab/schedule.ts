// Leitner-box scheduling for vocabulary (mirrors lib/review/schedule.ts).
// box 0 = unseen (no row); 1..MAX_BOX = learning; > MAX_BOX = graduated/mastered.

export const INTERVALS_DAYS = [0, 1, 3, 7, 16]; // box 1..5
export const MAX_BOX = INTERVALS_DAYS.length;

export function nextBox(box: number, correct: boolean): number {
  if (!correct) return 1;
  // Unseen (box 0) treated as first exposure in box 1; a hit advances to 2.
  const cur = Math.max(box, 1);
  return cur + 1;
}

export function intervalDays(box: number): number {
  const i = Math.min(Math.max(box, 1), MAX_BOX) - 1;
  return INTERVALS_DAYS[i];
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

export function dueAt(box: number, now: Date): Date {
  if (box > MAX_BOX) {
    // Mastered — park far out; still queryable as mastered, not due.
    return addDays(now, 365);
  }
  return addDays(now, intervalDays(box));
}

export function isMastered(box: number): boolean {
  return box > MAX_BOX;
}
