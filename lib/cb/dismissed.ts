import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/lib/cb/types";

// Cap so a huge ban-list can't blow up query params / memory.
const DISMISSED_LIMIT = 5000;

/**
 * Hard-exclude ids the student marked "I've done this already".
 * Best-effort: anonymous / failure → empty set (draw still works).
 */
export async function loadDismissed(section: Section): Promise<Set<string>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Set();
    const { data } = await supabase
      .from("dismissed_questions")
      .select("external_id")
      .eq("section", section)
      .limit(DISMISSED_LIMIT);
    return new Set((data ?? []).map((r) => r.external_id as string).filter(Boolean));
  } catch {
    return new Set();
  }
}

/** Persist a permanent ban for this user + external_id. Idempotent. */
export async function recordDismissed(
  userId: string,
  externalId: string,
  section: Section,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("dismissed_questions").upsert(
    { user_id: userId, external_id: externalId, section },
    { onConflict: "user_id,external_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}
