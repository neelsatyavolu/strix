import { NextResponse } from "next/server";
import { OFFICIAL_TESTS } from "@/lib/cb/officialForms";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Which Bluebook forms exist, and which the signed-in user has already played.
// Drives the exam picker's default (highest not-yet-taken). Best-effort: an
// anonymous user (or any failure) just gets an empty `completed` list.
export async function GET() {
  let completed: number[] = [];
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("practice_sessions")
        .select("config")
        .eq("user_id", user.id)
        .not("config->bluebookTest", "is", null);
      const seen = new Set<number>();
      for (const row of data ?? []) {
        const n = Number((row.config as { bluebookTest?: unknown })?.bluebookTest);
        if (Number.isInteger(n)) seen.add(n);
      }
      completed = [...seen].sort((a, b) => b - a);
    }
  } catch {
    completed = [];
  }
  return NextResponse.json({
    success: true,
    data: { available: OFFICIAL_TESTS, completed },
    error: null,
  });
}
