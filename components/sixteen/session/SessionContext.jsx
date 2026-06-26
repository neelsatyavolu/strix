'use client';

import React from 'react';

// Client-side practice session: fetches real College Board questions for the
// chosen config, tracks responses/flags as the student works, and computes a
// result on submit. (Server persistence is layered on once auth is wired.)

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
  if (!response) return false;
  if (question.type === 'spr') {
    const given = normalizeSpr(response.value);
    if (!given) return false;
    return (question.correct || []).some((k) => normalizeSpr(k) === given);
  }
  return (question.correct || []).includes(response.value);
}

export function PracticeSessionProvider({ children }) {
  const [state, setState] = React.useState({
    status: 'idle', // idle | loading | active | submitted | error
    config: null,
    questions: [],
    index: 0,
    responses: {}, // questionId -> { value, flagged }
    error: null,
    startedAt: null,
  });

  const start = React.useCallback(async (config) => {
    setState((s) => ({ ...s, status: 'loading', config, questions: [], index: 0, responses: {}, error: null }));
    try {
      const isDrill = (config.mode ?? 'drill') === 'drill';
      const limit = isDrill ? (config.count ?? 10) : SECTION_LEN[config.section] ?? 22;
      const params = new URLSearchParams({
        section: config.section,
        difficulty: config.difficulty ?? 'all',
        limit: String(limit),
      });
      if (isDrill && config.category) params.set('category', config.category);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const json = await res.json();
      if (!json.success || !json.data?.questions?.length) {
        throw new Error(json.error || 'No questions were returned. Try a different filter.');
      }
      setState((s) => ({
        ...s,
        status: 'active',
        questions: json.data.questions,
        index: 0,
        responses: {},
        startedAt: Date.now(),
      }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err instanceof Error ? err.message : 'Failed to load questions' }));
    }
  }, []);

  const setValue = React.useCallback((value) => {
    setState((s) => {
      const q = s.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      return { ...s, responses: { ...s.responses, [q.id]: { ...prev, value } } };
    });
  }, []);

  const toggleFlag = React.useCallback(() => {
    setState((s) => {
      const q = s.questions[s.index];
      if (!q) return s;
      const prev = s.responses[q.id] || {};
      return { ...s, responses: { ...s.responses, [q.id]: { ...prev, flagged: !prev.flagged } } };
    });
  }, []);

  const goTo = React.useCallback((i) => {
    setState((s) => ({ ...s, index: Math.max(0, Math.min(s.questions.length - 1, i)) }));
  }, []);

  const next = React.useCallback(() => {
    setState((s) => ({ ...s, index: Math.min(s.questions.length - 1, s.index + 1) }));
  }, []);

  const prev = React.useCallback(() => {
    setState((s) => ({ ...s, index: Math.max(0, s.index - 1) }));
  }, []);

  const submit = React.useCallback(() => {
    setState((s) => ({ ...s, status: 'submitted' }));
  }, []);

  const reset = React.useCallback(() => {
    setState({ status: 'idle', config: null, questions: [], index: 0, responses: {}, error: null, startedAt: null });
  }, []);

  // ---- derived ----
  const current = state.questions[state.index] || null;
  const answeredCount = state.questions.filter((q) => state.responses[q.id]?.value).length;

  const result = React.useMemo(() => {
    if (!state.questions.length) return null;
    const review = state.questions.map((q) => {
      const r = state.responses[q.id];
      return { question: q, response: r || null, isCorrect: isResponseCorrect(q, r) };
    });
    const correct = review.filter((x) => x.isCorrect).length;
    const total = state.questions.length;
    const byDomainMap = new Map();
    for (const x of review) {
      const key = x.question.domain;
      const e = byDomainMap.get(key) || { domain: key, label: x.question.domainLabel, correct: 0, total: 0 };
      e.total += 1;
      if (x.isCorrect) e.correct += 1;
      byDomainMap.set(key, e);
    }
    return {
      section: state.config?.section,
      mode: state.config?.mode,
      correct,
      total,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      byDomain: [...byDomainMap.values()],
      review,
      elapsedMs: state.startedAt ? Date.now() - state.startedAt : 0,
    };
  }, [state.questions, state.responses, state.config, state.startedAt]);

  const value = {
    ...state,
    current,
    answeredCount,
    result,
    start,
    setValue,
    toggleFlag,
    goTo,
    next,
    prev,
    submit,
    reset,
    isResponseCorrect,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export default PracticeSessionProvider;
