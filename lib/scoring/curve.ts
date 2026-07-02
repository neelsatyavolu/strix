// Digital-SAT score conversion, using a calibrated public-data estimate.
//
// IMPORTANT: CB does NOT publish a raw->scaled table for the adaptive (Bluebook)
// SAT — those forms are scored by per-item IRT. We blend Albert's module-aware
// public curve with CB-derived aggregate practice-test scaling and calibrate that
// blend to the user's real SAT anchor.

import { scoreCalibratedSection } from "./albert.mjs";

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

export interface ScoreRange {
  /** Point estimate from the calibrated SAT scoring model. */
  estimate: number;
  /** estimate − 1 RMSE, floored at the scale/route minimum. */
  lower: number;
  /** estimate + 1 RMSE, capped at the scale/route maximum. */
  upper: number;
}

export interface ModuleScore {
  correct: number;
  total: number;
}

function fallbackModuleScores(correct: number, total: number): ModuleScore[] {
  const pct = total > 0 ? Math.max(0, Math.min(1, correct / total)) : 0;
  return [
    { correct: pct, total: 1 },
    { correct: pct, total: 1 },
  ];
}

/**
 * Calibrated section-score estimate + confidence range. The POINT ESTIMATE blends
 * Albert's module-aware lookup with CB-derived aggregate practice-test scaling.
 * The RANGE remains the point estimate ± CB's official per-route measurement
 * error (Technical Manual RMSE), since all public SAT scoring is approximate.
 */
export function sectionScoreRange(
  correct: number,
  total: number,
  opts: {
    section?: "rw" | "math";
    routedEasy?: boolean;
    test?: number | null;
    modules?: ModuleScore[];
  } = {},
): ScoreRange {
  const { section = "rw", routedEasy = false, modules } = opts;
  const estimate = round10(scoreCalibratedSection(section, modules?.length ? modules : fallbackModuleScores(correct, total)));
  const rmse = SECTION_RMSE[section][routedEasy ? "easy" : "hard"];
  return {
    estimate,
    lower: round10(Math.max(200, estimate - rmse)),
    upper: round10(Math.min(800, estimate + rmse)),
  };
}

export function scaledSectionScore(
  correct: number,
  total: number,
  routedEasy = false,
  section: "rw" | "math" = "rw",
  test: number | null = null,
  modules?: ModuleScore[],
): number {
  return sectionScoreRange(correct, total, { section, routedEasy, test, modules }).estimate;
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
