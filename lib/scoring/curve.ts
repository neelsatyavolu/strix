// Digital-SAT score conversion, anchored to College Board's OFFICIAL per-test
// raw->score range tables (the "Scoring Your SAT Practice Test #N" guides).
//
// IMPORTANT: CB does NOT publish a raw->scaled table for the adaptive (Bluebook)
// SAT — those forms are scored by per-item IRT. The only official tables are the
// linear/paper practice forms, which give a lower/upper section-score RANGE per
// raw score. Their raw axis (R&W out of 66, Math out of 54) differs from our
// adaptive reconstruction (R&W 54, Math 44), so we map by PERCENT-correct onto
// the published axis, read the band, and take its MIDPOINT as the point estimate.
// Per-test tables differ, so a Bluebook session uses its own test's table; a
// synthetic (question-bank) session uses the average across tests 5–10. The
// easier Module 2 caps the section (CB publishes no cap; prep-reported ~600).
// Tables live in official-curves.json (extracted from the CB scoring PDFs).
// See docs/sat-realism.md §3.

import curvesJson from "./official-curves.json";

type RangeTable = { rw: [number, number][]; math: [number, number][] };
const CURVES = curvesJson as unknown as Record<string, RangeTable>;

// Section ceiling when routed to the easier Module 2. College Board publishes no
// cap; prep sources consistently report a high-500s-to-low-600s limit. Estimate.
const EASY_MODULE_CAP = 600;

// Official measurement error (scale-score RMSE) from CB's Digital SAT Suite
// Technical Manual adaptive simulation, by section and Module-2 route. This is
// the honest uncertainty floor on ANY estimate — we report the point estimate
// ± this, not a falsely tight band. (CB-official.)
const SECTION_RMSE: Record<"rw" | "math", { easy: number; hard: number }> = {
  rw: { easy: 21.13, hard: 17.66 },
  math: { easy: 21.82, hard: 19.57 },
};

/** Round to the nearest 10 (SAT scores are reported in 10-point increments). */
function round10(n: number): number {
  return Math.round(n / 10) * 10;
}

/** The CB table for a given test (falls back to the 5–10 average). */
function tableFor(test: number | null | undefined, section: "rw" | "math"): [number, number][] {
  const key = test != null && CURVES[String(test)] ? String(test) : "avg";
  return CURVES[key][section];
}

export interface ScoreRange {
  /** Point estimate (midpoint of CB's official raw→score band). */
  estimate: number;
  /** estimate − 1 RMSE, floored at the scale/route minimum. */
  lower: number;
  /** estimate + 1 RMSE, capped at the scale/route maximum. */
  upper: number;
}

/**
 * Official-table section-score estimate + confidence range. The POINT ESTIMATE
 * is the midpoint of CB's published per-test raw→score band at the student's
 * percent-correct (mapped onto the linear paper axis). The RANGE is the point
 * estimate ± CB's official per-route measurement error (Technical Manual RMSE) —
 * the honest uncertainty floor, not the narrower paper-table band.
 */
export function sectionScoreRange(
  correct: number,
  total: number,
  opts: { section?: "rw" | "math"; routedEasy?: boolean; test?: number | null } = {},
): ScoreRange {
  const { section = "rw", routedEasy = false, test = null } = opts;
  const table = tableFor(test, section);
  const maxRaw = table.length - 1;
  const pct = total > 0 ? Math.max(0, Math.min(1, correct / total)) : 0;
  const [lo, hi] = table[Math.round(pct * maxRaw)];
  const ceiling = routedEasy ? EASY_MODULE_CAP : 800;
  const clamp = (n: number): number => Math.max(200, Math.min(ceiling, n));
  const estimate = round10(clamp((lo + hi) / 2));
  const rmse = SECTION_RMSE[section][routedEasy ? "easy" : "hard"];
  return {
    estimate,
    lower: round10(Math.max(200, estimate - rmse)),
    upper: round10(Math.min(ceiling, estimate + rmse)),
  };
}

export function scaledSectionScore(
  correct: number,
  total: number,
  routedEasy = false,
  section: "rw" | "math" = "rw",
  test: number | null = null,
): number {
  return sectionScoreRange(correct, total, { section, routedEasy, test }).estimate;
}

/**
 * Composite (400–1600) estimate + range from the two section ranges. Section
 * measurement errors are independent, so the composite margin combines in
 * quadrature rather than summing.
 */
export function compositeRange(rw: ScoreRange, math: ScoreRange): ScoreRange {
  const estimate = compositeScore(rw.estimate, math.estimate);
  const mRw = rw.estimate - rw.lower;
  const mMath = math.estimate - math.lower;
  const margin = Math.sqrt(mRw * mRw + mMath * mMath);
  return {
    estimate,
    lower: round10(Math.max(400, estimate - margin)),
    upper: round10(Math.min(1600, estimate + margin)),
  };
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
