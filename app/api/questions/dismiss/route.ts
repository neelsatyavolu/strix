import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { drawQuestions } from "@/lib/cb/client";
import { loadDismissed, recordDismissed } from "@/lib/cb/dismissed";
import { sanitizeQuestion } from "@/lib/cb/sanitize";
import type { Difficulty, Question, QuestionType, Section } from "@/lib/cb/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/questions/dismiss — permanently ban a question for this user and
// return a fitting replacement (same domain/difficulty when possible) that is
// not already in the active session.

const Body = z.object({
  id: z.string().min(1),
  section: z.enum(["rw", "math"]),
  domain: z.string().optional(),
  difficulty: z.enum(["E", "M", "H"]).optional(),
  type: z.enum(["mcq", "spr"]).optional(),
  // Other ids already in this session (including the dismissed one).
  exclude: z.array(z.string()).max(120).optional().default([]),
  pretest: z.boolean().optional().default(false),
});

type DrawTry = {
  domains?: string[];
  difficulty?: Difficulty | null;
};

/**
 * Prefer same domain + difficulty, then same domain, then whole section.
 * Filters by type client-side after draw when the bank allows.
 */
async function findReplacement(opts: {
  section: Section;
  domain?: string;
  difficulty?: Difficulty;
  type?: QuestionType;
  exclude: Set<string>;
  seen: Set<string>;
}): Promise<Question | null> {
  const { section, domain, difficulty, type, exclude, seen } = opts;

  const tries: DrawTry[] = [];
  if (domain && difficulty) tries.push({ domains: [domain], difficulty });
  if (domain) tries.push({ domains: [domain], difficulty: null });
  if (difficulty) tries.push({ domains: undefined, difficulty });
  tries.push({ domains: undefined, difficulty: null });

  // Dedup identical try shapes.
  const seenKey = new Set<string>();
  for (const t of tries) {
    const key = `${(t.domains || []).join(",")}|${t.difficulty ?? "any"}`;
    if (seenKey.has(key)) continue;
    seenKey.add(key);

    // Overdraw so we can filter by type / exclude race.
    const batch = await drawQuestions({
      section,
      domains: t.domains,
      difficulty: t.difficulty ?? null,
      limit: 8,
      exclude,
      seen,
    });
    const match = type
      ? batch.find((q) => q.type === type) || batch[0]
      : batch[0];
    if (match) return match;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, data: null, error: "Not signed in" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }
  const { id, section, domain, difficulty, type, exclude, pretest } = parsed.data;

  try {
    // Permanent ban first so a concurrent draw never re-serves this id.
    await recordDismissed(user.id, id, section);

    const dismissed = await loadDismissed(section);
    const hardExclude = new Set<string>([...dismissed, ...exclude, id]);
    // Soft-seen history still prefers fresh items for the replacement.
    // Re-use session_questions via a lightweight seen load: dismissed already hard.
    // Seen is optional here — empty is fine; hard exclude covers the ban.
    const replacement = await findReplacement({
      section,
      domain: domain || undefined,
      difficulty,
      type,
      exclude: hardExclude,
      seen: hardExclude, // treat banned + session as "seen" so leftovers prefer fresh bank items
    });

    if (!replacement) {
      return NextResponse.json(
        {
          success: false,
          data: { dismissed: true },
          error: "No similar question left to swap in.",
        },
        { status: 404 },
      );
    }

    const question = pretest ? { ...replacement, pretest: true } : replacement;
    return NextResponse.json({
      success: true,
      data: { question: sanitizeQuestion(question), dismissed: true },
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to dismiss question";
    return NextResponse.json({ success: false, data: null, error: message }, { status: 502 });
  }
}
