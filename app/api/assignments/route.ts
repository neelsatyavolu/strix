import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rescoreAssignments } from "@/lib/scoring/rescore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/assignments — the signed-in student's own assignments (open first).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("assignments")
    .select(
      "id, tutor_id, title, section, mode, domain, difficulty, question_count, bluebook_test, module_key, due_at, status, session_id, session_id_2, score_correct, score_total, scaled_score, feedback, created_at, completed_at",
    )
    .eq("student_id", user.id)
    .order("status", { ascending: true }) // 'assigned' before 'completed'
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  const assignments = await rescoreAssignments(supabase, data ?? []);
  return NextResponse.json({ success: true, data: { assignments } });
}

const CompleteExam = z.object({
  id: z.uuid(),
  rwSessionId: z.uuid(),
  mathSessionId: z.uuid(),
  scaled: z.number().int().nullable().optional(),
});

// PATCH /api/assignments — a student completes a full-SAT assignment. A full SAT
// persists as two half-sessions, so (unlike single-session drills/modules/sections,
// which complete via /api/sessions) it's finalized here once both halves are saved,
// linking both halves and the composite score. RLS limits the update to the
// student's own assignment.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = CompleteExam.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  const { id, rwSessionId, mathSessionId, scaled } = parsed.data;

  const { error } = await supabase
    .from("assignments")
    .update({
      status: "completed",
      session_id: rwSessionId,
      session_id_2: mathSessionId,
      scaled_score: scaled ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("student_id", user.id)
    .eq("status", "assigned"); // don't resurrect a retracted/already-done assignment
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { id } });
}
