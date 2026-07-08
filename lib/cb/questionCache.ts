import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Question } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";

// Durable cache of normalized CB questions (see migration 0010). Every helper
// here is best-effort: a missing table, missing service key or DB hiccup must
// degrade to "cache miss", never break question serving.

// CB questions are effectively static; re-fetch from the live API only after
// this horizon (and even then, a stale row still serves if CB is down).
const FRESH_MS = 30 * 24 * 60 * 60 * 1000;

export interface CachedQuestion {
  question: Question;
  fresh: boolean;
}

let admin: SupabaseClient | null | undefined;
function adminClient(): SupabaseClient | null {
  if (admin === undefined) {
    try {
      admin = createAdminClient();
    } catch {
      admin = null; // no service key (e.g. local dev) — cache disabled
    }
  }
  return admin;
}

function toCached(row: { payload: unknown; updated_at: string } | null): CachedQuestion | null {
  const payload = row?.payload as Question | undefined;
  if (!payload?.id || !payload.stemHtml) return null;
  const age = Date.now() - new Date(row!.updated_at).getTime();
  return { question: payload, fresh: Number.isFinite(age) && age < FRESH_MS };
}

export async function readCachedQuestion(id: string): Promise<CachedQuestion | null> {
  const client = adminClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("question_cache")
      .select("payload, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toCached(data);
  } catch {
    return null;
  }
}

export async function readCachedQuestions(ids: string[]): Promise<Map<string, CachedQuestion>> {
  const out = new Map<string, CachedQuestion>();
  const client = adminClient();
  if (!client || !ids.length) return out;
  try {
    const { data, error } = await client
      .from("question_cache")
      .select("id, payload, updated_at")
      .in("id", ids);
    if (error) return out;
    for (const row of data ?? []) {
      const cached = toCached(row);
      if (cached) out.set(row.id as string, cached);
    }
    return out;
  } catch {
    return out;
  }
}

export async function writeCachedQuestion(q: Question): Promise<void> {
  const client = adminClient();
  if (!client) return;
  try {
    await client.from("question_cache").upsert({
      id: q.id,
      section: q.section,
      payload: q,
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* cache write is best-effort */
  }
}
