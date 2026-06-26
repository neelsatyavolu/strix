'use client';

import React from 'react';

// Shared client hooks over the Vercel server's stats/sessions endpoints.

export function useStats() {
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let on = true;
    fetch('/api/stats')
      .then((r) => r.json())
      .then((j) => { if (on) { if (j?.success) setStats(j.data); setLoading(false); } })
      .catch(() => on && setLoading(false));
    return () => { on = false; };
  }, []);
  return { stats, loading };
}

export function useSessions(limit = 50) {
  const [sessions, setSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let on = true;
    fetch(`/api/sessions?limit=${limit}`)
      .then((r) => r.json())
      .then((j) => { if (on) { if (j?.success) setSessions(j.data.sessions || []); setLoading(false); } })
      .catch(() => on && setLoading(false));
    return () => { on = false; };
  }, [limit]);
  return { sessions, loading };
}
