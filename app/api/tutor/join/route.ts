import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ token: z.string().min(8) });

// POST /api/tutor/join — a signed-in tutor joins a student via an invite token.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Sign in to join." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 400 });

  // Token lookup must bypass RLS (the link belongs to the student, not the tutor).
  const admin = createAdminClient();
  const { data: link } = await admin
    .from("tutor_links")
    .select("student_id, can_watch, can_chat")
    .eq("token", parsed.data.token)
    .maybeSingle();
  if (!link) return NextResponse.json({ success: false, error: "This invite link is invalid or expired." }, { status: 404 });
  if (link.student_id === user.id) {
    return NextResponse.json({ success: false, error: "You can't tutor your own account." }, { status: 400 });
  }

  const { error: mErr } = await admin
    .from("tutor_memberships")
    .upsert({ student_id: link.student_id, tutor_id: user.id, status: "active" }, { onConflict: "student_id,tutor_id" });
  if (mErr) return NextResponse.json({ success: false, error: mErr.message }, { status: 500 });

  const { data: student } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", link.student_id)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    data: {
      studentId: link.student_id,
      studentName: student?.full_name || "your student",
      canWatch: link.can_watch,
      canChat: link.can_chat,
    },
  });
}
