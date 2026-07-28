import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSession } from "@/lib/vocab/session";
import type { VocabCategory, VocabProgressRow } from "@/lib/vocab/types";
import { CATEGORY_LABELS } from "@/lib/vocab/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(Object.keys(CATEGORY_LABELS));

// GET /api/vocab/session?count=12&category=argument
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const count = Math.min(20, Math.max(4, Number(sp.get("count")) || 12));
  const catRaw = sp.get("category");
  const category = catRaw && VALID.has(catRaw) ? (catRaw as VocabCategory) : null;

  const { data, error } = await supabase
    .from("vocab_progress")
    .select("word_id, box, due_at, times_seen, times_correct, last_result, last_mode")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const items = buildSession({
    progress: (data ?? []) as VocabProgressRow[],
    count,
    category,
  });

  return NextResponse.json({
    success: true,
    data: { items, count: items.length, category },
  });
}
