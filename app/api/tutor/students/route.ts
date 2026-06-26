import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/tutor/students — students who have added the current user as their
// tutor. Used to decide whether the "Tutor view" switch should be offered at all.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data: students, error } = await supabase
    .from("tutor_memberships")
    .select("student_id, status, created_at, profiles!tutor_memberships_student_id_fkey(full_name, email)")
    .eq("tutor_id", user.id)
    .eq("status", "active");
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { students: students ?? [] } });
}
