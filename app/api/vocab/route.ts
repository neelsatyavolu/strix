import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VOCAB_BANK, VOCAB_BY_ID, listCategories } from "@/lib/vocab/bank";
import { summarize } from "@/lib/vocab/session";
import type { VocabProgressRow } from "@/lib/vocab/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/vocab — hub snapshot + optional progress rows.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("vocab_progress")
    .select("word_id, box, due_at, times_seen, times_correct, last_result, last_mode")
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const rows = (data ?? []) as VocabProgressRow[];
  const summary = summarize(rows);

  const words = VOCAB_BANK.map((w) => {
    const p = rows.find((r) => r.word_id === w.id);
    return {
      id: w.id,
      word: w.word,
      definition: w.definition,
      category: w.category,
      box: p?.box ?? 0,
      dueAt: p?.due_at ?? null,
      timesSeen: p?.times_seen ?? 0,
      mastered: p ? p.box > 5 : false,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      summary,
      categories: listCategories(),
      words,
      bankSize: VOCAB_BANK.length,
    },
  });
}

// POST /api/vocab — record flashcard usage attempt { wordId, mode:'flash', choiceIndex, correctIndex? }.
// Correctness is always verified server-side against the entry (re-shuffled options may differ).
// Client sends choiceIndex into the *session* passage list + the session correctIndex for that list,
// OR sends the chosen passage text for robust matching.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  let body: {
    wordId?: string;
    mode?: string;
    correct?: boolean;
    choiceIndex?: number;
    /** Exact passage text the student selected (preferred). */
    passage?: string;
    flipped?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const wordId = String(body.wordId || "");
  const entry = VOCAB_BY_ID[wordId];
  if (!entry) return NextResponse.json({ success: false, error: "Unknown word" }, { status: 400 });

  let correct = false;
  if (typeof body.passage === "string" && body.passage.trim()) {
    correct = body.passage.trim() === entry.correctPassage.trim();
  } else if (typeof body.correct === "boolean") {
    // Trust only after client already knew session correctIndex; still prefer passage when available.
    correct = body.correct;
  } else {
    return NextResponse.json({ success: false, error: "Missing answer" }, { status: 400 });
  }

  const mode = "flash";
  const tip = entry.tip;

  const { data: existing } = await supabase
    .from("vocab_progress")
    .select("word_id, box, due_at, times_seen, times_correct")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const { nextBox, dueAt, MAX_BOX } = await import("@/lib/vocab/schedule");
  const prevBox = existing?.box ?? 0;
  const box = nextBox(prevBox, correct);
  const now = new Date();
  const due = dueAt(box, now);
  const times_seen = (existing?.times_seen ?? 0) + 1;
  const times_correct = (existing?.times_correct ?? 0) + (correct ? 1 : 0);

  const row = {
    user_id: user.id,
    word_id: wordId,
    box: Math.min(box, MAX_BOX + 1),
    due_at: due.toISOString(),
    times_seen,
    times_correct,
    last_result: correct,
    last_mode: mode,
    updated_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("vocab_progress")
    .upsert(row, { onConflict: "user_id,word_id" });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    data: {
      correct,
      tip,
      definition: entry.definition,
      word: entry.word,
      correctPassage: entry.correctPassage,
      box: row.box,
      mastered: row.box > MAX_BOX,
      dueAt: row.due_at,
      flipped: !!body.flipped,
    },
  });
}
