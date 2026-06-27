import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  canWatch: z.boolean().default(true),
  canChat: z.boolean().default(true),
});

// POST /api/tutor/invite — student creates (or refreshes) an invite link.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const { canWatch, canChat } = parsed.success ? parsed.data : { canWatch: true, canChat: true };

  const token = randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("tutor_links").insert({
    student_id: user.id,
    token,
    can_watch: canWatch,
    can_chat: canChat,
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, data: { token } });
}

// GET /api/tutor/invite — list the student's links + connected tutors.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data: links } = await supabase
    .from("tutor_links")
    .select("token, can_watch, can_chat, created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  const { data: members } = await supabase
    .from("tutor_memberships")
    .select("tutor_id, status, created_at")
    .eq("student_id", user.id)
    .eq("status", "active");

  // A student can't read their tutor's profile under RLS (only tutor→student is
  // allowed), and student_id/tutor_id reference auth.users (no profile embed),
  // so resolve tutor names with the admin client.
  const ids = (members ?? []).map((m) => m.tutor_id);
  let profilesById: Record<string, { full_name: string | null; email: string | null }> = {};
  if (ids.length) {
    const admin = createAdminClient();
    const { data: profs } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }]));
  }
  const tutors = (members ?? []).map((m) => ({
    tutor_id: m.tutor_id,
    status: m.status,
    created_at: m.created_at,
    profiles: profilesById[m.tutor_id] ?? null,
  }));

  return NextResponse.json({ success: true, data: { link: links?.[0] ?? null, tutors } });
}
