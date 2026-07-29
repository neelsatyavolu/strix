import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { VOCAB_BANK, VOCAB_BY_ID, listCategories } from "@/lib/vocab/bank";
import { summarize } from "@/lib/vocab/session";
import { dueAt, isMastered, MAX_BOX, nextBox } from "@/lib/vocab/schedule";
import type { VocabProgressRow } from "@/lib/vocab/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/vocab — hub snapshot + progress (known = mastered / checklist).
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
    const box = p?.box ?? 0;
    const known = p ? isMastered(box) : false;
    return {
      id: w.id,
      word: w.word,
      definition: w.definition,
      category: w.category,
      box,
      dueAt: p?.due_at ?? null,
      timesSeen: p?.times_seen ?? 0,
      timesCorrect: p?.times_correct ?? 0,
      mastered: known,
      known,
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

// POST /api/vocab
// - Practice: { wordId, mode:'flash', passage }
// - Checklist: { wordId, mode:'mark', known: boolean }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });

  let body: {
    wordId?: string;
    mode?: string;
    correct?: boolean;
    known?: boolean;
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

  const mode = body.mode === "mark" ? "mark" : "flash";

  const { data: existing } = await supabase
    .from("vocab_progress")
    .select("word_id, box, due_at, times_seen, times_correct")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const now = new Date();

  // ── Checklist mark / unmark "I know this" ─────────────────────────
  if (mode === "mark") {
    if (typeof body.known !== "boolean") {
      return NextResponse.json({ success: false, error: "Missing known" }, { status: 400 });
    }
    const known = body.known;
    const box = known ? MAX_BOX + 1 : 1;
    const due = dueAt(box, now);
    const row = {
      user_id: user.id,
      word_id: wordId,
      box,
      due_at: due.toISOString(),
      times_seen: existing?.times_seen ?? (known ? 1 : 0),
      times_correct: existing?.times_correct ?? 0,
      last_result: known ? true : null,
      last_mode: "manual",
      updated_at: now.toISOString(),
    };
    const { error } = await supabase
      .from("vocab_progress")
      .upsert(row, { onConflict: "user_id,word_id" });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({
      success: true,
      data: {
        wordId,
        word: entry.word,
        known,
        mastered: known,
        box: row.box,
        dueAt: row.due_at,
      },
    });
  }

  // ── Flash practice attempt ────────────────────────────────────────
  let correct = false;
  if (typeof body.passage === "string" && body.passage.trim()) {
    correct = body.passage.trim() === entry.correctPassage.trim();
  } else if (typeof body.correct === "boolean") {
    correct = body.correct;
  } else {
    return NextResponse.json({ success: false, error: "Missing answer" }, { status: 400 });
  }

  const prevBox = existing?.box ?? 0;
  const box = nextBox(prevBox, correct);
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
    last_mode: "flash",
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
      tip: entry.tip,
      definition: entry.definition,
      word: entry.word,
      correctPassage: entry.correctPassage,
      box: row.box,
      mastered: isMastered(row.box),
      known: isMastered(row.box),
      dueAt: row.due_at,
      flipped: !!body.flipped,
    },
  });
}
