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

  // Browse list: all words with light progress overlay.
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

// POST /api/vocab — record an attempt { wordId, mode, correct } or produce { wordId, mode:'produce', sentence }.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  let body: {
    wordId?: string;
    mode?: string;
    correct?: boolean;
    sentence?: string;
    choiceIndex?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const wordId = String(body.wordId || "");
  const entry = VOCAB_BY_ID[wordId];
  if (!entry) return NextResponse.json({ success: false, error: "Unknown word" }, { status: 400 });

  const mode = body.mode === "produce" ? "produce" : "context";
  let correct = false;
  let reason: string | undefined;
  let correctIndex: number | undefined;
  let tip: string | undefined;

  if (mode === "context") {
    correctIndex = entry.correctIndex;
    tip = entry.tip;
    if (typeof body.correct === "boolean") {
      correct = body.correct;
    } else if (typeof body.choiceIndex === "number") {
      correct = body.choiceIndex === entry.correctIndex;
    } else {
      return NextResponse.json({ success: false, error: "Missing choice" }, { status: 400 });
    }
  } else {
    const { scoreProduce } = await import("@/lib/vocab/session");
    const scored = scoreProduce(entry.word, String(body.sentence || ""));
    correct = scored.correct;
    reason = scored.reason;
    tip = entry.tip;
  }

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
    box: Math.min(box, MAX_BOX + 1), // store 6 when graduated
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
      reason,
      correctIndex,
      tip,
      definition: entry.definition,
      word: entry.word,
      box: row.box,
      mastered: row.box > MAX_BOX,
      dueAt: row.due_at,
    },
  });
}
