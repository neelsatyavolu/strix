#!/usr/bin/env node
/**
 * One-shot: re-grade every stored answer with current SPR rules, count former
 * pretest items toward the score, clear legacy snapshot.pretest, and rewrite
 * practice_sessions (+ completed assignment) score fields.
 *
 * Usage (from repo root, with .env.local present):
 *   node --env-file=.env.local scripts/rescore-all-sessions.mjs
 *   node --env-file=.env.local scripts/rescore-all-sessions.mjs --dry-run
 */
import { createClient } from '@supabase/supabase-js';
import { isValueCorrect, questionHasKey } from '../lib/practice/grading.mjs';
import { scoreCalibratedSection } from '../lib/scoring/albert.mjs';

const SECTION_RMSE = {
  rw: { easy: 21.13, hard: 17.66 },
  math: { easy: 21.82, hard: 19.57 },
};
const MODULE2_HARD_THRESHOLD = 2 / 3;

function round10(n) {
  return Math.round(n / 10) * 10;
}
function compositeScore(rw, math) {
  return Math.max(400, Math.min(1600, (rw || 0) + (math || 0)));
}
function routeModule2(module1Correct, module1Total) {
  const pct = module1Total > 0 ? module1Correct / module1Total : 0;
  return pct >= MODULE2_HARD_THRESHOLD ? 'hard' : 'easy';
}
function sectionScoreRange(correct, total, opts = {}) {
  const { section = 'rw', routedEasy = false, modules } = opts;
  const mod = modules?.length
    ? modules
    : [
        { correct: total > 0 ? correct / total : 0, total: 1 },
        { correct: total > 0 ? correct / total : 0, total: 1 },
      ];
  const estimate = round10(scoreCalibratedSection(section, mod));
  const rmse = SECTION_RMSE[section][routedEasy ? 'easy' : 'hard'];
  return {
    estimate,
    lower: round10(Math.max(200, estimate - rmse)),
    upper: round10(Math.min(800, estimate + rmse)),
  };
}

const dryRun = process.argv.includes('--dry-run');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function pageSize() {
  return 500;
}

async function fetchAll(table, select, extra = (q) => q) {
  const out = [];
  let from = 0;
  for (;;) {
    const to = from + pageSize() - 1;
    let q = sb.from(table).select(select).range(from, to);
    q = extra(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data?.length || data.length < pageSize()) break;
    from += pageSize();
  }
  return out;
}

function gradeAnswer(snapshot, value, storedCorrect) {
  if (value == null || String(value).trim() === '') return false;
  const q = snapshot ?? {};
  if (questionHasKey(q)) return isValueCorrect(q, value);
  return !!storedCorrect;
}

function bluebookTestOf(config) {
  const t = config?.bluebookTest;
  return typeof t === 'number' ? t : null;
}

