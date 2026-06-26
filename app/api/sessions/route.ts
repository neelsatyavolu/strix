import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
  mode: z.enum(["drill", "mock-m1", "mock-full"]),
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

  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 8)));
  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, mode, section, config, score_correct, score_total, accuracy, scaled_score, submitted_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { sessions: data ?? [] } });
}
