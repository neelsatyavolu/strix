'use client';

import React from 'react';
import { scaledSectionScore, routeModule2 } from '@/lib/scoring/curve';
import { isSectionEstimateMode, modulePretestIds, moduleRoutingStats, questionViewForSection } from '@/lib/practice/sessionLogic.mjs';

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

function normalizeSpr(s) {
  return String(s ?? '').trim().replace(/\s+/g, '').toLowerCase();
}

function isResponseCorrect(question, response) {
  if (!response?.value) return false;
  if (question.type === 'spr') {
    const given = normalizeSpr(response.value);
    return !!given && (question.correct || []).some((k) => normalizeSpr(k) === given);
  }
  return (question.correct || []).includes(response.value);
}

// General practice ('drill') lets students retry MCQs until correct, but only the
// FIRST attempt counts. For MCQs (firstValue recorded) use firstCorrect; for SPR
// and unanswered items there is a single attempt, so fall back to the final value.
function drillResponseCorrect(question, response) {
  if (response?.firstValue != null) return !!response.firstCorrect;
  return isResponseCorrect(question, response);
}

function responseCorrect(mode, question, response) {
  return mode === 'drill' ? drillResponseCorrect(question, response) : isResponseCorrect(question, response);
}

async function requestQuestions(params) {
  const res = await fetch(`/api/questions?${params.toString()}`);
  const json = await res.json();
  if (!json.success || !json.data?.questions?.length) {
    throw new Error(json.error || 'No questions were returned. Try a different filter.');
  }
  return json.data.questions;
}

// Drill: a flat, filtered set (category + difficulty).
async function fetchQuestions({ section, category, difficulty, limit }) {
  const params = new URLSearchParams({ section, difficulty: difficulty ?? 'all', limit: String(limit) });
  if (category) params.set('category', category);
  return requestQuestions(params);
}

// Mock: a blueprinted full SAT module (domain-ordered, difficulty-ramped).
async function fetchModule({ section, profile = 'mixed', exclude }) {
  const params = new URLSearchParams({ section, mode: 'module', profile });
  if (exclude?.length) params.set('exclude', exclude.join(','));
  return requestQuestions(params);
}

