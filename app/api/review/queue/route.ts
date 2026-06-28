import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTargetUser } from "@/lib/tutor/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// How many due questions to serve in one review session.
const MAX_REVIEW = 15;

// GET /api/review/queue — spaced-repetition questions due now. Returns the total
// due count + a per-domain breakdown, plus the snapshots to serve this round.
// A tutor may pass ?studentId= to read a student's queue (count/breakdown only).
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const scope = await resolveTargetUser(supabase, user.id, req.nextUrl.searchParams.get("studentId"));
  if ("error" in scope) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });

  // Review sessions run one section at a time (the question UI is per-section).
  // With ?section=rw|math we also return the snapshots to serve that round.
  const sectionParam = req.nextUrl.searchParams.get("section");
  const section = sectionParam === "rw" || sectionParam === "math" ? sectionParam : null;

  const { data, error } = await supabase
    .from("review_items")
    .select("section, domain, snapshot, due_at")
    .eq("user_id", scope.targetId)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const rows = data ?? [];
  const bySection = { rw: rows.filter((r) => r.section === "rw").length, math: rows.filter((r) => r.section === "math").length };
  const scoped = section ? rows.filter((r) => r.section === section) : rows;

  const byDomainMap = new Map<string, { domain: string; label: string; count: number }>();
  for (const r of scoped) {
    const label = (r.snapshot as { domainLabel?: string })?.domainLabel ?? r.domain ?? "Other";
    const key = String(r.domain ?? label);
    const e = byDomainMap.get(key) ?? { domain: key, label, count: 0 };
    e.count += 1;
    byDomainMap.set(key, e);
  }
  // Snapshots are stored in the exact shape the practice session UI consumes.
  const questions = section ? scoped.slice(0, MAX_REVIEW).map((r) => r.snapshot) : [];

  return NextResponse.json({
    success: true,
    data: { count: rows.length, bySection, byDomain: [...byDomainMap.values()], questions },
  });
}
