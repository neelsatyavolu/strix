import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { seedActivity } from "@/lib/dev/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A full test draws ~98 real CB questions across four module fetches.
export const maxDuration = 300;

// Allowlisted actor emails (comma-separated). Unset ⇒ feature fully disabled.
// Public so the client can gate the Dev tab on the same list; it's an allowlist,
// not a secret. The service-role write still happens only on the server.
function allowlist(): string[] {
  return (process.env.NEXT_PUBLIC_DEV_SEED_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const Body = z
  .object({
    email: z.email(),
    kind: z.enum(["test", "section", "module"]),
    section: z.enum(["rw", "math"]).optional(),
    scorePct: z.number().min(0).max(100),
    daysAgo: z.number().int().min(0).max(365).optional(),
  })
  .refine((b) => b.kind === "test" || !!b.section, {
    message: "section is required for a section or module",
    path: ["section"],
  });

// POST /api/dev/seed — fabricate completed practice activity for a target account.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const allowed = allowlist();
  const actorEmail = (user.email ?? "").toLowerCase();
  if (!allowed.length || !allowed.includes(actorEmail)) {
    return NextResponse.json({ success: false, error: "Dev tools are not enabled for this account" }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" }, { status: 400 });
  }

  try {
    const sessions = await seedActivity(parsed.data);
    return NextResponse.json({ success: true, data: { sessions } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Seed failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
