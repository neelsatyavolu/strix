import "server-only";
import { randomUUID } from "node:crypto";
import { drawQuestions } from "@/lib/cb/client";
import { scaledSectionScore, routeModule2 } from "@/lib/scoring/curve";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Difficulty, Question, Section } from "@/lib/cb/types";

// Dev-only seeding engine. Fabricates *completed* practice activity for a target
// account so the read surfaces (Stats, Sessions, Session detail, Practice
// analysis) can be exercised with realistic history. It draws REAL College Board
// questions and mirrors how `persistSession` (SessionContext) writes data, then
// inserts directly via the service-role client with a backdated `created_at`.
//
// Never import this from client code — it bypasses RLS.

export type SeedKind = "test" | "section" | "module";

export interface SeedRequest {
  email: string;
  kind: SeedKind;
  /** Required for "section"/"module"; ignored for "test" (which does both). */
  section?: Section;
  /** Target accuracy, 0–100. */
  scorePct: number;
  /** Backdate this many days; random 0–60 when omitted. */
  daysAgo?: number;
}

export interface SeededSession {
  id: string;
  section: Section;
  mode: string;
  accuracy: number;
  scaledScore: number;
  questionCount: number;
  createdAt: string;
}

// Operational question counts per module, matching the live modules.
const MODULE_SIZES: Record<Section, { m1: number; m2: number }> = {
  rw: { m1: 27, m2: 27 },
  math: { m1: 22, m2: 22 },
};

type Mix = Partial<Record<Difficulty, number>>;
const BALANCED: Mix = { E: 1, M: 1, H: 1 };

interface BuiltQuestion {
  external_id: string;
  section: Section;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  ordinal: number;
  module: string;
  snapshot: Record<string, unknown>;
  value: string;
  is_correct: boolean;
  time_ms: number;
  flagged: boolean;
}

interface BuiltSection {
  questions: BuiltQuestion[];
  correct: number;
  total: number;
  accuracy: number;
  scaled: number;
}

/** A plausible stored answer value: a correct letter/literal, or a wrong one. */
function pickValue(q: Question, correct: boolean): string {
  if (q.type === "spr" || q.choices.length === 0) {
    return correct ? q.correct[0] ?? "1" : "0";
  }
  const letters = q.choices.map((c) => c.letter);
  if (correct) return q.correct[0] ?? letters[0] ?? "A";
  return letters.find((l) => !q.correct.includes(l)) ?? "A";
}

/** Build one persisted section (1 row): draw real questions, mark `pct` correct. */
async function buildSection(section: Section, kind: SeedKind, scorePct: number): Promise<BuiltSection> {
  const sizes = MODULE_SIZES[section];
  const p = Math.max(0, Math.min(100, scorePct)) / 100;

  const m1 = await drawQuestions({ section, limit: sizes.m1, mix: BALANCED });
  const a1 = m1.length;
  const m1Correct = Math.round(p * a1);

  const modules: Array<{ key: string; qs: Question[]; correct: number }> = [
    { key: "m1", qs: m1, correct: m1Correct },
  ];

  // A full section/test continues into an adaptive Module 2; a single module
  // (mock-m1) stops after M1. Routing falls out of the M1 result, exactly like
  // the real flow, so the easy-module score cap applies when appropriate.
  let routedEasy = false;
  if (kind !== "module") {
    const variant = routeModule2(m1Correct, a1);
    routedEasy = variant === "easy";
    const mix: Mix = variant === "hard" ? { E: 1, M: 2, H: 3 } : { E: 3, M: 2, H: 1 };
    const exclude = new Set(m1.map((q) => q.id));
    const m2 = await drawQuestions({ section, limit: sizes.m2, mix, exclude });
    modules.push({ key: "m2", qs: m2, correct: Math.round(p * m2.length) });
  }

  const questions: BuiltQuestion[] = [];
  let ordinal = 0;
  let correct = 0;
  for (const m of modules) {
    m.qs.forEach((q, i) => {
      const isCorrect = i < m.correct;
      if (isCorrect) correct++;
      questions.push({
        external_id: q.id,
        section: q.section,
        domain: q.domain,
        skill: q.skill,
        difficulty: q.difficulty,
        ordinal: ordinal++,
        module: m.key,
        snapshot: { ...q, pretest: false } as unknown as Record<string, unknown>,
        value: pickValue(q, isCorrect),
        is_correct: isCorrect,
        time_ms: 30_000 + Math.floor(Math.random() * 60_000),
        flagged: false,
      });
    });
  }

  const total = questions.length;
  if (total === 0) {
    throw new Error(`No questions drawn for ${section} (College Board API unavailable?)`);
  }
  const accuracy = Math.round((100 * correct) / total);
  const scaled = scaledSectionScore(correct, total, routedEasy, section);
  return { questions, correct, total, accuracy, scaled };
}

