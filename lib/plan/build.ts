import type { Section } from "@/lib/cb/types";

// Derive a "this week" study plan from data the app already has: the student's
// goal (target score + test date), their weakest domains (from /api/stats), how
// much they've practiced lately, and how many spaced-repetition reviews are due.
// Nothing is persisted — the plan is recomputed each time so it always reflects
// current performance.

export type Difficulty = "easy" | "med" | "hard" | "all";

export interface PlanTask {
  id: string;
  kind: "review" | "drill" | "diagnostic";
  section: Section;
  category: string | null; // PracticeSetup category id (e.g. "alg"), null for review/diagnostic
  difficulty: Difficulty;
  count: number;
  title: string;
  reason: string;
}

export interface WeakDomain {
  section: Section;
  code: string;
  label: string;
  accuracy: number | null;
}

export interface StudyPlan {
  target: number | null;
  currentEstimate: number | null;
  gap: number | null;
  daysUntilTest: number | null;
  testDate: string | null;
  weakDomains: WeakDomain[];
  dueReviewCount: number;
  weekProgress: { done: number; goal: number };
  tasks: PlanTask[];
}

interface FocusEntry {
  section: Section;
  id: string;
  code: string;
  label: string;
  accuracy: number | null;
  attempts: number;
}

interface StatsInput {
  scores?: { rw: number | null; math: number | null; total: number | null } | null;
  focus?: FocusEntry[] | null;
}

interface ProfileInput {
  target_score?: number | null;
  test_date?: string | null;
}

interface SessionInput {
  created_at?: string | null;
}

const WEEKLY_SESSION_GOAL = 5;
const DRILL_COUNT = 10;

// A weak domain's recommended difficulty: meet the student where they are —
// rebuild from easier items when accuracy is low, push harder once it's solid.
function pickDifficulty(accuracy: number | null): Difficulty {
  if (accuracy == null) return "med";
  if (accuracy < 55) return "easy";
  if (accuracy < 75) return "med";
  return "hard";
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
}

export function buildPlan(input: {
  profile: ProfileInput | null;
  stats: StatsInput | null;
  sessions: SessionInput[];
  dueReviewCount: number;
  now: Date;
}): StudyPlan {
  const { profile, stats, sessions, dueReviewCount, now } = input;

  const target = profile?.target_score ?? null;
  const currentEstimate = stats?.scores?.total ?? null;
  const gap = target != null && currentEstimate != null ? target - currentEstimate : null;

  const testDate = profile?.test_date ?? null;
  const daysUntilTest = testDate ? Math.max(0, daysBetween(now, new Date(testDate))) : null;

  const focus = stats?.focus ?? [];
  const weakDomains: WeakDomain[] = focus.map((f) => ({
    section: f.section,
    code: f.code,
    label: f.label,
    accuracy: f.accuracy,
  }));

  const weekStart = new Date(now.getTime() - 7 * 86_400_000);
  const done = sessions.filter((s) => s.created_at && new Date(s.created_at) >= weekStart).length;

  const tasks: PlanTask[] = [];

  if (dueReviewCount > 0) {
    tasks.push({
      id: "review",
      kind: "review",
      section: "rw",
      category: null,
      difficulty: "all",
      count: dueReviewCount,
      title: `Review ${dueReviewCount} missed question${dueReviewCount === 1 ? "" : "s"}`,
      reason: "Spaced repetition — questions you've missed before, resurfacing now.",
    });
  }

  for (const f of focus) {
    tasks.push({
      id: `drill-${f.section}-${f.id}`,
      kind: "drill",
      section: f.section,
      category: f.id,
      difficulty: pickDifficulty(f.accuracy),
      count: DRILL_COUNT,
      title: `Practice ${f.label}`,
      reason:
        f.accuracy != null
          ? `One of your weakest areas (${f.accuracy}% recent accuracy).`
          : "A focus area worth more reps.",
    });
  }

  // New student with no score yet and nothing flagged: get a baseline so the
  // plan has something to target next week.
  if (!focus.length && currentEstimate == null) {
    tasks.push({
      id: "diag-rw",
      kind: "diagnostic",
      section: "rw",
      category: null,
      difficulty: "all",
      count: 0,
      title: "Take a Reading & Writing section",
      reason: "Establish a baseline so your plan can target the right skills.",
    });
    tasks.push({
      id: "diag-math",
      kind: "diagnostic",
      section: "math",
      category: null,
      difficulty: "all",
      count: 0,
      title: "Take a Math section",
      reason: "Establish a baseline Math score.",
    });
  }

  return {
    target,
    currentEstimate,
    gap,
    daysUntilTest,
    testDate,
    weakDomains,
    dueReviewCount,
    weekProgress: { done, goal: WEEKLY_SESSION_GOAL },
    tasks,
  };
}
