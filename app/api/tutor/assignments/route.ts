import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSIGNMENT_COLS =
  "id, student_id, title, section, domain, skill, difficulty, question_count, due_at, status, session_id, score_correct, score_total, created_at, completed_at";

// GET /api/tutor/assignments[?studentId=] — assignments this tutor has created.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId");
  let query = supabase
    .from("assignments")
    .select(ASSIGNMENT_COLS)
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { assignments: data ?? [] } });
}

const NewAssignment = z.object({
  studentId: z.uuid(),
  title: z.string().min(1).max(120),
  section: z.enum(["rw", "math"]),
  // PracticeSetup category id (e.g. "alg") the drill should focus on; null = any.
  category: z.string().max(40).nullable().optional(),
  difficulty: z.enum(["all", "easy", "med", "hard"]).default("all"),
  count: z.number().int().min(1).max(50).default(10),
  dueAt: z.string().nullable().optional(),
});

// POST /api/tutor/assignments — assign a drill to one of the tutor's students.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = NewAssignment.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  const a = parsed.data;

  // RLS enforces the active-tutor relationship on insert; this gives a clean 403.
  const { data: ok } = await supabase.rpc("is_tutor_of", { student: a.studentId });
  if (!ok) return NextResponse.json({ success: false, error: "Not your student." }, { status: 403 });

  const { data, error } = await supabase
    .from("assignments")
    .insert({
      tutor_id: user.id,
      student_id: a.studentId,
      title: a.title,
      section: a.section,
      domain: a.category ?? null,
      difficulty: a.difficulty === "all" ? null : a.difficulty,
      question_count: a.count,
      due_at: a.dueAt ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { id: data.id } });
}