type Admin = ReturnType<typeof createAdminClient>;

interface WriteArgs {
  admin: Admin;
  userId: string;
  section: Section;
  mode: string;
  config: Record<string, unknown>;
  build: BuiltSection;
  whenISO: string;
}

/** Insert practice_sessions + session_questions + answers, all backdated. */
async function writeSession({ admin, userId, section, mode, config, build, whenISO }: WriteArgs): Promise<string> {
  const { data: session, error: sErr } = await admin
    .from("practice_sessions")
    .insert({
      user_id: userId,
      mode,
      section,
      config,
      status: "submitted",
      score_correct: build.correct,
      score_total: build.total,
      accuracy: build.accuracy,
      scaled_score: build.scaled,
      started_at: whenISO,
      submitted_at: whenISO,
      created_at: whenISO,
    })
    .select("id")
    .single();
  if (sErr || !session) throw new Error(sErr?.message || "session insert failed");

  const sqRows = build.questions.map((q) => ({
    session_id: session.id,
    user_id: userId,
    ordinal: q.ordinal,
    module: q.module,
    external_id: q.external_id,
    section: q.section,
    domain: q.domain,
    skill: q.skill,
    difficulty: q.difficulty,
    snapshot: q.snapshot,
    created_at: whenISO,
  }));
  const { data: sqs, error: sqErr } = await admin
    .from("session_questions")
    .insert(sqRows)
    .select("id, ordinal");
  if (sqErr || !sqs) throw new Error(sqErr?.message || "session_questions insert failed");

  const byOrdinal = new Map(sqs.map((r) => [r.ordinal, r.id]));
  const answerRows = build.questions.map((q) => ({
    session_question_id: byOrdinal.get(q.ordinal),
    session_id: session.id,
    user_id: userId,
    value: q.value,
    is_correct: q.is_correct,
    time_ms: q.time_ms,
    flagged: q.flagged,
    created_at: whenISO,
  }));
  const { error: aErr } = await admin.from("answers").insert(answerRows);
  if (aErr) throw new Error(aErr.message);

  return session.id;
}

/** Seed one activity (1 row for section/module, 2 rows for a full test). */
export async function seedActivity(req: SeedRequest): Promise<SeededSession[]> {
  const admin = createAdminClient();

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id")
    .eq("email", req.email)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!profile) throw new Error(`No account found for ${req.email}`);
  const userId = profile.id as string;

  const days = req.daysAgo ?? Math.floor(Math.random() * 61);
  const whenISO = new Date(Date.now() - days * 86_400_000).toISOString();

  const sections: Section[] = req.kind === "test" ? ["rw", "math"] : [req.section!];
  const mode = req.kind === "module" ? "mock-m1" : "mock-full";
  const examId = req.kind === "test" ? randomUUID() : null;
  const config: Record<string, unknown> = req.kind === "test" ? { exam: true, examId } : { timing: "total" };

  const out: SeededSession[] = [];
  for (const section of sections) {
    const build = await buildSection(section, req.kind, req.scorePct);
    const id = await writeSession({ admin, userId, section, mode, config, build, whenISO });
    out.push({
      id,
      section,
      mode,
      accuracy: build.accuracy,
      scaledScore: build.scaled,
      questionCount: build.total,
      createdAt: whenISO,
    });
  }
  return out;
}
