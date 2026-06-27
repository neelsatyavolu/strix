'use client';

import React from 'react';
import { scaledSectionScore, routeModule2 } from '@/lib/scoring/curve';

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

// Mark ~2 questions per module as unscored "pretest" items, like the real test.
function pickPretest(questions, n = 2) {
  if (!questions || questions.length <= n) return [];
  const pool = questions.map((q) => q.id);
  const chosen = [];
  for (let i = 0; i < n && pool.length; i++) {
    chosen.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return chosen;
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
    return { question: q, response, isCorrect: responseCorrect(mode, q, r), isPretest: pretest.has(q.id) };
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

// Persist a finalized section to the Vercel server (non-blocking).
async function persistSession(state) {
  try {
    const all = state.modules.flatMap((m) => m.questions.map((q) => ({ q, moduleKey: m.key })));
    if (!all.length) return;
    const base = buildReview(all.map((x) => x.q), state.responses, state.pretestIds, state.mode);
    const scaled = state.mode && state.mode !== 'drill'
      ? scaledSectionScore(base.correct, base.total, state.m2Variant === 'easy', state.section)
      : null;
    const pretest = new Set(state.pretestIds || []);
    const questions = all.map(({ q, moduleKey }, i) => {
      const r = state.responses[q.id];
      return {
        external_id: q.id,
        section: q.section,
        domain: q.domain,
        skill: q.skill,
        difficulty: q.difficulty,
        ordinal: i,
        module: moduleKey,
        snapshot: { ...q, pretest: pretest.has(q.id) },
        value: (state.mode === 'drill' ? (r?.firstValue ?? r?.value) : r?.value) ?? null,
        is_correct: responseCorrect(state.mode, q, r),
        time_ms: null,
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
  const m2PromiseRef = React.useRef(null);
  // Always-fresh snapshot of state for use inside event handlers.
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const start = React.useCallback(async (config) => {
    const mode = config.mode ?? 'drill';
    const isExam = mode === 'mock-exam';
    const section = isExam ? EXAM_SECTIONS[0] : config.section;
    m2PromiseRef.current = null;
    setState({
      ...EMPTY,
      status: 'loading',
      mode,
      section,
      config,
      exam: isExam ? { sections: EXAM_SECTIONS, index: 0, results: [] } : null,
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
        pretestIds: isDrill ? [] : pickPretest(questions),
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
  const answerDrillMCQ = React.useCallback((letter) =>
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
    }), []);

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
  const reset = React.useCallback(() => { m2PromiseRef.current = null; setState(EMPTY); }, []);

  // End the active module. Full-section M1 -> route + load M2 -> review screen.
  // Otherwise the section is done: advance the exam, or finalize the report.
  const finishModule = React.useCallback((go) => {
    const s = stateRef.current;

    if (isFullSection(s.mode) && s.phase === 'm1') {
      const m1 = s.modules[0];
      const correct = m1.questions.filter((q) => isResponseCorrect(q, s.responses[q.id])).length;
      const variant = routeModule2(correct, m1.questions.length);
      m2PromiseRef.current = fetchModule({
        section: s.section,
        profile: variant === 'hard' ? 'hard' : 'easy',
        exclude: m1.questions.map((q) => q.id),
      });
      setState((prev) => ({ ...prev, phase: 'review', m2Variant: variant }));
      go('module-review');
      return;
    }

    // Section complete.
    if (s.exam) {
      persistSession(s);
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

    persistSession(s);
    setState((prev) => ({ ...prev, status: 'submitted', phase: 'done' }));
    go('score-report');
  }, []);

  const startModule2 = React.useCallback(async (go) => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const all = await m2PromiseRef.current;
      // Belt-and-suspenders: drop any id already in Module 1 (server already excludes).
      const m1Ids = new Set((stateRef.current.modules[0]?.questions || []).map((q) => q.id));
      const questions = (all || []).filter((q) => !m1Ids.has(q.id));
      setState((s) => ({
        ...s,
        status: 'active',
        phase: 'm2',
        modules: [...s.modules.slice(0, 1), { key: 'm2', label: s.m2Variant === 'hard' ? 'Module 2B' : 'Module 2A', variant: s.m2Variant, questions }],
        pretestIds: [...s.pretestIds, ...pickPretest(questions)],
        activeModuleIndex: 1,
        index: 0,
      }));
      go(stateRef.current.section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Failed to load Module 2' }));
    }
  }, []);

  // Full SAT: after the break, load Module 1 of the next section.
  const startExamNextSection = React.useCallback(async (go) => {
    const s = stateRef.current;
    if (!s.exam) return;
    const section = s.exam.sections[s.exam.index];
    m2PromiseRef.current = null;
    setState((prev) => ({ ...prev, status: 'loading', section }));
    try {
      const questions = await fetchModule({ section, profile: 'mixed' });
      setState((prev) => ({
        ...prev,
        status: 'active',
        phase: 'm1',
        section,
        modules: [{ key: 'm1', label: 'Module 1', variant: null, questions }],
        pretestIds: pickPretest(questions),
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
    const scaled = state.mode && state.mode !== 'drill'
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
    startModule2,
    startExamNextSection,
    reset,
    isResponseCorrect,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default PracticeSessionProvider;
