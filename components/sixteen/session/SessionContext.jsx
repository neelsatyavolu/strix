'use client';

import React from 'react';
import { scaledSectionScore, sectionScoreRange, routeModule2, compositeScore } from '@/lib/scoring/curve';
import { isSectionEstimateMode, modulePretestIds, moduleRoutingStats, questionViewForSection } from '@/lib/practice/sessionLogic.mjs';
import { isValueCorrect, questionHasKey } from '@/lib/practice/grading.mjs';
import { enqueuePendingSession, flushPendingSessions } from '@/lib/practice/persistQueue.mjs';

// Client-side practice session. Shapes:
//  - drill / mock-m1: a single fixed set of real CB questions, scored on submit.
//  - mock-full: adaptive Module 1 -> (route) -> Module 2A/2B, scaled on the curve.
//  - mock-exam: a full SAT — R&W (full) -> 10-min break -> Math (full) -> composite.

const SessionContext = React.createContext(null);

export function usePracticeSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('usePracticeSession must be used within PracticeSessionProvider');
  return ctx;
}

const EXAM_SECTIONS = ['rw', 'math'];

function isFullSection(mode) {
  return mode === 'mock-full' || mode === 'mock-exam';
}

// General practice ('drill') and spaced-repetition review ('review') share the
// same shape: a single set of questions with retry-until-correct MCQs where the
// first attempt is what counts toward stats and review scheduling.
function usesDrillSemantics(mode) {
  return mode === 'drill' || mode === 'review';
}

// Resumable in-progress session. Only drill-semantics sessions (targeted drills,
// tutor assignments and spaced-repetition review) are snapshotted to localStorage
// so a student who leaves mid-set can pick up exactly where they left off. Full
// modules / sections / exams are never resumable.
const SNAPSHOT_KEY = 'strix-active-session';

function loadSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isResponseCorrect(question, response) {
  return isValueCorrect(question, response?.value);
}

// General practice ('drill') lets students retry MCQs until correct, but only the
// FIRST attempt counts. For MCQs (firstValue recorded) use firstCorrect; for SPR
// and unanswered items there is a single attempt, so fall back to the final value.
function drillResponseCorrect(question, response) {
  if (response?.firstValue != null) return !!response.firstCorrect;
  // Sanitized questions carry no answer key; fall back to the server-graded
  // verdict (drill SPR items are checked in the background between questions).
  if (!questionHasKey(question)) return !!response?.checkedCorrect;
  return isResponseCorrect(question, response);
}

function responseCorrect(mode, question, response) {
  return usesDrillSemantics(mode) ? drillResponseCorrect(question, response) : isResponseCorrect(question, response);
}

