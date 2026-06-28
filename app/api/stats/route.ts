import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTargetUser } from "@/lib/tutor/scope";
import { RW_DOMAINS, MATH_DOMAINS, DOMAIN_TO_CATEGORY } from "@/lib/cb/domains";
import type { Section } from "@/lib/cb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CatAgg {
  id: string;
  label: string;
  done: number;
  correct: number;
  // Recency-weighted tallies: each answer contributes RECENCY_DECAY^rank, where
  // rank 0 is the most recent attempt. Recent attempts dominate the average.
  wDone: number;
  wCorrect: number;
}

// Per-answer weight decays with how long ago it was attempted. 0.97 gives a
// half-life of ~23 answers — recent practice drives the recommendation while
// older attempts still count a little.
const RECENCY_DECAY = 0.97;
// Shrinkage pseudo-count for a category's recency-weighted accuracy. With little
// recent practice the figure is pulled toward the category's all-time rate, so a
// short cherry-picked drill (e.g. 10 easy algebra questions) can't alone flip a
// domain to "mastered". As recent volume grows, the prior fades and the number
// converges to the pure recency-weighted accuracy. ~8 ≈ eight recent answers.
const RECENT_SHRINK_K = 8;
// Don't recommend a category the student has barely touched.
const FOCUS_MIN_ATTEMPTS = 3;
// Don't recommend a category the student has already mastered — anything at
// 100% recent accuracy isn't a "skill to focus on".
const FOCUS_MAX_ACCURACY = 100;
// How many weak skills to surface on the dashboard.
const FOCUS_COUNT = 2;

function emptyCats(domains: Record<string, string>): Map<string, CatAgg> {
  const m = new Map<string, CatAgg>();
  for (const [code, label] of Object.entries(domains)) {
    m.set(code, { id: DOMAIN_TO_CATEGORY[code] ?? code, label, done: 0, correct: 0, wDone: 0, wCorrect: 0 });
  }
  return m;
}

