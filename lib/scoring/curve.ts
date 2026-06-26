// Representative digital-SAT score conversion.
//
// The real SAT uses per-form IRT equating tables that College Board does not
// publish. This is a transparent, approximate mapping: a section score of
// 200–800 scaled linearly from raw accuracy, with the documented "easy module"
// cap (~590) applied when Module 1 performance routes the student to Module 2A.
// Labeled as an estimate in the UI.

const EASY_MODULE_CAP = 590;

/** Round to the nearest 10 (SAT scores are reported in 10-point increments). */
function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

export function scaledSectionScore(
  correct: number,
  total: number,
  routedEasy = false,
): number {
  const pct = total > 0 ? correct / total : 0;
  let score = round10(200 + pct * 600);
  score = Math.max(200, Math.min(800, score));
  if (routedEasy) score = Math.min(score, EASY_MODULE_CAP);
  return score;
}

/**
 * Module-1 → Module-2 routing. ~⅔ correct routes to the harder Module 2B.
 * (Prep-industry estimate; CB's exact threshold is not public.)
 */
export const MODULE2_HARD_THRESHOLD = 2 / 3;

export function routeModule2(
  module1Correct: number,
  module1Total: number,
): "hard" | "easy" {
  const pct = module1Total > 0 ? module1Correct / module1Total : 0;
  return pct >= MODULE2_HARD_THRESHOLD ? "hard" : "easy";
}

export const SECTION_LABEL: Record<string, string> = {
  rw: "Reading & Writing",
  math: "Math",
};
