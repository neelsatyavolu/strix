'use client';
import React from 'react';

// Navigation — in-app history for the single-page shell.
//
// The app is one client route (/app) that swaps screens. This keeps a stack of
// { view, params } entries mirrored into window.history so the in-app Back
// button, the browser's back/forward, and a reload all behave.
//
//   go(view, params)   push (or replace, inside a practice flow — see below)
//   replace(view, p)   swap the current entry
//   reset(view, p)     start a fresh stack (sidebar items, Home)
//   back(fallback)     pop; with an empty stack, reset to `fallback`

// Screens that make up one practice run. Moving between them replaces the
// entry, so Back never lands inside a finished test.
const FLOW = new Set(['rw-question', 'math-question', 'exam-break', 'score-report', 'exam-report']);

// Roots: navigating here always starts a fresh stack.
const ROOTS = new Set(['dashboard', 'onboarding']);

// Screens safe to restore from the URL on reload (no live session needed).
const RESTORABLE = new Set([
  'dashboard', 'practice', 'practice-setup', 'question-bank', 'review', 'plan',
  'progress', 'stats', 'sessions', 'practice-tests', 'practice-modules', 'practice-sections',
  'category-detail', 'session-detail', 'test-review', 'vocabulary', 'tutor', 'tutor-invite',
  'tutor-chat', 'student-assignments', 'tutor-assignments', 'settings', 'dev',
]);

function hashFor({ view, params }) {
  const q = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (typeof v === 'string' || typeof v === 'number') q.set(k, String(v));
  });
  const qs = q.toString();
  return `#/${view}${qs ? `?${qs}` : ''}`;
}

function readHash() {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/^#\/([a-z-]+)(?:\?(.*))?$/);
  if (!m || !RESTORABLE.has(m[1])) return null;
  return { view: m[1], params: Object.fromEntries(new URLSearchParams(m[2] || '')) };
}

function writeHistory(stack, mode) {
  if (typeof window === 'undefined') return;
  const top = stack[stack.length - 1];
  const url = `${window.location.pathname}${window.location.search}${hashFor(top)}`;
  const state = { ...(window.history.state || {}), strixStack: stack };
  if (mode === 'push') window.history.pushState(state, '', url);
  else window.history.replaceState(state, '', url);
}

export function useNavigation(initialView) {
  const [stack, setStack] = React.useState(() => {
    const restored = initialView === 'onboarding' ? null : readHash();
    return [restored || { view: initialView, params: {} }];
  });
  const stackRef = React.useRef(stack);

  const commit = React.useCallback((next, mode) => {
    stackRef.current = next;
    setStack(next);
    writeHistory(next, mode);
  }, []);

  // Seed the current history entry so the first Back has a stack to restore.
  React.useEffect(() => {
    writeHistory(stackRef.current, 'replace');
    const onPop = (e) => {
      const next = e.state?.strixStack;
      if (!Array.isArray(next) || next.length === 0) return;
      stackRef.current = next;
      setStack(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const reset = React.useCallback((view, params = {}) => {
    commit([{ view, params }], 'push');
  }, [commit]);

  const replace = React.useCallback((view, params = {}) => {
    const cur = stackRef.current;
    commit([...cur.slice(0, -1), { view, params }], 'replace');
  }, [commit]);

  const go = React.useCallback((view, params = {}) => {
    const cur = stackRef.current;
    const top = cur[cur.length - 1];
    if (ROOTS.has(view)) { commit([{ view, params }], 'push'); return; }
    if (FLOW.has(top.view) && FLOW.has(view)) { commit([...cur.slice(0, -1), { view, params }], 'replace'); return; }
    commit([...cur, { view, params }], 'push');
  }, [commit]);

  const back = React.useCallback((fallback = 'dashboard', fallbackParams = {}) => {
    if (stackRef.current.length > 1) window.history.back();
    else commit([{ view: fallback, params: fallbackParams }], 'replace');
  }, [commit]);

  const top = stack[stack.length - 1];
  const prev = stack.length > 1 ? stack[stack.length - 2] : null;
  return {
    view: top.view,
    params: top.params || {},
    prevView: prev?.view || null,
    canGoBack: stack.length > 1,
    go, replace, reset, back,
  };
}

const NavContext = React.createContext(null);

export function NavProvider({ value, children }) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

/** useNav — { view, params, prevView, canGoBack, go, replace, reset, back } */
export function useNav() {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used inside NavProvider');
  return ctx;
}