async function requestQuestions(params) {
  const res = await fetch(`/api/questions?${params.toString()}`);
  const json = await res.json();
  if (!json.success || !json.data?.questions?.length) {
    throw new Error(json.error || 'No questions were returned. Try a different filter.');
  }
  return json.data.questions;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Server-side grading: question payloads carry no answer key, so committed
// answers are checked (and, once committed for good, revealed) via
// POST /api/questions/grade. Retries transient failures before giving up.
async function gradeAttempts(attempts, reveal) {
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('/api/questions/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempts, reveal }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || 'Grading failed');
      return new Map((json.data?.results || []).map((r) => [r.id, r]));
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await sleep(700 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Grading failed');
}

function mergeKeyIntoModules(modules, qid, key) {
  return modules.map((m) => ({
    ...m,
    questions: m.questions.map((q) => (q.id === qid ? { ...q, ...key } : q)),
  }));
}

// Grade + reveal every question that still lacks its key (used when a module /
// section is committed), returning modules whose questions carry correct /
// correctIds / rationaleHtml again — so the existing synchronous scoring,
// routing and report logic works unchanged downstream.
async function withAnswerKeys(modules, responses, mode, section) {
  const missing = modules.flatMap((m) => m.questions.filter((q) => !questionHasKey(q)));
  if (!missing.length) return modules;
  const attempts = missing.map((q) => ({
    id: q.id,
    section: q.section || section,
    value: storedValue(mode, responses[q.id]),
  }));
  const graded = await gradeAttempts(attempts, true);
  return modules.map((m) => ({
    ...m,
    questions: m.questions.map((q) => {
      const r = graded.get(q.id);
      return r?.key ? { ...q, ...r.key } : q;
    }),
  }));
}

// Drill: a flat, filtered set (category + difficulty).
async function fetchQuestions({ section, category, difficulty, limit }) {
  const params = new URLSearchParams({ section, difficulty: difficulty ?? 'all', limit: String(limit) });
  if (category) params.set('category', category);
  return requestQuestions(params);
}

// Review: spaced-repetition items due now for one section, served from the
// stored snapshots (no College Board round-trip).
async function fetchReviewQuestions({ section }) {
  const res = await fetch(`/api/review/queue?section=${section}`);
  const json = await res.json();
  if (!json.success || !json.data?.questions?.length) {
    throw new Error(json.error || 'Nothing is due for review right now.');
  }
  return json.data.questions;
}

// Mock: a blueprinted full SAT module (domain-ordered, difficulty-ramped).
async function fetchModule({ section, profile = 'mixed', exclude }) {
  const params = new URLSearchParams({ section, mode: 'module', profile });
  if (exclude?.length) params.set('exclude', exclude.join(','));
  return requestQuestions(params);
}

// Official Bluebook form: the exact real-form module in published order.
async function fetchOfficialModule({ test, section, moduleKey }) {
  const params = new URLSearchParams({ section, mode: 'official', test: String(test), moduleKey });
  return requestQuestions(params);
}

// Strix Test: a fixed alternative full-SAT module, in Bluebook-like order.
async function fetchStrixModule({ test, section, moduleKey }) {
  const params = new URLSearchParams({ section, mode: 'strix', strixTest: String(test), moduleKey });
  return requestQuestions(params);
}

// Module 1 for a full section/exam: a fixed Strix test or real Bluebook form
// when one was picked, otherwise the calibrated synthetic question-bank module.
async function fetchModule1({ section, bluebookTest, strixTest }) {
  if (strixTest) return fetchStrixModule({ test: strixTest, section, moduleKey: 'm1' });
  if (bluebookTest) return fetchOfficialModule({ test: bluebookTest, section, moduleKey: 'm1' });
  return fetchModule({ section, profile: 'mixed' });
}

function buildReview(questions, responses, pretestIds = [], mode = null) {
  const pretest = new Set(pretestIds);
  const review = questions.map((q) => {
    const r = responses[q.id];
    // In drill mode, surface the FIRST answer (and its correctness) so the review
    // reflects what counted toward stats, not the eventually-correct retry.
    const response = usesDrillSemantics(mode) && r ? { ...r, value: r.firstValue ?? r.value ?? null } : (r || null);
    return { question: q, response, isCorrect: responseCorrect(mode, q, r), isPretest: !!q.pretest || pretest.has(q.id) };
  });
  // Operational (scored) items only — unscored pretest items don't count.
  const scored = review.filter((x) => !x.isPretest);
  const correct = scored.filter((x) => x.isCorrect).length;
  const total = scored.length;
  const byDomainMap = new Map();
  for (const x of scored) {
    const e = byDomainMap.get(x.question.domain) || { domain: x.question.domain, label: x.question.domainLabel, correct: 0, total: 0 };
    e.total += 1;
    if (x.isCorrect) e.correct += 1;
    byDomainMap.set(x.question.domain, e);
  }
  return { correct, total, accuracy: total ? Math.round((correct / total) * 100) : 0, byDomain: [...byDomainMap.values()], review };
}

// Tag each review item with its source module (key + display label) so reports
// can group the question list by module. Single-module sessions (drills) stay
// one group and render without headers.
function withModuleLabels(review, modules) {
  const byQid = new Map();
  for (const m of modules) for (const q of m.questions) byQid.set(q.id, { module: m.key, moduleLabel: m.label });
  return review.map((item) => ({ ...item, ...(byQid.get(item.question.id) || {}) }));
}

function moduleScoreStats(state) {
  return state.modules.map((m) => {
    const result = buildReview(m.questions, state.responses, state.pretestIds, state.mode);
    return { correct: result.correct, total: result.total };
  });
}

// Snapshot a finished section (used for the full-exam composite report).
function sectionSnapshot(state) {
  const allQs = state.modules.flatMap((m) => m.questions);
  const base = buildReview(allQs, state.responses, state.pretestIds, state.mode);
  const modules = moduleScoreStats(state);
  const scaledRange = sectionScoreRange(base.correct, base.total, {
    section: state.section,
    routedEasy: state.m2Variant === 'easy',
    test: state.config?.bluebookTest ?? null,
    modules,
  });
  return { ...base, review: withModuleLabels(base.review, state.modules), section: state.section, scaled: scaledRange.estimate, scaledRange, m2Variant: state.m2Variant };
}

// Effective stored value for a question (drill records the first attempt).
function storedValue(mode, response) {
  return (usesDrillSemantics(mode) ? (response?.firstValue ?? response?.value) : response?.value) ?? null;
}
function hasAnswer(mode, response) {
  const v = storedValue(mode, response);
  return v != null && String(v).trim() !== '';
}

// Persist a finalized section to the Vercel server (non-blocking).
// `times` maps question id -> milliseconds on screen (see timingRef).
// Skipped (unanswered) questions are excluded from the score, accuracy and the
// persisted per-question rows so they never count toward stats. The scaled score
// (mocks only) is still computed over the whole section, since an unanswered SAT
// question loses points.
async function persistSession(state, times = {}) {
  try {
    const all = state.modules.flatMap((m) => m.questions.map((q) => ({ q, moduleKey: m.key })));
    if (!all.length) return;
    // Whole section (skipped items count as wrong) — drives the scaled score.
    const full = buildReview(all.map((x) => x.q), state.responses, state.pretestIds, state.mode);
    const moduleScores = moduleScoreStats(state);
    const scaled = isSectionEstimateMode(state.mode)
      ? scaledSectionScore(full.correct, full.total, state.m2Variant === 'easy', state.section, state.config?.bluebookTest ?? null, moduleScores)
      : null;
    // Answered questions only — drives score / accuracy and what we store.
    const answered = all.filter(({ q }) => hasAnswer(state.mode, state.responses[q.id]));
    if (!answered.length) return;
    const base = buildReview(answered.map((x) => x.q), state.responses, state.pretestIds, state.mode);
    const pretest = new Set(state.pretestIds || []);
    const questions = answered.map(({ q, moduleKey }, i) => {
      const r = state.responses[q.id];
      return {
        external_id: q.id,
        section: q.section,
        domain: q.domain,
        skill: q.skill,
        difficulty: q.difficulty,
        ordinal: i,
        module: moduleKey,
        snapshot: { ...q, pretest: !!q.pretest || pretest.has(q.id) },
        value: storedValue(state.mode, r),
        is_correct: responseCorrect(state.mode, q, r),
        time_ms: times[q.id] != null ? Math.round(times[q.id]) : null,
        flagged: !!r?.flagged,
      };
    });
    const isExam = state.mode === 'mock-exam';
    // A full SAT completes once, via PATCH /api/assignments after both halves are
    // saved — so its halves must NOT carry assignmentId (which would auto-complete
    // the assignment here, twice and without the composite). Single sessions keep
    // it. assignmentId: undefined is dropped by JSON.stringify.
    const persistConfig = { ...(state.config || {}), ...(isExam ? { exam: true, assignmentId: undefined } : {}) };
    const payload = {
      // 'mock-exam' isn't a DB mode; each section persists as a full section.
      mode: isExam ? 'mock-full' : state.mode,
      section: state.section,
      config: persistConfig,
      score_correct: base.correct,
      score_total: base.total,
      accuracy: base.accuracy,
      scaled_score: scaled,
      questions,
    };
    // Durable submit: retry transient failures here, then queue the payload for
    // a later flush — a finished test must never be lost to a network drop.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => null);
        if (json?.success) return json.data?.id ?? null;
        if (res.status === 400) return null; // invalid payload — retrying can't help
      } catch {
        /* network error — retry below */
      }
      if (attempt < 2) await sleep(1200 * (attempt + 1));
    }
    enqueuePendingSession(payload);
    return null;
  } catch {
    /* building the payload failed; nothing recoverable to queue */
    return null;
  }
}

// A full SAT that fulfilled a tutor assignment completes once, after both halves
// are saved — linking both half-sessions and the composite 400–1600. Best-effort:
// a hiccup here never blocks the exam report.
async function completeExamAssignment(state, results) {
  const assignmentId = state.config?.assignmentId;
  if (!assignmentId) return;
  const rw = results.find((r) => r.section === 'rw');
  const math = results.find((r) => r.section === 'math');
  if (!rw?.sessionId || !math?.sessionId) return;
  try {
    await fetch('/api/assignments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: assignmentId,
        rwSessionId: rw.sessionId,
        mathSessionId: math.sessionId,
        scaled: compositeScore(rw.scaled, math.scaled),
      }),
    });
  } catch { /* best-effort */ }
}

