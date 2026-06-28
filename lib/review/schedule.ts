// Leitner-box spaced repetition for missed questions.
//
// A missed question enters box 1 (due tomorrow). Each time it's answered
// correctly on review it advances a box and the next-due interval grows; a miss
// resets it to box 1. Once it clears the last box it has graduated (mastered)
// and stops resurfacing. Intervals are capped so nothing is ever scheduled past
// the test date.

export const INTERVALS_DAYS = [1, 3, 7, 16, 35]; // box 1..5
export const MAX_BOX = INTERVALS_DAYS.length;

// The box a question moves to after an attempt. A correct answer advances one
// box (the caller treats a result > MAX_BOX as graduated); a miss resets to 1.
export function nextBox(box: number, correct: boolean): number {
  if (!correct) return 1;
  return box + 1;
}

export function intervalDays(box: number): number {
  const i = Math.min(Math.max(box, 1), MAX_BOX) - 1;
  return INTERVALS_DAYS[i];
}

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 86_400_000);
}

// Next due date for a box, never scheduled past the test date — a question still
// due before the test helps more than one parked after it.
export function dueAt(box: number, now: Date, testDate: Date | null): Date {
  const due = addDays(now, intervalDays(box));
  if (testDate && testDate.getTime() > now.getTime() && due.getTime() > testDate.getTime()) {
    return testDate;
  }
  return due;
}
