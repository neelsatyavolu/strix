import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RW_DOMAINS, MATH_DOMAINS, DOMAIN_TO_CATEGORY } from "@/lib/cb/domains";
import type { Section } from "@/lib/cb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CatAgg {
  id: string;
  label: string;
  done: number;
  correct: number;
}

function emptyCats(domains: Record<string, string>): Map<string, CatAgg> {
  const m = new Map<string, CatAgg>();
  for (const [code, label] of Object.entries(domains)) {
    m.set(code, { id: DOMAIN_TO_CATEGORY[code] ?? code, label, done: 0, correct: 0 });
  }
  return m;
}

// GET /api/stats — aggregate the signed-in user's practice into dashboard/stats data.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  // 1. per-question results joined to their section/domain
  const { data: answers, error: aErr } = await supabase
    .from("answers")
    .select("is_correct, session_questions!inner(section, domain)")
    .limit(10000);
  if (aErr) return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });

  const rwCats = emptyCats(RW_DOMAINS);
  const mathCats = emptyCats(MATH_DOMAINS);
  const sectionTotals: Record<Section, { done: number; correct: number }> = {
    rw: { done: 0, correct: 0 },
    math: { done: 0, correct: 0 },
  };

  for (const row of answers ?? []) {
    const sq = (row as { session_questions: { section: Section; domain: string } | { section: Section; domain: string }[] }).session_questions;
    const meta = Array.isArray(sq) ? sq[0] : sq;
    if (!meta) continue;
    const cats = meta.section === "math" ? mathCats : rwCats;
    const c = cats.get(meta.domain);
    sectionTotals[meta.section].done += 1;
    if (row.is_correct) sectionTotals[meta.section].correct += 1;
    if (c) {
      c.done += 1;
      if (row.is_correct) c.correct += 1;
    }
  }

  const toCatList = (m: Map<string, CatAgg>) =>
    [...m.values()].map((c) => ({
      id: c.id,
      label: c.label,
      done: c.done,
      accuracy: c.done ? Math.round((c.correct / c.done) * 100) : 0,
    }));

  // 2. sessions for scores-over-time + latest section scores + last-session accuracy
  const { data: sessions, error: sErr } = await supabase
    .from("practice_sessions")
    .select("section, mode, scaled_score, accuracy, created_at")
    .order("created_at", { ascending: true })
    .limit(500);
  if (sErr) return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });

  const scored = (sessions ?? []).filter((s) => s.scaled_score != null);
  const latestScore = (section: Section) => {
    const list = scored.filter((s) => s.section === section);
    return list.length ? list[list.length - 1].scaled_score : null;
  };
  const lastAccuracy = (section: Section) => {
    const list = (sessions ?? []).filter((s) => s.section === section);
    return list.length ? list[list.length - 1].accuracy : null;
  };

  const rwScore = latestScore("rw");
  const mathScore = latestScore("math");

  return NextResponse.json({
    success: true,
    data: {
      scores: {
        rw: rwScore,
        math: mathScore,
        total: rwScore != null && mathScore != null ? rwScore + mathScore : null,
      },
      sectionTotals,
      lastAccuracy: { rw: lastAccuracy("rw"), math: lastAccuracy("math") },
      categories: { rw: toCatList(rwCats), math: toCatList(mathCats) },
      overTime: scored.map((s) => ({ section: s.section, score: s.scaled_score, at: s.created_at })),
      sessionCount: (sessions ?? []).length,
    },
  });
}
