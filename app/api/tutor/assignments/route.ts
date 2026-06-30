import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSIGNMENT_COLS =
  "id, student_id, title, section, mode, domain, skill, difficulty, question_count, bluebook_test, module_key, due_at, status, session_id, session_id_2, score_correct, score_total, scaled_score, feedback, created_at, completed_at";

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
  // The assignment type, as the engine's own mode strings.
  mode: z.enum(["drill", "mock-m1", "mock-full", "mock-exam"]).default("drill"),
  // Required for every type except a full SAT (which covers both sections).
  section: z.enum(["rw", "math"]).nullable().optional(),
  // PracticeSetup category id (e.g. "alg") the drill should focus on; null = any.
  category: z.string().max(40).nullable().optional(),
  difficulty: z.enum(["all", "easy", "med", "hard"]).default("all"),
  count: z.number().int().min(1).max(50).default(10),
  // Official Bluebook test number (5–11); null = randomized Question Bank.
  bluebookTest: z.number().int().min(5).max(11).nullable().optional(),
  // For a single module: m1 = Module 1, easy = Module 2A, hard = Module 2B.
  moduleKey: z.enum(["m1", "easy", "hard"]).nullable().optional(),
  dueAt: z.string().nullable().optional(),
});

// POST /api/tutor/assignments — assign a drill, module, section, or full SAT.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = NewAssignment.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  const a = parsed.data;

  // Every type except a full SAT targets one section.
  if (a.mode !== "mock-exam" && !a.section) {
    return NextResponse.json({ success: false, error: "Pick a section." }, { status: 400 });
  }
  // Module 2A/2B exist only in official forms, so they need a Bluebook test.
  if (a.mode === "mock-m1" && (a.moduleKey === "easy" || a.moduleKey === "hard") && a.bluebookTest == null) {
    return NextResponse.json({ success: false, error: "Module 2A/2B requires a Bluebook test." }, { status: 400 });
  }

  // RLS enforces the active-tutor relationship on insert; this gives a clean 403.
  const { data: ok } = await supabase.rpc("is_tutor_of", { student: a.studentId });
  if (!ok) return NextResponse.json({ success: false, error: "Not your student." }, { status: 403 });

  const isDrill = a.mode === "drill";
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      tutor_id: user.id,
      student_id: a.studentId,
      title: a.title,
      mode: a.mode,
      section: a.mode === "mock-exam" ? null : a.section,
      domain: isDrill ? a.category ?? null : null,
      difficulty: isDrill && a.difficulty !== "all" ? a.difficulty : null,
      question_count: a.count, // NOT NULL in schema; defaults to 10, only meaningful for drills
      bluebook_test: isDrill ? null : a.bluebookTest ?? null,
      module_key: a.mode === "mock-m1" ? a.moduleKey ?? "m1" : null,
      due_at: a.dueAt ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { id: data.id } });
}

const EditAssignment = z.object({
  id: z.uuid(),
  feedback: z.string().max(2000).nullable().optional(),
  // Retract an open assignment (soft — the record is kept).
  status: z.literal("retracted").optional(),
});

// PATCH /api/tutor/assignments — update tutor feedback, or retract an open one.
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = EditAssignment.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }
  const { id, feedback, status } = parsed.data;

  // Retract: only an open assignment can be retracted; completed ones are kept.
  if (status === "retracted") {
    const { data, error } = await supabase
      .from("assignments")
      .update({ status: "retracted" })
      .eq("id", id)
      .eq("tutor_id", user.id)
      .eq("status", "assigned")
      .select("id");
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    if (!data?.length) return NextResponse.json({ success: false, error: "Only an open assignment can be retracted." }, { status: 409 });
    return NextResponse.json({ success: true, data: { id } });
  }

  // RLS limits the update to assignments this tutor owns for an active student.
  const { error } = await supabase
    .from("assignments")
    .update({ feedback: feedback ?? null })
    .eq("id", id)
    .eq("tutor_id", user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { id } });
}
