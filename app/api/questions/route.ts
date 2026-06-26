import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { drawQuestions } from "@/lib/cb/client";
import { drawModule } from "@/lib/cb/blueprint";
import { CATEGORY_TO_DOMAIN } from "@/lib/cb/domains";
import { createClient } from "@/lib/supabase/server";
import type { Difficulty, Section } from "@/lib/cb/types";

// Cap on how many historical ids we load — large enough to cover a full bank,
// bounded so a power user's history can't blow up the query.
const SEEN_LIMIT = 5000;

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

const QuerySchema = z.object({
  section: z.enum(["rw", "math"]),
  // "drill" = filtered flat set; "module" = a blueprinted full SAT module.
  mode: z.enum(["drill", "module"]).optional().default("drill"),
  // module-adaptive difficulty: Module 1 = "mixed"; Module 2A/2B = easy/hard.
  profile: z.enum(["mixed", "easy", "hard"]).optional().default("mixed"),
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
  const { section, mode, profile, exclude, category, domain, difficulty, limit } = parsed.data;

  const domainCode = domain || (category ? CATEGORY_TO_DOMAIN[category] : undefined);
  const diff = DIFF_MAP[difficulty] ?? null;

  try {
    const seen = await loadSeen(section);
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
