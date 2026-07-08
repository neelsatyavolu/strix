import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findQuestionById } from "@/lib/cb/lookup";
import { isValueCorrect } from "@/lib/practice/grading.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/questions/grade — server-side grading. Question payloads served by
// /api/questions carry no answer key, so the client submits committed answers
// here to learn correctness. The key itself (correct letters/ids + rationale)
// is disclosed only once an answer is committed: on an explicit reveal (module
// submit / post-test review) or when this attempt just solved the question
// (drill retry-until-correct feedback).

const Attempt = z.object({
  id: z.string().min(1),
  section: z.enum(["rw", "math"]).optional(),
  value: z.string().nullable().optional(),
});

const Body = z.object({
  // A full adaptive section is 2 modules ≤ 54 questions; 120 leaves headroom.
  attempts: z.array(Attempt).min(1).max(120),
  reveal: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { attempts, reveal } = parsed.data;

  const results = await Promise.all(
    attempts.map(async (a) => {
      try {
        const q = await findQuestionById(a.id, a.section);
        // Unknown/unfetchable question: correct=null means "couldn't grade",
        // so the client can retry rather than mis-score it.
        if (!q) return { id: a.id, correct: null };
        const answered = a.value != null && String(a.value).trim() !== "";
        const correct = answered ? isValueCorrect(q, a.value) : null;
        if (reveal || correct === true) {
          return {
            id: a.id,
            correct,
            key: { correct: q.correct, correctIds: q.correctIds, rationaleHtml: q.rationaleHtml },
          };
        }
        return { id: a.id, correct };
      } catch {
        return { id: a.id, correct: null };
      }
    }),
  );

  return NextResponse.json({ success: true, data: { results }, error: null });
}