async function main() {
  console.log(dryRun ? 'DRY RUN — no writes' : 'LIVE — writing updates');

  const sessions = await fetchAll(
    'practice_sessions',
    'id, mode, section, config, score_correct, score_total, accuracy, scaled_score',
  );
  console.log(`sessions: ${sessions.length}`);

  const sqs = await fetchAll(
    'session_questions',
    'id, session_id, module, external_id, snapshot',
  );
  console.log(`session_questions: ${sqs.length}`);

  const answers = await fetchAll(
    'answers',
    'session_question_id, session_id, value, is_correct',
  );
  console.log(`answers: ${answers.length}`);

  const ansBySq = new Map(answers.map((a) => [a.session_question_id, a]));
  const sqBySession = new Map();
  for (const sq of sqs) {
    const list = sqBySession.get(sq.session_id) ?? [];
    list.push(sq);
    sqBySession.set(sq.session_id, list);
  }

  let answerFlips = 0;
  let pretestCleared = 0;
  let sessionsUpdated = 0;
  const answerUpdates = [];
  const snapUpdates = [];
  const sessionUpdates = [];

  for (const sess of sessions) {
    const items = sqBySession.get(sess.id) ?? [];
    let correct = 0;
    let total = 0;
    const modules = [
      { correct: 0, total: 0 },
      { correct: 0, total: 0 },
    ];

    for (const sq of items) {
      const a = ansBySq.get(sq.id);
      if (!a || a.value == null || String(a.value).trim() === '') continue;

      const snap = { ...(sq.snapshot ?? {}) };
      if (snap.pretest) {
        pretestCleared += 1;
        delete snap.pretest;
        snapUpdates.push({ id: sq.id, snapshot: snap });
      }

      const isCorrect = gradeAnswer(snap, a.value, a.is_correct);
      if (isCorrect !== !!a.is_correct) {
        answerFlips += 1;
        answerUpdates.push({ session_question_id: sq.id, is_correct: isCorrect });
      }

      total += 1;
      if (isCorrect) correct += 1;
      const mi = sq.module === 'm1' ? 0 : 1;
      modules[mi].total += 1;
      if (isCorrect) modules[mi].correct += 1;
    }

    if (!total) continue;

    const accuracy = Math.round((correct / total) * 100);
    let scaled = sess.scaled_score;
    if (sess.mode === 'mock-full' && sess.scaled_score != null) {
      const range = sectionScoreRange(correct, total, {
        section: sess.section === 'math' ? 'math' : 'rw',
        routedEasy: routeModule2(modules[0].correct, modules[0].total) === 'easy',
        test: bluebookTestOf(sess.config),
        modules,
      });
      scaled = range.estimate;
    }

    if (
      sess.score_correct !== correct
      || sess.score_total !== total
      || sess.accuracy !== accuracy
      || sess.scaled_score !== scaled
    ) {
      sessionsUpdated += 1;
      sessionUpdates.push({
        id: sess.id,
        score_correct: correct,
        score_total: total,
        accuracy,
        scaled_score: scaled,
      });
    }
  }

  console.log({
    answerFlips,
    pretestCleared,
    sessionsUpdated,
    answerUpdates: answerUpdates.length,
    snapUpdates: snapUpdates.length,
  });

  if (dryRun) return;

  // Patch answers one-by-one (partial unique key); batch size small.
  for (const u of answerUpdates) {
    const { error } = await sb
      .from('answers')
      .update({ is_correct: u.is_correct })
      .eq('session_question_id', u.session_question_id);
    if (error) console.error('answer update failed', u.session_question_id, error.message);
  }

  for (const u of snapUpdates) {
    const { error } = await sb
      .from('session_questions')
      .update({ snapshot: u.snapshot })
      .eq('id', u.id);
    if (error) console.error('snapshot update failed', u.id, error.message);
  }

  for (const u of sessionUpdates) {
    const { error } = await sb
      .from('practice_sessions')
      .update({
        score_correct: u.score_correct,
        score_total: u.score_total,
        accuracy: u.accuracy,
        scaled_score: u.scaled_score,
      })
      .eq('id', u.id);
    if (error) console.error('session update failed', u.id, error.message);
  }

  // Completed assignments that point at these sessions — refresh raw/scaled.
  const { data: assigns, error: aErr } = await sb
    .from('assignments')
    .select('id, mode, session_id, session_id_2, score_correct, score_total, scaled_score, status')
    .eq('status', 'completed');
  if (aErr) throw new Error(aErr.message);

  const sessById = new Map(sessionUpdates.map((s) => [s.id, s]));
  // Also need full updated session rows for assignments not in sessionUpdates
  // (score unchanged but we still want consistency) — load post-update scores.
  const allSessById = new Map(sessions.map((s) => {
    const u = sessById.get(s.id);
    return [s.id, u ? { ...s, ...u } : s];
  }));

  let assignUpdated = 0;
  for (const row of assigns ?? []) {
    if (row.mode === 'mock-full' && row.session_id) {
      const s = allSessById.get(row.session_id);
      if (!s) continue;
      const next = {
        score_correct: s.score_correct,
        score_total: s.score_total,
        scaled_score: s.scaled_score,
      };
      if (
        row.score_correct !== next.score_correct
        || row.score_total !== next.score_total
        || row.scaled_score !== next.scaled_score
      ) {
        const { error } = await sb.from('assignments').update(next).eq('id', row.id);
        if (error) console.error('assignment update failed', row.id, error.message);
        else assignUpdated += 1;
      }
    } else if (row.mode === 'mock-exam' && row.session_id && row.session_id_2) {
      const rw = allSessById.get(row.session_id);
      const math = allSessById.get(row.session_id_2);
      if (!rw || !math) continue;
      const scaled =
        rw.scaled_score != null && math.scaled_score != null
          ? compositeScore(rw.scaled_score, math.scaled_score)
          : row.scaled_score;
      const score_correct = (rw.score_correct ?? 0) + (math.score_correct ?? 0);
      const score_total = (rw.score_total ?? 0) + (math.score_total ?? 0);
      if (
        row.score_correct !== score_correct
        || row.score_total !== score_total
        || row.scaled_score !== scaled
      ) {
        const { error } = await sb
          .from('assignments')
          .update({ score_correct, score_total, scaled_score: scaled })
          .eq('id', row.id);
        if (error) console.error('assignment update failed', row.id, error.message);
        else assignUpdated += 1;
      }
    } else if (row.session_id) {
      const s = allSessById.get(row.session_id);
      if (!s) continue;
      const next = {
        score_correct: s.score_correct,
        score_total: s.score_total,
        scaled_score: s.scaled_score,
      };
      if (
        row.score_correct !== next.score_correct
        || row.score_total !== next.score_total
        || row.scaled_score !== next.scaled_score
      ) {
        const { error } = await sb.from('assignments').update(next).eq('id', row.id);
        if (error) console.error('assignment update failed', row.id, error.message);
        else assignUpdated += 1;
      }
    }
  }

  console.log({ assignUpdated, done: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
