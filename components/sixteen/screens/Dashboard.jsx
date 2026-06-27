'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';

// Dashboard — landing screen, backed by the user's real practice data.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function relTime(iso) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const day = 86400000;
  if (diff < 3600000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < day) return `${Math.round(diff / 3600000)}h ago`;
  if (diff < 2 * day) return 'Yesterday';
  return `${Math.round(diff / day)} days ago`;
}

function sessionLabel(s) {
  const sec = SECTION_LABEL[s.section] || s.section;
  if (s.mode === 'drill') {
    const cat = s.config?.category;
    return cat ? `${sec} · drill` : `${sec} · drill`;
  }
  if (s.mode === 'mock-m1') return `${sec} · Module 1`;
  return `${sec} · Full section`;
}

function Dashboard({ go, studentId = null, readOnly = false }) {
  const { Card, Button, Badge, ScoreBadge, AccuracyRing, StatCard } = SixteenNS;
  const { displayName } = useProfile();
  const firstName = (displayName || '').split(' ')[0] || 'there';

  const [stats, setStats] = React.useState(null);
  const [sessions, setSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    const q = studentId ? `&studentId=${encodeURIComponent(studentId)}` : '';
    Promise.all([
      fetch(`/api/stats${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''}`).then((r) => r.json()).catch(() => null),
      fetch(`/api/sessions?limit=6${q}`).then((r) => r.json()).catch(() => null),
    ]).then(([st, se]) => {
      if (!alive) return;
      if (st?.success) setStats(st.data);
      if (se?.success) setSessions(se.data.sessions || []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [studentId]);

  const scores = stats?.scores || { rw: null, math: null, total: null };
  const totals = stats?.sectionTotals || { rw: { done: 0, correct: 0 }, math: { done: 0, correct: 0 } };
  const lastAcc = stats?.lastAccuracy || { rw: null, math: null };
  const cats = stats?.categories || { rw: [], math: [] };
  const acc = (sec) => (totals[sec].done ? Math.round((totals[sec].correct / totals[sec].done) * 100) : 0);
  const topCat = (sec) => (cats[sec] || []).slice().sort((a, b) => b.done - a.done)[0];
  const hasData = (stats?.sessionCount || 0) > 0;

  return (
    <div style={{ padding: '28px 36px', maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>{greeting()}, {firstName}.</h1>
          <p style={{ margin: '4px 0 0', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
            {loading
              ? 'Loading your progress…'
              : hasData
                ? `You've answered ${totals.rw.done + totals.math.done} questions. Keep the streak going.`
                : 'Start your first practice session to see your progress here.'}
          </p>
        </div>
      </div>

      <Card padding="lg" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {scores.total != null ? (
            <>
              <ScoreBadge value={scores.total} label="Estimated total" />
              <div style={{ width: 1, height: 56, background: 'var(--border-1)' }} />
              {scores.rw != null && <ScoreBadge value={scores.rw} max={800} label="Reading & Writing" domain="rw" size="md" />}
              {scores.math != null && <ScoreBadge value={scores.math} max={800} label="Math" domain="math" size="md" />}
            </>
          ) : (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: 'var(--role-title-md)', color: 'var(--text-primary)' }}>No estimated score yet</div>
              <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginTop: 2 }}>
                Finish a full scored section to get a 1600-scale estimate.
              </div>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }} />
          {!readOnly && (
            <Button variant="primary" size="lg" onClick={() => go('practice-setup')} icon={<Icon name="play" style={{ width: 14, height: 14 }} />}>
              New session
            </Button>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {['rw', 'math'].map((sec) => {
          const tc = topCat(sec);
          return (
            <Card key={sec} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>{SECTION_LABEL[sec]}</span>
                <Badge variant={sec} dot>{sec === 'rw' ? 'R&W' : 'Math'}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                <AccuracyRing value={acc(sec)} size={64} color={sec === 'rw' ? 'var(--rw-color)' : 'var(--math-color)'} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <StatCard label="Questions done" value={totals[sec].done} size="sm" />
                  <StatCard label="Last session" value={lastAcc[sec] != null ? String(lastAcc[sec]) : '—'} unit={lastAcc[sec] != null ? '%' : ''} size="sm" sublabel={tc ? tc.label : 'No drills yet'} />
                </div>
              </div>
              <Button variant="outline" fullWidth disabled={readOnly} iconRight={<Icon name="chevron-right" style={{ width: 14, height: 14 }} />} onClick={() => !readOnly && go('practice-setup', { domain: sec })}>
                Drill {SECTION_LABEL[sec]}
              </Button>
            </Card>
          );
        })}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ margin: 0, font: 'var(--role-title-md)' }}>Recent sessions</h2>
          <button onClick={() => go('stats')} style={{ font: 'var(--role-label)', color: 'var(--text-link)', background: 'transparent', border: 0, cursor: 'pointer' }}>View all stats →</button>
        </div>
        <Card padding="none" style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 540 }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px 16px', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>
                {loading ? 'Loading…' : 'No sessions yet. Start a drill or a full section to see it here.'}
              </div>
            ) : sessions.map((s, i) => (
              <div key={s.id} style={{
                display: 'grid', gridTemplateColumns: 'auto minmax(160px, 1fr) auto auto auto', alignItems: 'center',
                gap: 14, padding: '12px 16px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
              }}>
                <Badge variant={s.section} dot>{s.section === 'rw' ? 'R&W' : 'Math'}</Badge>
                <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sessionLabel(s)}</span>
                <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{relTime(s.created_at)}</span>
                <span style={{ font: 'var(--role-numeric)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{s.score_total} qs</span>
                <span style={{ font: 'var(--role-numeric)', color: (s.accuracy ?? 0) >= 75 ? 'var(--success)' : 'var(--warning)', whiteSpace: 'nowrap' }}>{s.accuracy ?? 0}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
