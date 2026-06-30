import type { SupabaseClient } from "@supabase/supabase-js";
import { sectionScoreRange, routeModule2, type ScoreRange } from "./curve";

// Recompute persisted full-section scores with the CURRENT scoring curve, so
// historical full SATs always reflect the latest scoring (rather than the value
// frozen at completion time). We re-derive the Module-2 route from each session's
// stored Module-1 performance — the same signal the live test routed on — and
// feed the stored scored correct/total through `sectionScoreRange`.

interface SessionRow {
  id: string;
  mode: string;
  section: string;
  config: Record<string, unknown> | null;
  score_correct: number | null;
  score_total: number | null;
  scaled_score: number | null;
}

function bluebookTestOf(config: Record<string, unknown> | null): number | null {
  const t = config?.bluebookTest;
  return typeof t === "number" ? t : null;
}

/**
 * Map of session id → freshly recomputed score range, for the scored full-section
 * rows in `rows` (drills/single modules are skipped). One batched query loads the
 * Module-1 answers needed to determine the easy/hard route.
 */
export async function rescoreSessions(
  supabase: SupabaseClient,
  rows: SessionRow[],
): Promise<Map<string, ScoreRange>> {
  const out = new Map<string, ScoreRange>();
  const targets = rows.filter(
    (r) => r.mode === "mock-full" && r.scaled_score != null && !!r.score_total,
  );
  if (!targets.length) return out;
  const ids = targets.map((r) => r.id);

  const [{ data: sqs }, { data: ans }] = await Promise.all([
    supabase
      .from("session_questions")
      .select("id, session_id, snapshot")
      .in("session_id", ids)
      .eq("module", "m1"),
    supabase
      .from("answers")
      .select("session_question_id, is_correct")
      .in("session_id", ids),
  ]);

  const correctByQ = new Map((ans ?? []).map((a) => [a.session_question_id, !!a.is_correct]));
  const m1 = new Map<string, { correct: number; total: number }>();
  for (const sq of sqs ?? []) {
    const snap = (sq.snapshot ?? {}) as { pretest?: boolean };
    if (snap.pretest || !correctByQ.has(sq.id)) continue; // scored, answered only
    const e = m1.get(sq.session_id) ?? { correct: 0, total: 0 };
    e.total += 1;
    if (correctByQ.get(sq.id)) e.correct += 1;
    m1.set(sq.session_id, e);
  }

  for (const r of targets) {
    const stats = m1.get(r.id) ?? { correct: 0, total: 0 };
    out.set(
      r.id,
      sectionScoreRange(r.score_correct ?? 0, r.score_total ?? 0, {
        section: r.section === "math" ? "math" : "rw",
        routedEasy: routeModule2(stats.correct, stats.total) === "easy",
        test: bluebookTestOf(r.config),
      }),
    );
  }
  return out;
}