const EMPTY = {
  status: 'idle', // idle | loading | active | submitted | error
  phase: 'drill', // drill | m1 | review | m2 | done
  mode: null,
  section: null,
  config: null,
  modules: [], // [{ key, label, variant, questions }]
  activeModuleIndex: 0,
  responses: {}, // questionId -> { value, flagged, firstValue?, firstCorrect?, tried?, solved? }
  pretestIds: [], // unscored question ids for the current section
  index: 0,
  error: null,
  startedAt: null,
  m2Variant: null, // 'easy' | 'hard'
  exam: null, // { sections, index, results: [sectionSnapshot] } for a full SAT
};

export function PracticeSessionProvider({ children }) {
  const [state, setState] = React.useState(EMPTY);
  // Always-fresh snapshot of state for use inside event handlers.
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Per-question time on screen. Mock modes accumulate total dwell across
  // revisits; general practice (drill) freezes at the first answer click, so the
  // stored value is time-to-first-answer.
  const timingRef = React.useRef({ currentId: null, shownAt: null, byId: {}, frozen: new Set() });
  const resetTiming = () => { timingRef.current = { currentId: null, shownAt: null, byId: {}, frozen: new Set() }; };
  const flushTiming = (now) => {
    const t = timingRef.current;
    if (t.currentId && t.shownAt != null && !t.frozen.has(t.currentId)) {
      t.byId[t.currentId] = (t.byId[t.currentId] || 0) + (now - t.shownAt);
    }
    t.shownAt = null;
  };
  // Drill: close out time-to-first-answer and stop counting further retry time.
  const freezeTiming = (qid) => {
    const t = timingRef.current;
    if (t.currentId === qid && t.shownAt != null && !t.frozen.has(qid)) {
      t.byId[qid] = (t.byId[qid] || 0) + (Date.now() - t.shownAt);
    }
    t.frozen.add(qid);
  };
  const finalizeTimes = () => { flushTiming(Date.now()); return { ...timingRef.current.byId }; };

  const start = React.useCallback(async (config) => {
    const mode = config.mode ?? 'drill';
    const isExam = mode === 'mock-exam';
    const section = isExam ? EXAM_SECTIONS[0] : config.section;
    // Tag a full SAT's two persisted halves with one id so "Practice Tests"
    // can pair them back into a single test (composite 400–1600).
    const examId = isExam ? (globalThis.crypto?.randomUUID?.() ?? `exam-${Date.now()}`) : null;
    const sessionConfig = isExam ? { ...config, examId } : config;
    resetTiming();
    setState({
      ...EMPTY,
      status: 'loading',
      mode,
      section,
      config: sessionConfig,
      exam: isExam ? { sections: EXAM_SECTIONS, index: 0, results: [], examId } : null,
    });
    try {
      const isDrill = mode === 'drill';
      const isReview = mode === 'review';
      let questions;
      if (isReview) {
        questions = await fetchReviewQuestions({ section });
      } else if (isDrill) {
        questions = await fetchQuestions({
          section,
          category: config.category,
          difficulty: config.difficulty,
          limit: config.count ?? 10,
        });
      } else if (mode === 'mock-m1' && (config.moduleKey === 'easy' || config.moduleKey === 'hard') && config.bluebookTest) {
        // A single Module 2A/2B is only defined by an official Bluebook form.
        questions = await fetchOfficialModule({ test: config.bluebookTest, section, moduleKey: config.moduleKey });
      } else {
        questions = await fetchModule1({ section, bluebookTest: config.bluebookTest, strixTest: config.strixTest });
      }
      const moduleLabel = isDrill ? 'Drill' : isReview ? 'Review'
        : mode === 'mock-m1' && config.moduleKey === 'easy' ? 'Module 2A'
        : mode === 'mock-m1' && config.moduleKey === 'hard' ? 'Module 2B'
        : 'Module 1';
      setState((s) => ({
        ...s,
        status: 'active',
        phase: isFullSection(mode) ? 'm1' : 'drill',
        modules: [{ key: 'm1', label: moduleLabel, variant: null, questions }],
        pretestIds: usesDrillSemantics(mode) ? [] : modulePretestIds(questions),
        activeModuleIndex: 0,
        index: 0,
        responses: {},
        startedAt: Date.now(),
      }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Failed to load questions' }));
    }
  }, []);

  const updateResponse = (patch) =>
    setState((s) => {
      const q = s.modules[s.activeModuleIndex]?.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      return { ...s, responses: { ...s.responses, [q.id]: { ...prev, ...patch } } };
    });

  // Changing the answer invalidates any server-graded verdict for it.
  const setValue = React.useCallback((value) => updateResponse({ value, checkedCorrect: undefined }), []);

  // Drill MCQ: immediate-check, retry-until-correct. Records the first attempt's
  // correctness (stats), tracks wrong picks so they lock out, and only sets
  // `solved` (which ungates Next) when the correct option is chosen. Served
  // questions carry no answer key, so correctness comes from the grading API;
  // review snapshots still carry their key and check locally.
  const checkingRef = React.useRef(new Set());

  const applyDrillPick = React.useCallback((qid, letter, isCorrect, key) => {
    setState((s) => {
      const prev = s.responses[qid] || {};
      if (prev.solved) return s; // locked once correct
      const firstAttempt = prev.firstValue == null;
      const next = {
        ...prev,
        firstValue: prev.firstValue ?? letter,
        firstCorrect: firstAttempt ? isCorrect : prev.firstCorrect,
      };
      if (isCorrect) {
        next.value = letter;
        next.solved = true;
      } else {
        next.tried = [...new Set([...(prev.tried || []), letter])];
      }
      // Solving reveals the key (rationale) — fold it into the question.
      const modules = key ? mergeKeyIntoModules(s.modules, qid, key) : s.modules;
      return { ...s, modules, responses: { ...s.responses, [qid]: next } };
    });
  }, []);

  const answerDrillMCQ = React.useCallback(async (letter) => {
    const cur = stateRef.current;
    const q = cur.modules[cur.activeModuleIndex]?.questions[cur.index];
    if (!q) return;
    const r = cur.responses[q.id] || {};
    if (r.solved || checkingRef.current.has(q.id)) return;
    // Freeze time-to-first-answer on the first click.
    if (r.firstValue == null) freezeTiming(q.id);
    if (questionHasKey(q)) {
      applyDrillPick(q.id, letter, (q.correct || []).includes(letter), null);
      return;
    }
    checkingRef.current.add(q.id);
    try {
      const graded = await gradeAttempts([{ id: q.id, section: q.section || cur.section, value: letter }], false);
      const res = graded.get(q.id);
      // correct=null means the server couldn't grade — clicking again retries.
      if (res?.correct == null) return;
      applyDrillPick(q.id, letter, !!res.correct, res.key || null);
    } catch {
      /* transient failure — the next click retries the check */
    } finally {
      checkingRef.current.delete(q.id);
    }
  }, [applyDrillPick]);

  const toggleFlag = React.useCallback(() =>
    setState((s) => {
      const q = s.modules[s.activeModuleIndex]?.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      return { ...s, responses: { ...s.responses, [q.id]: { ...prev, flagged: !prev.flagged } } };
    }), []);

  // "I've done this already": permanently ban the current question and swap in a
  // fitting replacement at the same index. Review sessions are not eligible
  // (those items are deliberately re-shown for spaced repetition).
  const dismissAndReplace = React.useCallback(async () => {
    const s = stateRef.current;
    if (s.status !== 'active' || s.mode === 'review') {
      return { ok: false, error: 'This question can’t be replaced right now.' };
    }
    const mod = s.modules[s.activeModuleIndex];
    const q = mod?.questions[s.index];
    if (!q) return { ok: false, error: 'No active question.' };

    const sessionIds = s.modules.flatMap((m) => m.questions.map((x) => x.id));
    const wasPretest = !!q.pretest || (s.pretestIds || []).includes(q.id);

    try {
      const res = await fetch('/api/questions/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: q.id,
          section: q.section || s.section,
          domain: q.domain || undefined,
          difficulty: q.difficulty || undefined,
          type: q.type || undefined,
          exclude: sessionIds,
          pretest: wasPretest,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success || !json.data?.question) {
        return { ok: false, error: json?.error || 'No similar question left to swap in.' };
      }
      const nextQ = json.data.question;

      setState((prev) => {
        const m = prev.modules[prev.activeModuleIndex];
        if (!m || m.questions[prev.index]?.id !== q.id) return prev;
        const questions = m.questions.map((qq, i) => (i === prev.index ? nextQ : qq));
        const modules = prev.modules.map((mm, mi) =>
          mi === prev.activeModuleIndex ? { ...mm, questions } : mm,
        );
        const responses = { ...prev.responses };
        delete responses[q.id];
        let pretestIds = prev.pretestIds || [];
        if (pretestIds.includes(q.id)) {
          pretestIds = pretestIds.map((id) => (id === q.id ? nextQ.id : id));
        } else if (nextQ.pretest) {
          pretestIds = [...pretestIds, nextQ.id];
        }
        return { ...prev, modules, responses, pretestIds };
      });

      // Reset dwell timing for the new question in this slot.
      const t = timingRef.current;
      t.frozen.delete(q.id);
      delete t.byId[q.id];
      if (t.currentId === q.id) {
        t.currentId = nextQ.id;
        t.shownAt = Date.now();
      }
      checkingRef.current.delete(q.id);

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Failed to replace question' };
    }
  }, []);

  const goTo = React.useCallback((i) =>
    setState((s) => {
      const len = s.modules[s.activeModuleIndex]?.questions.length ?? 0;
      return { ...s, index: Math.max(0, Math.min(len - 1, i)) };
    }), []);
  const next = React.useCallback(() =>
    setState((s) => {
      const len = s.modules[s.activeModuleIndex]?.questions.length ?? 0;
      return { ...s, index: Math.min(len - 1, s.index + 1) };
    }), []);
  const prev = React.useCallback(() => setState((s) => ({ ...s, index: Math.max(0, s.index - 1) })), []);

  const submit = React.useCallback(() => {
    setState((s) => ({ ...s, status: 'submitted', phase: 'done' }));
  }, []);
  const reset = React.useCallback(() => { resetTiming(); setState(EMPTY); }, []);

  // ---- resumable snapshot (drill / review / assignment sessions only) ----
  // `resumable` is a lightweight summary of the saved snapshot for the dashboard
  // banner; the full snapshot lives in localStorage and is read on resume.
  const [resumable, setResumable] = React.useState(null);

  const writeSnapshot = React.useCallback((s) => {
    if (!usesDrillSemantics(s.mode) || s.status !== 'active') return;
    const questions = s.modules?.[0]?.questions || [];
    if (!questions.length) return;
    const snap = {
      mode: s.mode,
      section: s.section,
      config: s.config || null,
      label: s.modules[0]?.label || null,
      questions,
      responses: s.responses,
      pretestIds: s.pretestIds || [],
      index: s.index,
      startedAt: s.startedAt,
    };
    try { window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap)); } catch { /* quota / unavailable */ }
    const answered = questions.filter((q) => hasAnswer(s.mode, s.responses[q.id])).length;
    setResumable({ mode: s.mode, section: s.section, category: s.config?.category ?? null, label: snap.label, answered, total: questions.length });
  }, []);

  const clearSnapshot = React.useCallback(() => {
    try { window.localStorage.removeItem(SNAPSHOT_KEY); } catch { /* unavailable */ }
    setResumable(null);
  }, []);

  // Deliver any sessions whose submit failed earlier (offline finish, crash):
  // flush the pending queue on load and whenever connectivity returns.
  React.useEffect(() => {
    const flush = () => { flushPendingSessions().catch(() => {}); };
    flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, []);

  // Surface any snapshot left over from a previous visit (tab close / reload) so
  // the dashboard can offer to resume it.
  React.useEffect(() => {
    const snap = loadSnapshot();
    if (!snap?.questions?.length) return;
    const answered = snap.questions.filter((q) => hasAnswer(snap.mode, snap.responses?.[q.id])).length;
    setResumable({ mode: snap.mode, section: snap.section, category: snap.config?.category ?? null, label: snap.label, answered, total: snap.questions.length });
  }, []);

  // Keep the snapshot current while an eligible session is in progress, so it's
  // saved even if the student closes the tab without using Exit.
  React.useEffect(() => {
    if (state.status === 'active' && usesDrillSemantics(state.mode)) writeSnapshot(stateRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.mode, state.responses, state.index]);

  // Restore a saved session into active state. Returns the snapshot (so the caller
  // can navigate to the right question screen) or null if none is resumable.
  const resume = React.useCallback(() => {
    const snap = loadSnapshot();
    if (!snap?.questions?.length) { clearSnapshot(); return null; }
    resetTiming();
    setState({
      ...EMPTY,
      status: 'active',
      phase: 'drill',
      mode: snap.mode,
      section: snap.section,
      config: snap.config,
      modules: [{ key: 'm1', label: snap.label || (snap.mode === 'review' ? 'Review' : 'Drill'), variant: null, questions: snap.questions }],
      pretestIds: snap.pretestIds || [],
      activeModuleIndex: 0,
      index: Math.min(snap.index || 0, snap.questions.length - 1),
      responses: snap.responses || {},
      startedAt: snap.startedAt || Date.now(),
    });
    return snap;
  }, [clearSnapshot]);

  // Leave a session early. Drill / review / assignment sessions keep their saved
  // snapshot so they can be resumed from the dashboard; full modules / sections /
  // exams save nothing at all. Then return home.
  const exitSession = React.useCallback((go) => {
    const s = stateRef.current;
    if (usesDrillSemantics(s.mode)) writeSnapshot(s);
    reset();
    if (go) go('dashboard');
  }, [reset, writeSnapshot]);

  // End the active module. Committed answers are graded server-side first and
  // the answer key hydrated into state (served questions carry none), so the
  // synchronous scoring/routing below works unchanged. Full-section M1 ->
  // route + load M2 immediately. Otherwise the section is done: advance the
  // exam, or finalize the report.
  const finishModule = React.useCallback(async (go) => {
    const s = stateRef.current;
    // Grading failed after retries: keep the student's work answerable — never
    // abandon a module to a transient network failure. Submitting retries.
    const revertToActive = () => {
      setState((prev) => ({ ...prev, status: 'active', phase: s.phase }));
      window.alert("We couldn't submit right now — check your connection and try again.");
    };

    if (isFullSection(s.mode) && s.phase === 'm1') {
      flushTiming(Date.now()); // stop counting M1's last question while Module 2 loads
      setState((prev) => ({ ...prev, status: 'loading', phase: 'm2' }));
      let hydratedModules;
      try {
        hydratedModules = await withAnswerKeys(s.modules, s.responses, s.mode, s.section);
      } catch {
        revertToActive();
        return;
      }
      const m1 = hydratedModules[0];
      const routing = moduleRoutingStats(m1.questions, s.responses, s.pretestIds, isResponseCorrect);
      const variant = routeModule2(routing.correct, routing.total);
      setState((prev) => ({ ...prev, status: 'loading', phase: 'm2', modules: hydratedModules, m2Variant: variant }));
      try {
        const bluebookTest = s.config?.bluebookTest;
        const strixTest = s.config?.strixTest;
        const moduleKey = variant === 'hard' ? 'hard' : 'easy';
        let all;
        if (strixTest) {
          all = await fetchStrixModule({ test: strixTest, section: s.section, moduleKey });
        } else if (bluebookTest) {
          all = await fetchOfficialModule({ test: bluebookTest, section: s.section, moduleKey });
        } else {
          all = await fetchModule({
            section: s.section,
            profile: variant === 'hard' ? 'hard' : 'easy',
            exclude: m1.questions.map((q) => q.id),
          });
        }
        // Belt-and-suspenders: drop any id already in Module 1 (server already excludes).
        const m1Ids = new Set(m1.questions.map((q) => q.id));
        const questions = (all || []).filter((q) => !m1Ids.has(q.id));
        setState((prev) => ({
          ...prev,
          status: 'active',
          phase: 'm2',
          modules: [...prev.modules.slice(0, 1), { key: 'm2', label: variant === 'hard' ? 'Module 2B' : 'Module 2A', variant, questions }],
          pretestIds: [...prev.pretestIds, ...modulePretestIds(questions)],
          activeModuleIndex: 1,
          index: 0,
        }));
        go(questionViewForSection(s.section), { kind: 'module' });
      } catch (err) {
        setState((prev) => ({ ...prev, status: 'error', error: err instanceof Error ? err.message : 'Failed to load Module 2' }));
      }
      return;
    }

    // Section complete: reveal the key for everything, then score locally.
    setState((prev) => ({ ...prev, status: 'loading' }));
    let modules;
    try {
      modules = await withAnswerKeys(s.modules, s.responses, s.mode, s.section);
    } catch {
      revertToActive();
      return;
    }
    const hydrated = { ...s, modules };

    if (s.exam) {
      const sessionId = await persistSession(hydrated, finalizeTimes());
      const snapshot = { ...sectionSnapshot(hydrated), sessionId };
      const nextIndex = s.exam.index + 1;
      const results = [...s.exam.results, snapshot];
      if (nextIndex < s.exam.sections.length) {
        setState((prev) => ({ ...prev, status: 'submitted', phase: 'done', modules, exam: { ...prev.exam, index: nextIndex, results } }));
        go('exam-break');
      } else {
        setState((prev) => ({ ...prev, status: 'submitted', phase: 'done', modules, exam: { ...prev.exam, results } }));
        completeExamAssignment(s, results); // best-effort; full SAT completes once, here
        go('exam-report');
      }
      return;
    }

    persistSession(hydrated, finalizeTimes());
    if (usesDrillSemantics(s.mode)) clearSnapshot();
    setState((prev) => ({ ...prev, status: 'submitted', phase: 'done', modules }));
    go('score-report');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Full SAT: after the break, load Module 1 of the next section.
  const startExamNextSection = React.useCallback(async (go) => {
    const s = stateRef.current;
    if (!s.exam) return;
    const section = s.exam.sections[s.exam.index];
    setState((prev) => ({ ...prev, status: 'loading', section }));
    try {
      const questions = await fetchModule1({
        section,
        bluebookTest: s.config?.bluebookTest,
        strixTest: s.config?.strixTest,
      });
      setState((prev) => ({
        ...prev,
        status: 'active',
        phase: 'm1',
        section,
        modules: [{ key: 'm1', label: 'Module 1', variant: null, questions }],
        pretestIds: modulePretestIds(questions),
        activeModuleIndex: 0,
        index: 0,
        responses: {},
        m2Variant: null,
        startedAt: Date.now(),
      }));
      go(section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
    } catch (err) {
      setState((prev) => ({ ...prev, status: 'error', error: err instanceof Error ? err.message : 'Failed to load the next section' }));
    }
  }, []);

  // ---- derived ----
  const activeModule = state.modules[state.activeModuleIndex] || null;
  const questions = activeModule?.questions || [];
  const current = questions[state.index] || null;
  const answeredCount = questions.filter((q) => state.responses[q.id]?.value).length;

  // Track which question screen is showing; flush the previous one's dwell time
  // and start the clock on the new one. (Drill freezes separately at first answer.)
  React.useEffect(() => {
    const id = current?.id ?? null;
    const t = timingRef.current;
    if (t.currentId !== id) {
      flushTiming(Date.now());
      t.currentId = id;
      t.shownAt = id ? Date.now() : null;
    }
  }, [current?.id]);

  // Drill SPR (grid-in) answers are single-attempt and the client holds no
  // answer key, so once the student moves off one, ask the server for its
  // correctness — keeps the live stats panel honest before submit.
  // Best-effort: submit re-grades everything anyway.
  const prevQidRef = React.useRef(null);
  React.useEffect(() => {
    const prevId = prevQidRef.current;
    prevQidRef.current = current?.id ?? null;
    const s = stateRef.current;
    if (!prevId || prevId === current?.id) return;
    if (!usesDrillSemantics(s.mode) || s.status !== 'active') return;
    const q = s.modules[s.activeModuleIndex]?.questions.find((x) => x.id === prevId);
    const r = s.responses[prevId];
    if (!q || q.type !== 'spr' || questionHasKey(q)) return;
    if (!r?.value || !String(r.value).trim() || r.checkedCorrect != null) return;
    gradeAttempts([{ id: q.id, section: q.section || s.section, value: r.value }], false)
      .then((graded) => {
        const res = graded.get(q.id);
        if (res?.correct == null) return;
        setState((prev) => {
          const pr = prev.responses[q.id];
          if (!pr || pr.value !== r.value) return prev; // edited since the check
          const modules = res.key ? mergeKeyIntoModules(prev.modules, q.id, res.key) : prev.modules;
          return { ...prev, modules, responses: { ...prev.responses, [q.id]: { ...pr, checkedCorrect: !!res.correct } } };
        });
      })
      .catch(() => { /* best-effort */ });
  }, [current?.id]);

  const buildResult = (qs) => buildReview(qs, state.responses, state.pretestIds, state.mode);

  const moduleResult = React.useCallback((i) => {
    const m = state.modules[i];
    return m ? buildResult(m.questions) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.modules, state.responses, state.pretestIds]);

  const result = React.useMemo(() => {
    const allQs = state.modules.flatMap((m) => m.questions);
    if (!allQs.length) return null;
    const base = buildResult(allQs);
    const routedEasy = state.m2Variant === 'easy';
    const modules = moduleScoreStats(state);
    const scaledRange = isSectionEstimateMode(state.mode)
      ? sectionScoreRange(base.correct, base.total, { section: state.section, routedEasy, test: state.config?.bluebookTest ?? null, modules })
      : null;
    return {
      ...base,
      review: withModuleLabels(base.review, state.modules),
      section: state.section,
      mode: state.mode,
      scaled: scaledRange?.estimate ?? null,
      scaledRange,
      routedEasy,
      m2Variant: state.m2Variant,
      elapsedMs: state.startedAt ? Date.now() - state.startedAt : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.modules, state.responses, state.pretestIds, state.mode, state.section, state.m2Variant, state.startedAt]);

  const value = {
    status: state.status,
    phase: state.phase,
    mode: state.mode,
    section: state.section,
    config: state.config,
    error: state.error,
    index: state.index,
    m2Variant: state.m2Variant,
    exam: state.exam,
    activeModule,
    questions,
    responses: state.responses,
    current,
    answeredCount,
    result,
    moduleResult,
    start,
    setValue,
    answerDrillMCQ,
    toggleFlag,
    dismissAndReplace,
    goTo,
    next,
    prev,
    submit,
    finishModule,
    startExamNextSection,
    reset,
    exitSession,
    resumable,
    resume,
    discardResumable: clearSnapshot,
    isResponseCorrect,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default PracticeSessionProvider;
