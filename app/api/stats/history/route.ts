import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTargetUser } from "@/lib/tutor/scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Plain-text preview of sanitized question HTML (drop tags, collapse space).
function stripHtml(html: unknown): string {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// The session_questions join comes back as an object or a 1-element array.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

// GET /api/stats/history — the tutor's per-question history lookup. Filters:
//   limit (1..200), offset, section=rw|math, onlyWrong=1,
//   q=<keyword over topic+stem>, since/until=YYYY-MM-DD.
// Newest first; each attempt carries a short stem so the tutor can cite it.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const scope = await resolveTargetUser(supabase, user.id, sp.get("studentId"));
  if ("error" in scope) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });
  const targetId = scope.targetId;

  const limit = Math.min(200, Math.max(1, Number(sp.get("limit") ?? 40)));
  const offset = Math.max(0, Number(sp.get("offset") ?? 0));
  const section = sp.get("section") === "rw" ? "rw" : sp.get("section") === "math" ? "math" : null;
  const onlyWrong = sp.get("onlyWrong") === "1";
  const q = (sp.get("q") ?? "").trim().toLowerCase();
  const since = sp.get("since");
  const until = sp.get("until");

  let query = supabase
    .from("answers")
    .select("is_correct, value, time_ms, created_at, session_questions!inner(section, domain, skill, difficulty, snapshot)")
    .eq("user_id", targetId)
    .not("value", "is", null) // skipped questions aren't part of the answer history
    .order("created_at", { ascending: false });
  if (section) query = query.eq("session_questions.section", section);
  if (onlyWrong) query = query.eq("is_correct", false);
  if (since) query = query.gte("created_at", since);
  if (until) query = query.lte("created_at", until);
  // Keyword filtering runs in JS over the JSON snapshot, so pull a wider slice
  // first; otherwise paginate at the DB level.
  query = q ? query.limit(500) : query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  let attempts = (data ?? []).map((row) => {
    const sqRaw = row.session_questions as
      | { section?: string; difficulty?: string; snapshot?: Record<string, unknown> }
      | { section?: string; difficulty?: string; snapshot?: Record<string, unknown> }[];
    const sq = one(sqRaw);
    const snap = (sq?.snapshot ?? {}) as Record<string, unknown>;
    const correctArr = Array.isArray(snap.correct) ? (snap.correct as string[]) : [];
    return {
      at: row.created_at,
      section: sq?.section || String(snap.section || ""),
      domainLabel: String(snap.domainLabel || ""),
      skillLabel: String(snap.skillLabel || snap.skill || ""),
      difficulty: sq?.difficulty || String(snap.difficulty || ""),
      isCorrect: !!row.is_correct,
      yourAnswer: row.value ?? null,
      correct: correctArr.join(" / "),
      stem: stripHtml(snap.stemHtml).slice(0, 160),
    };
  });

  if (q) {
    attempts = attempts
      .filter((a) => `${a.domainLabel} ${a.skillLabel} ${a.stem}`.toLowerCase().includes(q))
      .slice(offset, offset + limit);
  }

  return NextResponse.json({ success: true, data: { attempts, offset, limit } });
}
