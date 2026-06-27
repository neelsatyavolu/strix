import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTargetUser } from "@/lib/tutor/scope";
import { RW_DOMAINS, MATH_DOMAINS } from "@/lib/cb/domains";
import type { Section } from "@/lib/cb/types";

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

interface SkillAgg {
  skill: string;
  label: string;
  done: number;
  correct: number;
}

// The session_questions join comes back as an object or a 1-element array.
function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

// GET /api/stats/category?section=rw&domain=INI&limit=100&offset=0
// Per-category drill-down: skill-level accuracy + a paginated attempt history.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const scope = await resolveTargetUser(supabase, user.id, sp.get("studentId"));
  if ("error" in scope) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });
  const targetId = scope.targetId;

  const section: Section = sp.get("section") === "math" ? "math" : "rw";
  const domain = sp.get("domain") ?? "";
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 100)));
  const offset = Math.max(0, Number(sp.get("offset") ?? 0));

  const domains = section === "math" ? MATH_DOMAINS : RW_DOMAINS;
  const label = domains[domain];
  if (!label) return NextResponse.json({ success: false, error: "Unknown category" }, { status: 400 });

  // 1. Lightweight skill aggregates across ALL attempts in this category.
  const { data: all, error: allErr } = await supabase
    .from("answers")
    .select("is_correct, session_questions!inner(section, domain, skill)")
    .eq("user_id", targetId)
    .eq("session_questions.section", section)
    .eq("session_questions.domain", domain)
    .limit(10000);
  if (allErr) return NextResponse.json({ success: false, error: allErr.message }, { status: 500 });

  const skillMap = new Map<string, SkillAgg>();
  let done = 0;
  let correct = 0;
  for (const row of all ?? []) {
    const sq = one(row.session_questions as { skill?: string } | { skill?: string }[]);
    const skill = sq?.skill || "—";
    done += 1;
    if (row.is_correct) correct += 1;
    const s = skillMap.get(skill) ?? { skill, label: skill, done: 0, correct: 0 };
    s.done += 1;
    if (row.is_correct) s.correct += 1;
    skillMap.set(skill, s);
  }

  // 2. The current history page (newest first) — carries full question snapshots.
  const { data: hist, error: hErr } = await supabase
    .from("answers")
    .select("is_correct, value, time_ms, created_at, session_questions!inner(section, domain, skill, difficulty, snapshot)")
    .eq("user_id", targetId)
    .eq("session_questions.section", section)
    .eq("session_questions.domain", domain)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (hErr) return NextResponse.json({ success: false, error: hErr.message }, { status: 500 });

  // Best-effort skill code -> human label from the page's snapshots.
  const labelByCode = new Map<string, string>();
  const attempts = (hist ?? []).map((row) => {
    const sq = one(
      row.session_questions as
        | { skill?: string; difficulty?: string; snapshot?: Record<string, unknown> }
        | { skill?: string; difficulty?: string; snapshot?: Record<string, unknown> }[],
    );
    const snap = (sq?.snapshot ?? {}) as Record<string, unknown>;
    const skill = sq?.skill || "—";
    const skillLabel = String(snap.skillLabel || skill);
    if (sq?.skill && snap.skillLabel) labelByCode.set(sq.skill, skillLabel);
    const correctArr = Array.isArray(snap.correct) ? (snap.correct as string[]) : [];
    return {
      at: row.created_at,
      isCorrect: !!row.is_correct,
      yourAnswer: row.value ?? null,
      correct: correctArr.join(" / "),
      type: String(snap.type || "mcq"),
      difficulty: sq?.difficulty || String(snap.difficulty || ""),
      skill,
      skillLabel,
      stem: stripHtml(snap.stemHtml),
      timeMs: row.time_ms ?? null,
    };
  });

  const skills = [...skillMap.values()]
    .map((s) => ({
      skill: s.skill,
      label: labelByCode.get(s.skill) || s.label,
      done: s.done,
      correct: s.correct,
      accuracy: s.done ? Math.round((s.correct / s.done) * 100) : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy || b.done - a.done);

  return NextResponse.json({
    success: true,
    data: {
      section,
      domain,
      label,
      totals: { done, correct, accuracy: done ? Math.round((correct / done) * 100) : 0 },
      skills,
      attempts,
      offset,
      limit,
      hasMore: offset + attempts.length < done,
    },
  });
}
