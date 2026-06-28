import type { SupabaseClient } from "@supabase/supabase-js";
import { nextBox, dueAt, MAX_BOX } from "./schedule";

// Update a student's spaced-repetition queue from a just-submitted session.
// Runs for every session (not just review sessions): a miss in any practice
// enrolls/ resets the question to box 1, and a correct answer on an already-
// enrolled question advances it (or graduates it). Questions answered correctly
// that were never enrolled are left alone — we only ever schedule actual misses.

type GradedQuestion = {
  external_id?: string | null;
  section: "rw" | "math";
  domain?: string;
  skill?: string;
  difficulty?: string;
  snapshot: Record<string, unknown>;
  is_correct: boolean;
};

export async function enrollReviews(
  supabase: SupabaseClient,
  userId: string,
  questions: GradedQuestion[],
  testDate: string | null,
): Promise<void> {
  // Only operational items with a stable CB id can be scheduled (unscored
  // pretest items never count toward review).
  const graded = questions.filter(
    (q) => q.external_id && !(q.snapshot as { pretest?: unknown })?.pretest,
  );
  if (!graded.length) return;

  // Last attempt wins per question within this submit.
  const latest = new Map<string, GradedQuestion>();
  for (const q of graded) latest.set(q.external_id as string, q);
  const ids = [...latest.keys()];

  const { data: existingRows } = await supabase
    .from("review_items")
    .select("external_id, box, times_seen")
    .eq("user_id", userId)
    .in("external_id", ids);
  const existing = new Map(
    (existingRows ?? []).map((r) => [
      r.external_id as string,
      { box: r.box as number, timesSeen: (r.times_seen as number) ?? 0 },
    ]),
  );

  const now = new Date();
  const test = testDate ? new Date(testDate) : null;
  const nowIso = now.toISOString();
  const toUpsert: Record<string, unknown>[] = [];
  const toDelete: string[] = [];

  const row = (q: GradedQuestion, box: number, correct: boolean, timesSeen: number) => ({
    user_id: userId,
    external_id: q.external_id,
    section: q.section,
    domain: q.domain ?? null,
    skill: q.skill ?? null,
    difficulty: q.difficulty ?? null,
    snapshot: q.snapshot,
    box,
    due_at: dueAt(box, now, test).toISOString(),
    last_result: correct,
    times_seen: timesSeen + 1,
    updated_at: nowIso,
  });

  for (const [id, q] of latest) {
    const prev = existing.get(id);
    if (q.is_correct) {
      if (!prev) continue; // never enrolled → a clean first-pass, nothing to do
      const box = nextBox(prev.box, true);
      if (box > MAX_BOX) {
        toDelete.push(id); // graduated — mastered, stop resurfacing
        continue;
      }
      toUpsert.push(row(q, box, true, prev.timesSeen));
    } else {
      // Wrong → (re)enter box 1, due tomorrow.
      toUpsert.push(row(q, 1, false, prev?.timesSeen ?? 0));
    }
  }

  if (toUpsert.length) {
    await supabase.from("review_items").upsert(toUpsert, { onConflict: "user_id,external_id" });
  }
  if (toDelete.length) {
    await supabase.from("review_items").delete().eq("user_id", userId).in("external_id", toDelete);
  }
}