function buildReview(questions, responses, pretestIds = [], mode = null) {
  const pretest = new Set(pretestIds);
  const review = questions.map((q) => {
    const r = responses[q.id];
    // In drill mode, surface the FIRST answer (and its correctness) so the review
    // reflects what counted toward stats, not the eventually-correct retry.
    const response = mode === 'drill' && r ? { ...r, value: r.firstValue ?? r.value ?? null } : (r || null);
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

// Snapshot a finished section (used for the full-exam composite report).
function sectionSnapshot(state) {
  const allQs = state.modules.flatMap((m) => m.questions);
  const base = buildReview(allQs, state.responses, state.pretestIds, state.mode);
  const scaled = scaledSectionScore(base.correct, base.total, state.m2Variant === 'easy', state.section);
  return { ...base, section: state.section, scaled, m2Variant: state.m2Variant };
}

// Effective stored value for a question (drill records the first attempt).
function storedValue(mode, response) {
  return (mode === 'drill' ? (response?.firstValue ?? response?.value) : response?.value) ?? null;
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
    const scaled = isSectionEstimateMode(state.mode)
      ? scaledSectionScore(full.correct, full.total, state.m2Variant === 'easy', state.section)
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
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // 'mock-exam' isn't a DB mode; each section persists as a full section.
        mode: state.mode === 'mock-exam' ? 'mock-full' : state.mode,
        section: state.section,
        config: { ...(state.config || {}), exam: state.mode === 'mock-exam' },
        score_correct: base.correct,
        score_total: base.total,
        accuracy: base.accuracy,
        scaled_score: scaled,
        questions,
      }),
    });
  } catch {
    /* persistence is best-effort; never blocks the result UI */
  }
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
      const questions = isDrill
        ? await fetchQuestions({
            section,
            category: config.category,
            difficulty: config.difficulty,
            limit: config.count ?? 10,
          })
        : await fetchModule({ section, profile: 'mixed' });
      setState((s) => ({
        ...s,
        status: 'active',
        phase: isFullSection(mode) ? 'm1' : 'drill',
        modules: [{ key: 'm1', label: mode === 'drill' ? 'Drill' : 'Module 1', variant: null, questions }],
        pretestIds: isDrill ? [] : modulePretestIds(questions),
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

  const setValue = React.useCallback((value) => updateResponse({ value }), []);

  // Drill MCQ: immediate-check, retry-until-correct. Records the first attempt's
  // correctness (stats), tracks wrong picks so they lock out, and only sets
  // `solved` (which ungates Next) when the correct option is chosen.
  const answerDrillMCQ = React.useCallback((letter) => {
    // Freeze time-to-first-answer on the first click (reads fresh state via ref).
    const cur = stateRef.current;
    const cq = cur.modules[cur.activeModuleIndex]?.questions[cur.index];
    const cr = cq ? cur.responses[cq.id] : null;
    if (cq && cr?.firstValue == null && !cr?.solved) freezeTiming(cq.id);
    setState((s) => {
      const q = s.modules[s.activeModuleIndex]?.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      if (prev.solved) return s; // locked once correct
      const isCorrect = (q.correct || []).includes(letter);
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
      return { ...s, responses: { ...s.responses, [q.id]: next } };
    });
  }, []);

  const toggleFlag = React.useCallback(() =>
    setState((s) => {
      const q = s.modules[s.activeModuleIndex]?.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      return { ...s, responses: { ...s.responses, [q.id]: { ...prev, flagged: !prev.flagged } } };
    }), []);

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

  // Leave a session early. General practice ('drill') saves the questions already
  // answered (first-attempt stats) and discards the rest; full modules/sections/
  // exams save nothing at all. Then return home.
  const exitSession = React.useCallback((go) => {
    const s = stateRef.current;
    if (s.mode === 'drill') persistSession(s, finalizeTimes());
    reset();
    if (go) go('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  // End the active module. Full-section M1 -> route + load M2 immediately.
  // Otherwise the section is done: advance the exam, or finalize the report.
  const finishModule = React.useCallback(async (go) => {
    const s = stateRef.current;

    if (isFullSection(s.mode) && s.phase === 'm1') {
      flushTiming(Date.now()); // stop counting M1's last question while Module 2 loads
      const m1 = s.modules[0];
      const routing = moduleRoutingStats(m1.questions, s.responses, s.pretestIds, isResponseCorrect);
      const variant = routeModule2(routing.correct, routing.total);
      setState((prev) => ({ ...prev, status: 'loading', phase: 'm2', m2Variant: variant }));
      try {
        const all = await fetchModule({
          section: s.section,
          profile: variant === 'hard' ? 'hard' : 'easy',
          exclude: m1.questions.map((q) => q.id),
        });
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

    // Section complete.
    if (s.exam) {
      persistSession(s, finalizeTimes());
      const snapshot = sectionSnapshot(s);
      const nextIndex = s.exam.index + 1;
      const results = [...s.exam.results, snapshot];
      if (nextIndex < s.exam.sections.length) {
        setState((prev) => ({ ...prev, status: 'submitted', phase: 'done', exam: { ...prev.exam, index: nextIndex, results } }));
        go('exam-break');
      } else {
        setState((prev) => ({ ...prev, status: 'submitted', phase: 'done', exam: { ...prev.exam, results } }));
        go('exam-report');
      }
      return;
    }

    persistSession(s, finalizeTimes());
    setState((prev) => ({ ...prev, status: 'submitted', phase: 'done' }));
    go('score-report');
  }, []);

  // Full SAT: after the break, load Module 1 of the next section.
  const startExamNextSection = React.useCallback(async (go) => {
    const s = stateRef.current;
    if (!s.exam) return;
    const section = s.exam.sections[s.exam.index];
    setState((prev) => ({ ...prev, status: 'loading', section }));
    try {
      const questions = await fetchModule({ section, profile: 'mixed' });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const scaled = isSectionEstimateMode(state.mode)
      ? scaledSectionScore(base.correct, base.total, routedEasy, state.section)
      : null;
    return {
      ...base,
      section: state.section,
      mode: state.mode,
      scaled,
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
    goTo,
    next,
    prev,
    submit,
    finishModule,
    startExamNextSection,
    reset,
    exitSession,
    isResponseCorrect,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default PracticeSessionProvider;
