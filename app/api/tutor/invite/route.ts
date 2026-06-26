import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
    .select("tutor_id, status, created_at, profiles!tutor_memberships_tutor_id_fkey(full_name, email)")
    .eq("student_id", user.id)
    .eq("status", "active");

  return NextResponse.json({ success: true, data: { link: links?.[0] ?? null, tutors: members ?? [] } });
}
