import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Sections = z.array(z.enum(["rw", "math"])).min(1, "Choose at least one section");

// Parse + validate the shared filter params used by both the count preview (GET)
// and the actual delete (DELETE). `olderThanDays` is optional → null means all time.
function parseFilters(req: NextRequest) {
  const sectionsRaw = (req.nextUrl.searchParams.get("sections") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const sections = Sections.safeParse(sectionsRaw);
  if (!sections.success) {
    return { error: sections.error.issues[0]?.message ?? "Invalid sections" } as const;
  }

  const daysRaw = req.nextUrl.searchParams.get("olderThanDays");
  let cutoffISO: string | null = null;
  if (daysRaw != null && daysRaw !== "") {
    const days = Number(daysRaw);
    if (!Number.isFinite(days) || days <= 0) {
      return { error: "Invalid olderThanDays" } as const;
    }
    cutoffISO = new Date(Date.now() - days * 86_400_000).toISOString();
  }

  return { sections: sections.data, cutoffISO } as const;
}

// GET /api/sessions/purge?sections=rw,math&olderThanDays=30
// Returns how many sessions the current filters would delete (live preview).
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const filters = parseFilters(req);
  if ("error" in filters) return NextResponse.json({ success: false, error: filters.error }, { status: 400 });

  let query = supabase
    .from("practice_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("section", filters.sections);
  if (filters.cutoffISO) query = query.lt("created_at", filters.cutoffISO);

  const { count, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { count: count ?? 0 } });
}

// DELETE /api/sessions/purge?sections=rw,math&olderThanDays=30
// Permanently deletes matching sessions for the current user. session_questions
// and answers are removed automatically via ON DELETE CASCADE.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const filters = parseFilters(req);
  if ("error" in filters) return NextResponse.json({ success: false, error: filters.error }, { status: 400 });

  let query = supabase
    .from("practice_sessions")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .in("section", filters.sections);
  if (filters.cutoffISO) query = query.lt("created_at", filters.cutoffISO);

  const { count, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: { deleted: count ?? 0 } });
}
