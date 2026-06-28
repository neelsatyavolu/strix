import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/tutor/students — students who have added the current user as their
// tutor. Used to decide whether the "Tutor view" switch should be offered.
//
// tutor_memberships.student_id references auth.users (not profiles), so we can't
// embed the profile via a PostgREST relationship — fetch names in a second
// query (allowed by the profiles_tutor_read RLS policy).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data: memberships, error } = await supabase
    .from("tutor_memberships")
    .select("student_id, status, created_at")
    .eq("tutor_id", user.id)
    .eq("status", "active");
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const ids = (memberships ?? []).map((m) => m.student_id);
  let profilesById: Record<string, { full_name: string | null; email: string | null; target_score: number | null; test_date: string | null }> = {};
  if (ids.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email, target_score, test_date")
      .in("id", ids);
    profilesById = Object.fromEntries(
      (profs ?? []).map((p) => [
        p.id,
        { full_name: p.full_name, email: p.email, target_score: p.target_score, test_date: p.test_date },
      ]),
    );
  }

  const students = (memberships ?? []).map((m) => ({
    student_id: m.student_id,
    status: m.status,
    created_at: m.created_at,
    profiles: profilesById[m.student_id] ?? null,
  }));

  return NextResponse.json({ success: true, data: { students } });
}
