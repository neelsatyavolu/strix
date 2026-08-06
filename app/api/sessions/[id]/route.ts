import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sectionScoreRange, routeModule2 } from "@/lib/scoring/curve";
import { isValueCorrect, questionHasKey } from "@/lib/practice/grading.mjs";

// DELETE /api/sessions/:id — permanently remove one of the caller's own
// sessions. Scoped to user_id so a tutor can't delete a student's history;
// session_questions and answers cascade away with the parent row.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/sessions/:id — one persisted session assembled into a review payload
// (score + per-question right/wrong from the stored snapshots). RLS scopes
// access to the owning student or their active tutor, so no studentId is needed.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data: sess, error: sErr } = await supabase
    .from("practice_sessions")
    .select("id, mode, section, config, scaled_score, score_correct, score_total, accuracy, created_at")
    .eq("id", id)
    .maybeSingle();
  if (sErr) return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });
  if (!sess) return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });

  const [{ data: sqs }, { data: ans }] = await Promise.all([
    supabase
      .from("session_questions")
      .select("id, ordinal, module, section, domain, snapshot")
      .eq("session_id", id)
      .order("ordinal", { ascending: true }),
    supabase
      .from("answers")
      .select("session_question_id, value, is_correct, flagged, time_ms")
      .eq("session_id", id),
  ]);

  const ansByQ = new Map((ans ?? []).map((a) => [a.session_question_id, a]));
  const review = (sqs ?? [])
    // Skipped questions (no answer recorded) don't count toward stats, so they're
    // not shown in the review — keeps the list consistent with the score header.
    .filter((sq) => {
      const a = ansByQ.get(sq.id);
      return a && a.value != null && String(a.value).trim() !== "";
    })
    .map((sq) => {
      const a = ansByQ.get(sq.id);
      const q = { ...(sq.snapshot ?? {}) } as Record<string, unknown> & {
        type?: string;
        correct?: string[];
        pretest?: boolean;
      };
      // Re-grade from the stored key when present so SPR fixes (0.48 ≡ .48)
      // and similar apply to historical reviews without waiting on a migration.
      let isCorrect = !!a?.is_correct;
      if (a?.value != null && questionHasKey(q)) {
        isCorrect = isValueCorrect(q, a.value);
      }
      // Never surface legacy Unscored badges.
      delete q.pretest;
      return {
        question: q,
        module: sq.module,
        response: a ? { value: a.value, flagged: a.flagged } : null,
        isCorrect,
        isPretest: false,
        timeMs: a?.time_ms ?? null,
      };
    });

  const byDomain = new Map<string, { domain: string; label: string; correct: number; total: number }>();
  for (const item of review) {
    const q = item.question as { domain?: string; domainLabel?: string };
    const domain = q.domain ?? "";
    const e = byDomain.get(domain) ?? { domain, label: q.domainLabel ?? domain, correct: 0, total: 0 };
    e.total += 1;
    if (item.isCorrect) e.correct += 1;
    byDomain.set(domain, e);
  }

  // Per-module tally (Module 1 / Module 2). Useful for full sections and full
  // exams, where a single session spans both modules; ordinal order keeps m1
  // ahead of m2.
  const MODULE_LABEL: Record<string, string> = { m1: "Module 1", m2: "Module 2" };
  const byModule = new Map<string, { module: string; label: string; correct: number; total: number }>();
  for (const item of review) {
    const mod = item.module ?? "";
    const e = byModule.get(mod) ?? { module: mod, label: MODULE_LABEL[mod] ?? mod, correct: 0, total: 0 };
    e.total += 1;
    if (item.isCorrect) e.correct += 1;
    byModule.set(mod, e);
  }

  const correct = review.filter((item) => item.isCorrect).length;
  const total = review.length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  // Recompute the section score with the current curve so historical full SATs
  // reflect the latest scoring. Route (easy/hard) comes from Module-1 performance.
  const m1 = byModule.get("m1");
  const moduleScores = ["m1", "m2"].map((key) => {
    const stats = byModule.get(key);
    return { correct: stats?.correct ?? 0, total: stats?.total ?? 0 };
  });
  const bluebookTest = (sess.config as { bluebookTest?: unknown })?.bluebookTest;
  const range =
    sess.scaled_score != null
      ? sectionScoreRange(correct, total, {
          section: sess.section === "math" ? "math" : "rw",
          routedEasy: m1 ? routeModule2(m1.correct, m1.total) === "easy" : false,
          test: typeof bluebookTest === "number" ? bluebookTest : null,
          modules: moduleScores,
        })
      : null;

  return NextResponse.json({
    success: true,
    data: {
      id: sess.id,
      section: sess.section,
      mode: sess.mode,
      scaled: range ? range.estimate : sess.scaled_score,
      scaledRange: range ? { lower: range.lower, upper: range.upper } : null,
      correct,
      total,
      accuracy,
      createdAt: sess.created_at,
      byDomain: [...byDomain.values()],
      byModule: [...byModule.values()],
      review,
    },
  });
}
