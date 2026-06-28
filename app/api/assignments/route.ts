import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      "id, tutor_id, title, section, domain, difficulty, question_count, due_at, status, session_id, score_correct, score_total, created_at, completed_at",
    )
    .eq("student_id", user.id)
    .order("status", { ascending: true }) // 'assigned' before 'completed'
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { assignments: data ?? [] } });
}
