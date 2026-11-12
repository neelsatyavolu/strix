import { NextRequest, NextResponse } from "next/server";
import { xanomConfig, xanomJwks } from "@/lib/xanom/config";
import { verifySummaryToken } from "@/lib/xanom/core.mjs";
import { userIdForSub } from "@/lib/xanom/accounts";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://strixprep.com";
const SECTION = { rw: "Reading and Writing", math: "Math" } as Record<string, string>;
const MODE = {
  drill: "drill",
  review: "review",
  "mock-m1": "module",
  "mock-full": "practice section",
  "mock-exam": "practice test",
} as Record<string, string>;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

// GET /api/xanom/summary — called by accounts.xanom.co for the dashboard card.
export async function GET(req: NextRequest) {
  const cfg = xanomConfig();
  if (!cfg) return json({ error: "unavailable" }, 503);
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return json({ error: "unauthorized" }, 401);

  let sub: string;
  try {
    ({ sub } = await verifySummaryToken(token, { jwks: xanomJwks(cfg.issuer), issuer: cfg.issuer, clientId: cfg.clientId }));
  } catch {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const admin = createAdminClient();
    const userId = await userIdForSub(admin, sub);
    if (!userId) return json({ linked: false });

    const now = new Date().toISOString();
    const [sessions, answered, due, recent] = await Promise.all([
      admin.from("practice_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "submitted"),
      admin.from("answers").select("id", { count: "exact", head: true }).eq("user_id", userId).not("value", "is", null),
      admin.from("review_items").select("id", { count: "exact", head: true }).eq("user_id", userId).lte("due_at", now),
      admin
        .from("practice_sessions")
        .select("id, mode, section, submitted_at")
        .eq("user_id", userId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(3),
    ]);
    const failed = [sessions, answered, due, recent].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    const nSessions = sessions.count ?? 0;
    const nAnswered = answered.count ?? 0;
    const nDue = due.count ?? 0;

    return json({
      linked: true,
      headline: `${plural(nSessions, "practice session", "practice sessions")} · ${plural(nAnswered, "question", "questions")}`,
      items: [
        { label: "Practice sessions", value: String(nSessions) },
        { label: "Questions answered", value: String(nAnswered) },
        { label: "Due for review", value: String(nDue) },
      ],
      recent: (recent.data || []).map((r) => ({
        title: `${SECTION[r.section] || "SAT"} ${MODE[r.mode] || "session"}`,
        url: `${SITE}/app#/session-detail?id=${r.id}`,
        at: r.submitted_at,
      })),
      url: `${SITE}/app`,
    });
  } catch (e) {
    console.error("xanom summary failed:", e instanceof Error ? e.message : "unknown");
    return json({ error: "failed" }, 500);
  }
}
