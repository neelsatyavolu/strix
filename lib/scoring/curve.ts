// Representative digital-SAT score conversion.
//
// IMPORTANT: College Board does NOT publish a raw->scaled table for the adaptive
// (Bluebook) SAT — those forms are scored by per-item IRT, so the same number
// correct maps to different scores depending on which items appeared and which
// Module 2 the student was routed to. The only OFFICIAL tables are the linear/
// paper practice forms (which have different question counts). This module
// interpolates a transparent percent-correct curve anchored to those published
// linear tables, applies the prep-reported easy-module ceiling, and is always
// labeled an estimate in the UI. See docs/sat-realism.md §3.

type Anchor = readonly [pct: number, score: number];

// Anchors derived from College Board linear SAT practice-test conversion tables
// (R&W raw out of 66, Math raw out of 54), expressed as percent-correct ->
// section score. The shape (floored 200 at the bottom, compressed near the top)
// is far closer to real equating than a straight line.
const RW_CURVE: Anchor[] = [
  [0, 200], [0.12, 210], [0.24, 330], [0.36, 410], [0.55, 500],
  [0.67, 570], [0.82, 650], [0.97, 760], [1, 800],
];
const MATH_CURVE: Anchor[] = [
  [0, 200], [0.17, 235], [0.30, 345], [0.48, 435], [0.61, 525],
  [0.74, 605], [0.81, 665], [0.96, 785], [1, 800],
];

// Section ceiling when routed to the easier Module 2. College Board publishes no
// cap; prep sources consistently report a high-500s-to-low-600s limit. Estimate.
const EASY_MODULE_CAP = 600;

/** Round to the nearest 10 (SAT scores are reported in 10-point increments). */
function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

/** Piecewise-linear interpolation over a percent->score anchor table. */
function interpolate(curve: Anchor[], pct: number): number {
  const x = Math.max(0, Math.min(1, pct));
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return curve[curve.length - 1][1];
}

export function scaledSectionScore(
  correct: number,
  total: number,
  routedEasy = false,
  section: "rw" | "math" = "rw",
): number {
  const pct = total > 0 ? correct / total : 0;
  let score = round10(interpolate(section === "math" ? MATH_CURVE : RW_CURVE, pct));
  score = Math.max(200, Math.min(800, score));
  if (routedEasy) score = Math.min(score, EASY_MODULE_CAP);
  return score;
}

/** Composite total (400–1600) from the two section scores (each 200–800). */
export function compositeScore(rw: number, math: number): number {
  return Math.max(400, Math.min(1600, (rw || 0) + (math || 0)));
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
