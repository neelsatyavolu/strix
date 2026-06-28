'use client';

import React from 'react';

// Shared client hooks over the Vercel server's stats/sessions endpoints.
// Each accepts an optional `studentId` — when set (and the caller is that
// student's tutor) the endpoint returns the student's data instead of the
// caller's own. Omitted/null means "me".

function withStudent(path, studentId) {
  if (!studentId) return path;
  return `${path}${path.includes('?') ? '&' : '?'}studentId=${encodeURIComponent(studentId)}`;
}

// Stale-while-revalidate cache, keyed by request URL. Screens mount fresh on
// every navigation, so without this each visit re-fetches from scratch and
// renders zero-valued data until the response lands. With it, a revisit shows
// the last-known value immediately (no flash of zeroes) while it revalidates.
const cache = new Map();

export function useStats(studentId = null, scope = null) {
  const base = scope ? `/api/stats?scope=${encodeURIComponent(scope)}` : '/api/stats';
  const key = withStudent(base, studentId);
  const [stats, setStats] = React.useState(() => cache.get(key) ?? null);
  const [loading, setLoading] = React.useState(() => !cache.has(key));
  React.useEffect(() => {
    let on = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStats(cache.get(key) ?? null);
    setLoading(!cache.has(key));
    fetch(key)
      .then((r) => r.json())
      .then((j) => { if (on) { if (j?.success) { cache.set(key, j.data); setStats(j.data); } setLoading(false); } })
      .catch(() => on && setLoading(false));
    return () => { on = false; };
  }, [key]);
  return { stats, loading };
}

export function useHistory(limit = 40, studentId = null) {
  const [attempts, setAttempts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let on = true;
    fetch(withStudent(`/api/stats/history?limit=${limit}`, studentId))
      .then((r) => r.json())
      .then((j) => { if (on) { if (j?.success) setAttempts(j.data.attempts || []); setLoading(false); } })
      .catch(() => on && setLoading(false));
    return () => { on = false; };
  }, [limit, studentId]);
  return { attempts, loading };
}

// One-shot history lookup used by the tutor's tool loop. Accepts the filters
// the model requested ({ section, onlyWrong, q, limit, offset, since, until }).
export async function fetchHistory(args = {}) {
  const p = new URLSearchParams();
  if (args.limit) p.set('limit', String(Math.min(200, Math.max(1, Number(args.limit) || 40))));
  if (args.offset) p.set('offset', String(Math.max(0, Number(args.offset) || 0)));
  if (args.section === 'rw' || args.section === 'math') p.set('section', args.section);
  if (args.onlyWrong) p.set('onlyWrong', '1');
  if (args.q) p.set('q', String(args.q).slice(0, 80));
  if (args.since) p.set('since', String(args.since).slice(0, 10));
  if (args.until) p.set('until', String(args.until).slice(0, 10));
  if (args.studentId) p.set('studentId', String(args.studentId));
  try {
    const r = await fetch(`/api/stats/history?${p.toString()}`);
    const j = await r.json();
    return j?.success ? (j.data.attempts || []) : [];
  } catch {
    return [];
  }
}

export function useSessions(limit = 50, studentId = null) {
  const key = withStudent(`/api/sessions?limit=${limit}`, studentId);
  const [sessions, setSessions] = React.useState(() => cache.get(key) ?? []);
  const [loading, setLoading] = React.useState(() => !cache.has(key));
  React.useEffect(() => {
    let on = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(cache.get(key) ?? []);
    setLoading(!cache.has(key));
    fetch(key)
      .then((r) => r.json())
      .then((j) => { if (on) { if (j?.success) { cache.set(key, j.data.sessions || []); setSessions(j.data.sessions || []); } setLoading(false); } })
      .catch(() => on && setLoading(false));
    return () => { on = false; };
  }, [key]);
  return { sessions, loading };
}