// GET /api/stats — aggregate a user's practice into dashboard/stats data.
// Defaults to the signed-in user; a tutor may pass ?studentId= to read a student.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const scope = await resolveTargetUser(supabase, user.id, req.nextUrl.searchParams.get("studentId"));
  if ("error" in scope) return NextResponse.json({ success: false, error: scope.error }, { status: scope.status });
  const targetId = scope.targetId;

  // Optional practice-type scope — restricts every aggregate below to answers
  // from one kind of session. Absent = all modes (the default behavior).
  //  tests    → full SATs     (mode 'mock-full', config.exam === true)
  //  sections → full sections (mode 'mock-full', no exam flag)
  //  modules  → single modules (mode 'mock-m1')
  const scopeKind = req.nextUrl.searchParams.get("scope");
  const matchesScope = (mode: string | null, config: Record<string, unknown> | null): boolean => {
    if (scopeKind !== "tests" && scopeKind !== "sections" && scopeKind !== "modules") return true;
    const isExam = !!(config && (config as { exam?: unknown }).exam);
    if (scopeKind === "modules") return mode === "mock-m1";
    if (scopeKind === "sections") return mode === "mock-full" && !isExam;
    return mode === "mock-full" && isExam; // tests
  };

  // 1. per-question results joined to their section/domain (and, for scoping,
  // their parent session's mode/config — answers.session_id FKs straight to it).
  // Skipped questions (no answer recorded) are excluded so they don't drag
  // down accuracy — only attempts where the student actually answered count.
  const { data: answers, error: aErr } = await supabase
    .from("answers")
    .select("is_correct, value, created_at, session_questions!inner(section, domain), practice_sessions!inner(mode, config)")
    .eq("user_id", targetId)
    .not("value", "is", null)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (aErr) return NextResponse.json({ success: false, error: aErr.message }, { status: 500 });

  const rwCats = emptyCats(RW_DOMAINS);
  const mathCats = emptyCats(MATH_DOMAINS);
  // Per-section raw counts (questions answered, correct/incorrect bars). The
  // section's headline recency accuracy is NOT tallied here — it's a per-domain
  // blend (see below) so one recently-drilled topic can't speak for the section.
  const sectionTotals: Record<Section, { done: number; correct: number }> = {
    rw: { done: 0, correct: 0 },
    math: { done: 0, correct: 0 },
  };

  // `answers` is ordered newest-first, so `rank` counts how many more-recent
  // attempts precede each one — the basis for its recency weight.
  let rank = 0;
  for (const row of answers ?? []) {
    if (!String((row as { value: unknown }).value ?? "").trim()) continue; // skipped
    const sq = (row as { session_questions: { section: Section; domain: string } | { section: Section; domain: string }[] }).session_questions;
    const meta = Array.isArray(sq) ? sq[0] : sq;
    if (!meta) continue;
    const psRaw = (row as { practice_sessions: { mode: string; config: Record<string, unknown> | null } | { mode: string; config: Record<string, unknown> | null }[] | null }).practice_sessions;
    const ps = Array.isArray(psRaw) ? psRaw[0] : psRaw;
    if (!matchesScope(ps?.mode ?? null, ps?.config ?? null)) continue;
    const w = Math.pow(RECENCY_DECAY, rank);
    rank += 1;
    const cats = meta.section === "math" ? mathCats : rwCats;
    const c = cats.get(meta.domain);
    sectionTotals[meta.section].done += 1;
    if (row.is_correct) {
      sectionTotals[meta.section].correct += 1;
    }
    if (c) {
      c.done += 1;
      c.wDone += w;
      if (row.is_correct) {
        c.correct += 1;
        c.wCorrect += w;
      }
    }
  }

  // Section/overall accuracy: keep done/correct for raw counts (questions
  // answered, correct/incorrect bars) and take recentAccuracy as a separate
  // headline figure — a per-domain blend, null when nothing's been answered.
  const sectionAccuracy = (t: { done: number; correct: number }, recentAccuracy: number | null) => ({
    done: t.done,
    correct: t.correct,
    accuracy: t.done ? Math.round((t.correct / t.done) * 100) : 0,
    recentAccuracy,
  });

  // Headline recency accuracy for a section: blend its domains' (already
  // recency-weighted, shrunk) accuracies, weighted by attempts per domain — so a
  // burst in one topic moves only that topic's share, not the whole section.
  const blendRecent = (cats: ReadonlyArray<{ recentAccuracy: number | null; done: number }>) => {
    let num = 0;
    let den = 0;
    for (const c of cats) {
      if (c.recentAccuracy == null) continue;
      num += c.recentAccuracy * c.done;
      den += c.done;
    }
    return den > 0 ? Math.round(num / den) : null;
  };

  const toCatList = (m: Map<string, CatAgg>) =>
    [...m.entries()].map(([code, c]) => {
      // All-time rate is the shrinkage prior: with thin recent practice the
      // recency figure is pulled toward it, so a small drill can't dominate.
      const rawRate = c.done ? c.correct / c.done : 0;
      return {
        id: c.id,
        code, // CB domain code (e.g. "INI", "H") — used for category drill-down
        label: c.label,
        done: c.done,
        correct: c.correct,
        accuracy: c.done ? Math.round((c.correct / c.done) * 100) : 0,
        // Recency-weighted accuracy, shrunk toward the all-time rate by a
        // pseudo-count. Recent attempts count for more, but a thin recent sample
        // stays near the established level. Null when nothing's been answered.
        recentAccuracy:
          c.wDone > 0
            ? Math.round(((c.wCorrect + RECENT_SHRINK_K * rawRate) / (c.wDone + RECENT_SHRINK_K)) * 100)
            : null,
      };
    });

  const rwList = toCatList(rwCats);
  const mathList = toCatList(mathCats);

  // "Skills to focus on" — the weakest categories by recency-weighted accuracy,
  // across both sections, limited to ones the student has actually practiced.
  const focus = [
    ...rwList.map((c) => ({ ...c, section: "rw" as Section })),
    ...mathList.map((c) => ({ ...c, section: "math" as Section })),
  ]
    .filter(
      (c) =>
        c.done >= FOCUS_MIN_ATTEMPTS &&
        c.recentAccuracy != null &&
        c.recentAccuracy < FOCUS_MAX_ACCURACY,
    )
    .sort((a, b) => (a.recentAccuracy ?? 100) - (b.recentAccuracy ?? 100) || b.done - a.done)
    .slice(0, FOCUS_COUNT)
    .map((c) => ({
      section: c.section,
      id: c.id,
      code: c.code,
      label: c.label,
      accuracy: c.recentAccuracy,
      attempts: c.done,
    }));

  // 2. sessions for scores-over-time + latest section scores + last-session accuracy
  const { data: sessions, error: sErr } = await supabase
    .from("practice_sessions")
    .select("section, mode, config, scaled_score, accuracy, created_at")
    .eq("user_id", targetId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (sErr) return NextResponse.json({ success: false, error: sErr.message }, { status: 500 });

  // A "score" only comes from a full-length section. Full sections and full SATs
  // both persist as mode "mock-full"; Module-1-only practice ("mock-m1") is half a
  // section, so it's excluded from both the estimate and the trend.
  const scored = (sessions ?? []).filter((s) => s.scaled_score != null && s.mode === "mock-full");
  // Recency superscore: each section's estimate is its most recent full-section
  // score (sessions are ordered oldest→newest), and the total sums the two
  // independently — so a fresh Math section updates Math without touching R&W.
  const latestScore = (section: Section) => {
    const list = scored.filter((s) => s.section === section);
    return list.length ? list[list.length - 1].scaled_score : null;
  };
  // The most recent session in a section, described by *what it was* — full SAT,
  // full section, single module, or a topic drill — so the dashboard can label
  // its accuracy honestly instead of stamping it with an unrelated top category.
  const lastSession = (section: Section) => {
    const list = (sessions ?? []).filter((s) => s.section === section);
    if (!list.length) return null;
    const s = list[list.length - 1];
    const cfg = (s.config ?? {}) as { exam?: unknown; category?: unknown };
    return {
      accuracy: s.accuracy,
      mode: s.mode,
      exam: !!cfg.exam,
      category: typeof cfg.category === "string" ? cfg.category : null,
    };
  };
  // Movement in the section estimate: latest full-section score minus the one
  // before it. Null until there are two scored sections to compare.
  const scoreTrend = (section: Section) => {
    const list = scored.filter((s) => s.section === section);
    if (list.length < 2) return null;
    const latest = list[list.length - 1].scaled_score;
    const prev = list[list.length - 2].scaled_score;
    return latest != null && prev != null ? latest - prev : null;
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
      sectionTotals: {
        rw: sectionAccuracy(sectionTotals.rw, blendRecent(rwList)),
        math: sectionAccuracy(sectionTotals.math, blendRecent(mathList)),
        // Overall recency accuracy across both sections — blend every domain's
        // accuracy by attempts, so no single topic or section dominates.
        overall: sectionAccuracy(
          {
            done: sectionTotals.rw.done + sectionTotals.math.done,
            correct: sectionTotals.rw.correct + sectionTotals.math.correct,
          },
          blendRecent([...rwList, ...mathList]),
        ),
      },
      lastSession: { rw: lastSession("rw"), math: lastSession("math") },
      trend: { rw: scoreTrend("rw"), math: scoreTrend("math") },
      categories: { rw: rwList, math: mathList },
      focus,
      overTime: scored.map((s) => ({ section: s.section, score: s.scaled_score, at: s.created_at })),
      sessionCount: (sessions ?? []).length,
    },
  });
}
