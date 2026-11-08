import type { SupabaseClient } from "@supabase/supabase-js";
import { compositeScore, sectionScoreRange, routeModule2, type ScoreRange } from "./curve";
import { moduleTotalsForScore } from "./moduleTotals.mjs";

// Recompute persisted full-section scores with the CURRENT scoring curve, so
// historical full SATs always reflect the latest scoring (rather than the value
// frozen at completion time). We re-derive the Module-2 route from each session's
// stored Module-1 performance — the same signal the live test routed on — and
// feed stored per-module correct/total counts through `sectionScoreRange`.

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
      .select("id, session_id, module, snapshot")
      .in("session_id", ids),
    supabase
      .from("answers")
      .select("session_question_id, is_correct")
      .in("session_id", ids),
  ]);

  const correctByQ = new Map((ans ?? []).map((a) => [a.session_question_id, !!a.is_correct]));
  const answersBySession = new Map<string, { module: string; isCorrect: boolean }[]>();
  for (const sq of sqs ?? []) {
    // All answered items count (legacy pretest carve-out removed).
    if (!correctByQ.has(sq.id)) continue;
    const list = answersBySession.get(sq.session_id) ?? [];
    list.push({ module: sq.module ?? "", isCorrect: !!correctByQ.get(sq.id) });
    answersBySession.set(sq.session_id, list);
  }

  for (const r of targets) {
    const section = r.section === "math" ? "math" : "rw";
    const persisted = answersBySession.get(r.id) ?? [];
    const hasServedLength = Array.isArray(r.config?.moduleScores);
    // No rows and no saved length: leave modules unset so scoring falls back to
    // the stored correct/total instead of treating the section as 0/0.
    // Otherwise fold skips back in so a 20-of-27 isn't rescored as 20-of-20.
    const modules = persisted.length || hasServedLength
      ? moduleTotalsForScore({ section, config: r.config, answers: persisted })
      : undefined;
    const m1 = modules?.[0] ?? { correct: 0, total: 0 };
    out.set(
      r.id,
      sectionScoreRange(r.score_correct ?? 0, r.score_total ?? 0, {
        section,
        routedEasy: routeModule2(m1.correct, m1.total) === "easy",
        test: bluebookTestOf(r.config),
        modules,
      }),
    );
  }
  return out;
}

interface AssignmentRow {
  mode: string;
  session_id: string | null;
  session_id_2: string | null;
  scaled_score: number | null;
}

/**
 * Completed section/full-SAT assignments keep a frozen `scaled_score` for quick
 * display. Recompute the value on read so older completed tests also adopt the
 * current scoring curve without a destructive data migration.
 */
export async function rescoreAssignments<T extends AssignmentRow>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<T[]> {
  const ids = [
    ...new Set(
      rows
        .flatMap((r) => [r.session_id, r.session_id_2])
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  if (!ids.length) return rows;

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("id, mode, section, config, score_correct, score_total, scaled_score")
    .in("id", ids);

  const sessionRows = (sessions ?? []) as SessionRow[];
  const rescored = await rescoreSessions(supabase, sessionRows);
  const scoreById = new Map(
    sessionRows.map((s) => [s.id, rescored.get(s.id)?.estimate ?? s.scaled_score ?? null]),
  );

  return rows.map((row) => {
    if (row.mode === "mock-full" && row.session_id) {
      return { ...row, scaled_score: scoreById.get(row.session_id) ?? row.scaled_score };
    }
    if (row.mode === "mock-exam" && row.session_id && row.session_id_2) {
      const rw = scoreById.get(row.session_id);
      const math = scoreById.get(row.session_id_2);
      if (rw != null && math != null) {
        return { ...row, scaled_score: compositeScore(rw, math) };
      }
    }
    return row;
  });
}
