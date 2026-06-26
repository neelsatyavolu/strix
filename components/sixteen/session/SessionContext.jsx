'use client';

import React from 'react';
import { scaledSectionScore, routeModule2 } from '@/lib/scoring/curve';

// Client-side practice session. Supports two shapes:
//  - drill / mock-m1: a single fixed set of real CB questions, scored on submit.
//  - mock-full: adaptive Module 1 -> (route) -> Module 2A/2B, scaled on the curve.

const SessionContext = React.createContext(null);

export function usePracticeSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('usePracticeSession must be used within PracticeSessionProvider');
  return ctx;
}

const SECTION_LEN = { rw: 27, math: 22 };

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

async function fetchQuestions({ section, category, difficulty, limit }) {
  const params = new URLSearchParams({ section, difficulty: difficulty ?? 'all', limit: String(limit) });
  if (category) params.set('category', category);
  const res = await fetch(`/api/questions?${params.toString()}`);
  const json = await res.json();
  if (!json.success || !json.data?.questions?.length) {
    throw new Error(json.error || 'No questions were returned. Try a different filter.');
  }
  return json.data.questions;
}

function buildReview(questions, responses) {
  const review = questions.map((q) => {
    const r = responses[q.id];
    return { question: q, response: r || null, isCorrect: isResponseCorrect(q, r) };
  });
  const correct = review.filter((x) => x.isCorrect).length;
  const total = questions.length;
  const byDomainMap = new Map();
  for (const x of review) {
    const e = byDomainMap.get(x.question.domain) || { domain: x.question.domain, label: x.question.domainLabel, correct: 0, total: 0 };
    e.total += 1;
    if (x.isCorrect) e.correct += 1;
    byDomainMap.set(x.question.domain, e);
  }
  return { correct, total, accuracy: total ? Math.round((correct / total) * 100) : 0, byDomain: [...byDomainMap.values()], review };
}

// Persist a finalized session to the Vercel server (non-blocking).
async function persistSession(state) {
  try {
    const all = state.modules.flatMap((m) => m.questions.map((q) => ({ q, moduleKey: m.key })));
    if (!all.length) return;
    const base = buildReview(all.map((x) => x.q), state.responses);
    const scaled = state.mode && state.mode !== 'drill'
      ? scaledSectionScore(base.correct, base.total, state.m2Variant === 'easy')
      : null;
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
        snapshot: q,
        value: r?.value ?? null,
        is_correct: isResponseCorrect(q, r),
        time_ms: null,
        flagged: !!r?.flagged,
      };
    });
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: state.mode,
        section: state.section,
        config: state.config || {},
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
  responses: {}, // questionId -> { value, flagged }
  index: 0,
  error: null,
  startedAt: null,
  m2Variant: null, // 'easy' | 'hard'
};

export function PracticeSessionProvider({ children }) {
  const [state, setState] = React.useState(EMPTY);
  const m2PromiseRef = React.useRef(null);
  // Always-fresh snapshot of state for use inside event handlers (avoids stale
  // closures and lets us navigate without calling setState side-effects in render).
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const start = React.useCallback(async (config) => {
    const mode = config.mode ?? 'drill';
    const section = config.section;
    m2PromiseRef.current = null;
    setState({ ...EMPTY, status: 'loading', mode, section, config });
    try {
      const isDrill = mode === 'drill';
      const limit = isDrill ? (config.count ?? 10) : SECTION_LEN[section] ?? 22;
      const questions = await fetchQuestions({
        section,
        category: isDrill ? config.category : undefined,
        difficulty: isDrill ? config.difficulty : 'all',
        limit,
      });
      setState((s) => ({
        ...s,
        status: 'active',
        phase: mode === 'mock-full' ? 'm1' : 'drill',
        modules: [{ key: 'm1', label: mode === 'drill' ? 'Drill' : 'Module 1', variant: null, questions }],
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

  // End the active module. For mock-full M1, route and load Module 2 then go to
  // the review screen; otherwise finalize and go to the report.
  const finishModule = React.useCallback((go) => {
    const s = stateRef.current;
    if (s.mode !== 'mock-full' || s.phase !== 'm1') {
      persistSession(s);
      setState((prev) => ({ ...prev, status: 'submitted', phase: 'done' }));
      go('score-report');
      return;
    }
    // route based on Module 1 performance
    const m1 = s.modules[0];
    const correct = m1.questions.filter((q) => isResponseCorrect(q, s.responses[q.id])).length;
    const variant = routeModule2(correct, m1.questions.length);
    // kick off Module 2 fetch
    m2PromiseRef.current = fetchQuestions({
      section: s.section,
      difficulty: variant === 'hard' ? 'hard' : 'easy',
      limit: SECTION_LEN[s.section] ?? 22,
    });
    setState((prev) => ({ ...prev, phase: 'review', m2Variant: variant }));
    go('module-review');
  }, []);

  const startModule2 = React.useCallback(async (go) => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const all = await m2PromiseRef.current;
      // A question can appear in both modules (both draw from the same pool);
      // drop any that were already in Module 1 so ids stay unique.
      const m1Ids = new Set((stateRef.current.modules[0]?.questions || []).map((q) => q.id));
      const questions = (all || []).filter((q) => !m1Ids.has(q.id));
      setState((s) => ({
        ...s,
        status: 'active',
        phase: 'm2',
        modules: [...s.modules.slice(0, 1), { key: 'm2', label: s.m2Variant === 'hard' ? 'Module 2B' : 'Module 2A', variant: s.m2Variant, questions }],
        activeModuleIndex: 1,
        index: 0,
      }));
      go(stateRef.current.section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Failed to load Module 2' }));
    }
  }, []);

  // ---- derived ----
  const activeModule = state.modules[state.activeModuleIndex] || null;
  const questions = activeModule?.questions || [];
  const current = questions[state.index] || null;
  const answeredCount = questions.filter((q) => state.responses[q.id]?.value).length;

  const buildResult = (qs) => buildReview(qs, state.responses);

  const moduleResult = React.useCallback((i) => {
    const m = state.modules[i];
    return m ? buildResult(m.questions) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.modules, state.responses]);

  const result = React.useMemo(() => {
    const allQs = state.modules.flatMap((m) => m.questions);
    if (!allQs.length) return null;
    const base = buildResult(allQs);
    const routedEasy = state.m2Variant === 'easy';
    const scaled = state.mode && state.mode !== 'drill'
      ? scaledSectionScore(base.correct, base.total, routedEasy)
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
  }, [state.modules, state.responses, state.mode, state.section, state.m2Variant, state.startedAt]);

  const value = {
    status: state.status,
    phase: state.phase,
    mode: state.mode,
    section: state.section,
    config: state.config,
    error: state.error,
    index: state.index,
    m2Variant: state.m2Variant,
    activeModule,
    questions,
    responses: state.responses,
    current,
    answeredCount,
    result,
    moduleResult,
    start,
    setValue,
    toggleFlag,
    goTo,
    next,
    prev,
    submit,
    finishModule,
    startModule2,
    reset,
    isResponseCorrect,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default PracticeSessionProvider;
