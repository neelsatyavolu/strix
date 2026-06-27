import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, mode, section, scaled_score, score_correct, score_total, accuracy, created_at")
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
      const q = (sq.snapshot ?? {}) as Record<string, unknown>;
      return {
        question: q,
        response: a ? { value: a.value, flagged: a.flagged } : null,
        isCorrect: !!a?.is_correct,
        isPretest: !!q.pretest,
        timeMs: a?.time_ms ?? null,
      };
    });

  const byDomain = new Map<string, { domain: string; label: string; correct: number; total: number }>();
  for (const item of review) {
    if (item.isPretest) continue;
    const q = item.question as { domain?: string; domainLabel?: string };
    const domain = q.domain ?? "";
    const e = byDomain.get(domain) ?? { domain, label: q.domainLabel ?? domain, correct: 0, total: 0 };
    e.total += 1;
    if (item.isCorrect) e.correct += 1;
    byDomain.set(domain, e);
  }

  return NextResponse.json({
    success: true,
    data: {
      id: sess.id,
      section: sess.section,
      mode: sess.mode,
      scaled: sess.scaled_score,
      correct: sess.score_correct,
      total: sess.score_total,
      accuracy: sess.accuracy,
      createdAt: sess.created_at,
      byDomain: [...byDomain.values()],
      review,
    },
  });
}
