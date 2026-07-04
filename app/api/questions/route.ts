import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { drawQuestions, getQuestion, getQuestionByExternalId, listStubs, stubId } from "@/lib/cb/client";
import { drawModule } from "@/lib/cb/blueprint";
import { getOfficialModule, getOfficialQuestionByExternalId } from "@/lib/cb/officialForms";
import { getStrixModule } from "@/lib/cb/strixForms";
import { CATEGORY_TO_DOMAIN } from "@/lib/cb/domains";
import { createClient } from "@/lib/supabase/server";
import { difficultyMix, recentAccuracy } from "@/lib/cb/adaptive";
import type { Difficulty, Section } from "@/lib/cb/types";

// Cap on how many historical ids we load — large enough to cover a full bank,
// bounded so a power user's history can't blow up the query.
const SEEN_LIMIT = 5000;

// How many recent answers to weigh when picking an adaptive difficulty mix.
// Recent attempts dominate via decay, so a few hundred is plenty.
const RECENT_LIMIT = 300;

/**
 * Recency-weighted accuracy + attempt count for the signed-in user in a section
 * (optionally a single domain), used to choose an adaptive difficulty mix for a
 * drill. Best-effort: anonymous users / any failure yield no signal, which falls
 * back to a balanced mix rather than breaking question loading.
 */
async function loadPerformance(
  section: Section,
  domainCode?: string,
): Promise<{ accuracy: number | null; attempts: number }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { accuracy: null, attempts: 0 };
    let query = supabase
      .from("answers")
      .select("is_correct, value, session_questions!inner(section, domain)")
      .eq("user_id", user.id)
      .eq("session_questions.section", section)
      .not("value", "is", null)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT);
    if (domainCode) query = query.eq("session_questions.domain", domainCode);
    const { data } = await query;
    // Drop skipped answers (no value) so they don't dilute the signal.
    const rows = (data ?? []).filter((r) => String((r as { value: unknown }).value ?? "").trim());
    return { accuracy: recentAccuracy(rows), attempts: rows.length };
  } catch {
    return { accuracy: null, attempts: 0 };
  }
}

/**
 * Ids the signed-in user has already been served in this section, so we can
 * avoid repeating a question until the whole bank has been worked through.
 * Best-effort: anonymous users (or any failure) get an empty set, which simply
 * disables cross-session dedup rather than breaking question loading.
 */
async function loadSeen(section: Section): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();
    // RLS scopes session_questions to the current user.
    const { data } = await supabase
      .from("session_questions")
      .select("external_id")
      .eq("section", section)
      .not("external_id", "is", null)
      .limit(SEEN_LIMIT);
    return new Set((data ?? []).map((r) => r.external_id as string).filter(Boolean));
  } catch {
    return new Set();
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIFF_MAP: Record<string, Difficulty | null> = {
  all: null,
  easy: "E",
  med: "M",
  medium: "M",
  hard: "H",
  E: "E",
  M: "M",
  H: "H",
};

async function findQuestionById(id: string, section?: Section) {
  const needle = id.trim();
  if (!needle) return null;

  const officialQuestion = await getOfficialQuestionByExternalId(needle, section);
  if (officialQuestion) return officialQuestion;

  const sections: Section[] = section ? [section] : ["rw", "math"];
  for (const candidate of sections) {
    const stubs = await listStubs(candidate);
    const stub = stubs.find((s) =>
      s.questionId === needle ||
      s.externalId === needle ||
      s.ibn === needle ||
      stubId(s) === needle,
    );
    if (stub) return getQuestion(stub);
  }

  return section ? getQuestionByExternalId(needle, section) : null;
}

const QuerySchema = z.object({
  id: z.string().optional(),
  section: z.enum(["rw", "math"]).optional(),
  // "drill" = filtered flat set; "module" = a blueprinted full SAT module;
  // "official" = a real Bluebook form module (exact questions, fixed order).
  // "strix" = a fixed Strix-owned full-SAT module built from alternative qbank ids.
  mode: z.enum(["drill", "module", "official", "strix"]).optional().default("drill"),
  // module-adaptive difficulty: Module 1 = "mixed"; Module 2A/2B = easy/hard.
  profile: z.enum(["mixed", "easy", "hard"]).optional().default("mixed"),
  // official-form selectors: which Bluebook test and which module slot.
  test: z.coerce.number().int().optional(),
  strixTest: z.coerce.number().int().optional(),
  moduleKey: z.enum(["m1", "easy", "hard"]).optional(),
  // comma-separated question ids to exclude (e.g. Module 1 items when drawing 2).
  exclude: z.string().optional(),
  // design category id (info/craft/.../alg/...) OR raw CB domain code
  category: z.string().optional(),
  domain: z.string().optional(),
  difficulty: z.string().optional().default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid query" },
      { status: 400 },
    );
  }
  const { id, section, mode, profile, test, strixTest, moduleKey, exclude, category, domain, difficulty, limit } = parsed.data;

  const lookupId = id?.trim();
  if (lookupId) {
    try {
      const question = await findQuestionById(lookupId, section);
      if (!question) {
        return NextResponse.json(
          { success: false, data: null, error: "Question not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: { question },
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load question";
      return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
    }
  }

  if (!section) {
    return NextResponse.json(
      { success: false, data: null, error: "section is required" },
      { status: 400 },
    );
  }

  const domainCode = domain || (category ? CATEGORY_TO_DOMAIN[category] : undefined);
  const diff = DIFF_MAP[difficulty] ?? null;

  // Official Bluebook form: serve the exact real-form module, in order. No
  // dedup/exclude — the form's modules are already distinct by construction.
  if (mode === "official") {
    if (test == null || !moduleKey) {
      return NextResponse.json(
        { success: false, data: null, error: "official mode requires test and moduleKey" },
        { status: 400 },
      );
    }
    try {
      const questions = await getOfficialModule(test, section, moduleKey);
      return NextResponse.json({
        success: true,
        data: { questions, count: questions.length },
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load official form";
      return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
    }
  }

  if (mode === "strix") {
    if (strixTest == null || !moduleKey) {
      return NextResponse.json(
        { success: false, data: null, error: "strix mode requires strixTest and moduleKey" },
        { status: 400 },
      );
    }
    try {
      const questions = await getStrixModule(strixTest, section, moduleKey);
      return NextResponse.json({
        success: true,
        data: { questions, count: questions.length },
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Strix test";
      return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
    }
  }

  try {
    const seen = await loadSeen(section);
    // When the student hasn't pinned a difficulty, serve an adaptive mix based on
    // their recent accuracy in this domain (balanced mix if there's no history).
    const mix =
      mode === "drill" && diff === null
        ? await loadPerformance(section, domainCode).then(({ accuracy, attempts }) =>
            difficultyMix(accuracy, attempts),
          )
        : undefined;
    const questions =
      mode === "module"
        ? await drawModule({
            section,
            profile,
            exclude: exclude
              ? new Set(exclude.split(",").filter(Boolean))
              : undefined,
            seen,
          })
        : await drawQuestions({
            section,
            domains: domainCode ? [domainCode] : undefined,
            difficulty: diff,
            mix,
            limit,
            seen,
          });
    return NextResponse.json({
      success: true,
      data: { questions, count: questions.length },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load questions";
    return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
  }
}
