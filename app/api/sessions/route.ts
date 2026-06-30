import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveTargetUser } from "@/lib/tutor/scope";
import { enrollReviews } from "@/lib/review/enroll";
import { rescoreSessions } from "@/lib/scoring/rescore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuestionResult = z.object({
  external_id: z.string().nullable().optional(),
  section: z.enum(["rw", "math"]),
  domain: z.string().optional().default(""),
  skill: z.string().optional().default(""),
  difficulty: z.string().optional().default("M"),
  ordinal: z.number().int(),
  module: z.string().optional().default("drill"),
  snapshot: z.record(z.string(), z.unknown()),
  value: z.string().nullable().optional(),
  is_correct: z.boolean(),
  time_ms: z.number().int().nullable().optional(),
  flagged: z.boolean().optional().default(false),
});

const SaveSession = z.object({
  mode: z.enum(["drill", "mock-m1", "mock-full", "review"]),
  section: z.enum(["rw", "math"]),
  config: z.record(z.string(), z.unknown()).default({}),
  score_correct: z.number().int(),
  score_total: z.number().int(),
  accuracy: z.number().int(),
  scaled_score: z.number().int().nullable().optional(),
  questions: z.array(QuestionResult).min(1),
});

// POST /api/sessions — persist a completed practice session (+ questions + answers).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = SaveSession.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  const p = parsed.data;

  try {
    const { data: session, error: sErr } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        mode: p.mode,
        section: p.section,
        config: p.config,
        status: "submitted",
        score_correct: p.score_correct,
        score_total: p.score_total,
        accuracy: p.accuracy,
        scaled_score: p.scaled_score ?? null,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (sErr || !session) throw new Error(sErr?.message || "session insert failed");

    const sqRows = p.questions.map((q) => ({
      session_id: session.id,
      user_id: user.id,
      ordinal: q.ordinal,
      module: q.module,
      external_id: q.external_id ?? null,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      difficulty: q.difficulty,
      snapshot: q.snapshot,
    }));
    const { data: sqs, error: sqErr } = await supabase
      .from("session_questions")
      .insert(sqRows)
      .select("id, ordinal");
    if (sqErr || !sqs) throw new Error(sqErr?.message || "session_questions insert failed");

    const byOrdinal = new Map(sqs.map((r) => [r.ordinal, r.id]));
    const answerRows = p.questions.map((q) => ({
      session_question_id: byOrdinal.get(q.ordinal),
      session_id: session.id,
      user_id: user.id,
      value: q.value ?? null,
      is_correct: q.is_correct,
      time_ms: q.time_ms ?? null,
      flagged: q.flagged ?? false,
    }));
    const { error: aErr } = await supabase.from("answers").insert(answerRows);
    if (aErr) throw new Error(aErr.message);

    // Spaced-repetition: enroll misses / advance reviewed questions. Drills are
    // retry-until-correct in the moment, so they don't feed Review — only full
    // modules/sections/exams (and review re-attempts) do. Best-effort: a
    // scheduling hiccup must never lose the saved session.
    if (p.mode !== "drill") {
      try {
        const { data: profile } = await supabase
          .from("profiles").select("test_date").eq("id", user.id).single();
        await enrollReviews(supabase, user.id, p.questions, profile?.test_date ?? null);
      } catch { /* review scheduling is best-effort */ }
    }

    // If this drill fulfilled a tutor assignment, mark it complete with the score.
    const assignmentId = typeof (p.config as { assignmentId?: unknown }).assignmentId === "string"
      ? (p.config as { assignmentId: string }).assignmentId
      : null;
    if (assignmentId) {
      try {
        await supabase
          .from("assignments")
          .update({
            status: "completed",
            session_id: session.id,
            score_correct: p.score_correct,
            score_total: p.score_total,
            completed_at: new Date().toISOString(),
          })
          .eq("id", assignmentId)
          .eq("student_id", user.id);
      } catch { /* assignment completion is best-effort */ }
    }

    return NextResponse.json({ success: true, data: { id: session.id } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// GET /api/sessions?limit=8 — recent sessions for the dashboard.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const scope = await resolveTargetUser(supabase, user.id, req.nextUrl.searchParams.get("studentId"));
  if ("error" in scope) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 8)));
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, mode, section, config, score_correct, score_total, accuracy, scaled_score, submitted_at, created_at")
    .eq("user_id", scope.targetId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  // Recompute full-section scores with the current curve so historical tests
  // reflect the latest scoring, not the value frozen at completion.
  const rescored = await rescoreSessions(supabase, data ?? []);
  const sessions = (data ?? []).map((s) => {
    const r = rescored.get(s.id);
    return r ? { ...s, scaled_score: r.estimate, scaledRange: { lower: r.lower, upper: r.upper } } : s;
  });
  return NextResponse.json({ success: true, data: { sessions } });
}
