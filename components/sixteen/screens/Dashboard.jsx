'use client';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useStats, useSessions } from '@/lib/data/hooks';
import { CATEGORY_TO_DOMAIN, domainLabel } from '@/lib/cb/domains';

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
    const code = CATEGORY_TO_DOMAIN[s.config?.category];
    const cat = code ? domainLabel(s.section, code) : null;
    return cat ? `${sec} · ${cat}` : `${sec} · drill`;
  }
  if (s.mode === 'mock-m1') return `${sec} · Module 1`;
  return `${sec} · Full section`;
}

// Caption under "Last session" — describes what the last session was, so a full
// module/section/SAT reads as such instead of being mislabelled with a topic.
function lastSessionLabel(ls, section) {
  if (!ls) return 'No sessions yet';
  if (ls.mode === 'mock-m1') return 'Module 1';
  if (ls.mode === 'mock-full') return ls.exam ? 'Full SAT' : 'Full section';
  if (ls.category) {
    const code = CATEGORY_TO_DOMAIN[ls.category];
    const label = code ? domainLabel(section, code) : null;
    if (label) return label;
  }
  return 'Drill';
}

// Format a section-estimate delta as a signed badge string ('+20' / '-10'),
// suppressing it when there's no movement or no prior estimate to compare.
function trendBadge(score, delta) {
  if (score == null || !delta) return undefined;
  return delta > 0 ? `+${delta}` : String(delta);
}

  // Placeholder shown on first load so the estimate/section cards never flash
// zero-valued data before the real stats arrive.
function DashboardSkeleton() {
  const { Card } = SixteenNS;
  const block = { background: 'var(--sunken)', borderRadius: 6, animation: 'dash-pulse 1.2s ease-in-out infinite' };
  return (
    <>
      <style>{`@keyframes dash-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      <Card padding="lg" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ ...block, width: 120, height: 40 }} />
          <div style={{ width: 1, height: 56, background: 'var(--border-1)' }} />
          <div style={{ ...block, width: 90, height: 32 }} />
          <div style={{ ...block, width: 90, height: 32 }} />
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {[0, 1].map((i) => (
          <Card key={i} padding="lg">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ ...block, width: 64, height: 64, borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <div style={{ ...block, width: '70%', height: 14 }} />
                <div style={{ ...block, width: '50%', height: 14 }} />
              </div>
            </div>
            <div style={{ ...block, width: '100%', height: 36 }} />
          </Card>
        ))}
      </div>
    </>
  );
}

function Dashboard({ go, studentId = null, readOnly = false }) {
  const { Card, Button, Badge, ScoreBadge, AccuracyRing, StatCard } = SixteenNS;
  const { displayName } = useProfile();
  const firstName = (displayName || '').split(' ')[0] || 'there';

  const session = usePracticeSession();
  const { stats, loading } = useStats(studentId);
  const { sessions } = useSessions(6, studentId);

  const scores = stats?.scores || { rw: null, math: null, total: null };
  const totals = stats?.sectionTotals || { rw: { done: 0, correct: 0 }, math: { done: 0, correct: 0 } };
  const lastSession = stats?.lastSession || { rw: null, math: null };
  const trend = stats?.trend || { rw: null, math: null };
  const focus = stats?.focus || [];
  const acc = (sec) => (totals[sec].done ? Math.round((totals[sec].correct / totals[sec].done) * 100) : 0);
  const hasData = (stats?.sessionCount || 0) > 0;

  // One-click launch into a focused drill on a recommended weak skill.
  const launchFocus = (f) => {
    if (readOnly) return;
    session.start({ section: f.section, mode: 'drill', category: f.id, difficulty: 'all', count: 10 });
    go(f.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  return (
    <div style={{ padding: '28px 36px' }}>
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

      {loading ? (
        <DashboardSkeleton />
      ) : (
      <>
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
                Finish a full section to get a 1600-scale estimate.
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
          const ls = lastSession[sec];
          const sc = scores[sec];
          return (
            <Card key={sec} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>{SECTION_LABEL[sec]}</span>
                <Badge variant={sec} dot>{sec === 'rw' ? 'R&W' : 'Math'}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
                <AccuracyRing value={acc(sec)} size={64} color={sec === 'rw' ? 'var(--rw-color)' : 'var(--math-color)'} />
                <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', flex: 1 }}>
                  <StatCard label="Est. score" value={sc != null ? String(sc) : '—'} trend={trendBadge(sc, trend[sec])} domain={sec} size="sm" />
                  <StatCard label="Questions done" value={totals[sec].done} size="sm" />
                  <StatCard label="Last session" value={ls?.accuracy != null ? String(ls.accuracy) : '—'} unit={ls?.accuracy != null ? '%' : ''} size="sm" sublabel={lastSessionLabel(ls, sec)} />
                </div>
              </div>
              <Button variant="outline" fullWidth disabled={readOnly} iconRight={<Icon name="chevron-right" style={{ width: 14, height: 14 }} />} onClick={() => !readOnly && go('practice-setup', { domain: sec })}>
                Drill {SECTION_LABEL[sec]}
              </Button>
            </Card>
          );
        })}
      </div>

      {focus.length > 0 && (
        <Card padding="lg" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ margin: 0, font: 'var(--role-title-md)' }}>Skills to focus on</h2>
            <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>From your recent practice</span>
          </div>
          <p style={{ margin: '0 0 14px', font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
            These are where your recent accuracy is lowest. A quick drill is the fastest way to bring them up.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {focus.map((f) => (
              <div key={`${f.section}-${f.id}`} style={{
                display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', alignItems: 'center', gap: 12,
                padding: '12px 14px', background: 'var(--sunken)', borderRadius: 'var(--radius-md)',
              }}>
                <AccuracyRing value={f.accuracy ?? 0} size={40} stroke={5} color={f.section === 'rw' ? 'var(--rw-color)' : 'var(--math-color)'} />
                <Badge variant={f.section} dot>{f.section === 'rw' ? 'R&W' : 'Math'}</Badge>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
                  <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{f.accuracy ?? 0}% recent · {f.attempts} answered</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={readOnly}
                  icon={<Icon name="play" style={{ width: 12, height: 12 }} />}
                  onClick={() => launchFocus(f)}
                >
                  Practice
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      </>
      )}

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
