'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useStats, useSessions } from '@/lib/data/hooks';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { SECTION_SHORT, relTime, StatCardLite, EmptyState } from '@/components/sixteen/stats/shared';

// PracticeAnalysis — one shared screen behind the three "You" tabs. Each tab
// scopes to one practice type and shows: a summary, where you're losing points
// (weakest domains for that type), and the list of past attempts. With no data
// it suggests taking a diagnostic (a full SAT).

const KIND = {
  tests:    { title: 'Practice Tests',    subtitle: 'Your completed full SATs — estimated 400–1600.',     scope: 'tests',    emptyTitle: 'No full SATs yet' },
  sections: { title: 'Practice Sections', subtitle: 'Your completed full sections — Module 1 + adaptive Module 2, estimated /800.', scope: 'sections', emptyTitle: 'No full sections yet' },
  modules:  { title: 'Practice Modules',  subtitle: 'Your completed single timed modules.',             scope: 'modules',  emptyTitle: 'No modules yet' },
};

const HOUR = 3600 * 1000;

function isExam(s) { return !!s.config?.exam; }

function filterByKind(sessions, kind) {
  if (kind === 'modules') return sessions.filter((s) => s.mode === 'mock-m1');
  if (kind === 'sections') return sessions.filter((s) => s.mode === 'mock-full' && !isExam(s));
  return sessions.filter((s) => s.mode === 'mock-full' && isExam(s)); // tests
}

function buildTest(key, halves) {
  const rw = halves.find((h) => h.section === 'rw') || null;
  const math = halves.find((h) => h.section === 'math') || null;
  const composite = rw?.scaled_score != null && math?.scaled_score != null ? rw.scaled_score + math.scaled_score : null;
  const at = Math.max(...halves.map((h) => new Date(h.created_at).getTime()));
  return { key, rw, math, composite, at };
}

// Pair a full SAT's two halves. Prefer the shared config.examId (written for
// tests taken after that change shipped); fall back to opposite-section halves
// taken within a few hours of each other for older data.
function pairTests(rows) {
  const byId = new Map();
  const loose = [];
  for (const s of rows) {
    const id = s.config?.examId;
    if (id) { if (!byId.has(id)) byId.set(id, []); byId.get(id).push(s); }
    else loose.push(s);
  }
  const tests = [...byId.entries()].map(([id, halves]) => buildTest(id, halves));

  loose.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const used = new Set();
  for (let i = 0; i < loose.length; i++) {
    if (used.has(i)) continue;
    const a = loose[i];
    const halves = [a];
    used.add(i);
    for (let j = i + 1; j < loose.length; j++) {
      if (used.has(j)) continue;
      const b = loose[j];
      if (b.section !== a.section && Math.abs(new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) <= 3 * HOUR) {
        halves.push(b); used.add(j); break;
      }
    }
    tests.push(buildTest(`ts-${a.id}`, halves));
  }
  return tests.sort((a, b) => b.at - a.at);
}

function summaryFor(kind, attempts, tests) {
  if (kind === 'tests') {
    const composites = tests.map((t) => t.composite).filter((v) => v != null);
    return [
      { label: 'Tests', value: tests.length },
      { label: 'Best total', value: composites.length ? Math.max(...composites) : '—' },
      { label: 'Latest', value: tests[0]?.composite ?? '—' },
    ];
  }
  if (kind === 'sections') {
    const scaled = attempts.map((s) => s.scaled_score).filter((v) => v != null);
    return [
      { label: 'Sections', value: attempts.length },
      { label: 'Best estimate', value: scaled.length ? Math.max(...scaled) : '—' },
      { label: 'Latest', value: attempts[0]?.scaled_score ?? '—' },
    ];
  }
  const accs = attempts.map((s) => s.accuracy).filter((v) => v != null);
  const avg = accs.length ? Math.round(accs.reduce((a, v) => a + v, 0) / accs.length) : null;
  return [
    { label: 'Modules', value: attempts.length },
    { label: 'Avg. accuracy', value: avg != null ? `${avg}%` : '—' },
    { label: 'Best accuracy', value: accs.length ? `${Math.max(...accs)}%` : '—' },
  ];
}

function PracticeAnalysis({ go, kind, studentId = null, readOnly = false }) {
  const { Card } = SixteenNS;
  const cfg = KIND[kind] ?? KIND.modules;
  const { sessions, loading } = useSessions(50, studentId);
  const { stats } = useStats(studentId, cfg.scope);

  const attempts = React.useMemo(() => {
    const filtered = filterByKind(sessions, kind);
    // sessions come newest-first; keep that for sections/modules lists.
    return [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sessions, kind]);
  const tests = React.useMemo(() => (kind === 'tests' ? pairTests(attempts) : []), [attempts, kind]);

  const isEmpty = kind === 'tests' ? tests.length === 0 : attempts.length === 0;

  return (
    <div style={{padding: '28px 36px'}}>
      <h1 style={{margin:'0 0 4px', font:'var(--role-title-lg)'}}>{cfg.title}</h1>
      <p style={{margin:'0 0 20px', font:'var(--role-body-lg)', color:'var(--text-secondary)'}}>{cfg.subtitle}</p>

      {loading ? (
        <div style={{padding:'48px 0', textAlign:'center', font:'var(--role-body)', color:'var(--text-tertiary)'}}>Loading…</div>
      ) : isEmpty ? (
        <DiagnosticEmpty cfg={cfg} go={go} readOnly={readOnly} />
      ) : (
        <>
          {kind === 'tests' && <LastScoreHeader test={tests[0]} go={go} />}

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginBottom: 16}}>
            {summaryFor(kind, attempts, tests).map((c) => (
              <Card key={c.label} padding="md"><StatCardLite label={c.label} value={c.value} /></Card>
            ))}
          </div>

          <WeakAreas stats={stats} go={go} />

          {kind === 'tests'
            ? <TestList tests={tests} go={go} />
            : <AttemptList attempts={attempts} kind={kind} go={go} />}
        </>
      )}
    </div>
  );
}

function WeakAreas({ stats, go }) {
  const { Card, AccuracyRing } = SixteenNS;
  const sectionColor = (section) => (section === 'math' ? 'var(--math-color)' : 'var(--rw-color)');
  const cats = React.useMemo(() => {
    const rw = (stats?.categories?.rw ?? []).map((c) => ({ ...c, section: 'rw' }));
    const math = (stats?.categories?.math ?? []).map((c) => ({ ...c, section: 'math' }));
    return [...rw, ...math].filter((c) => c.done > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
  }, [stats]);

  if (!cats.length) return null;

  return (
    <Card padding="lg" style={{marginBottom: 16}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12}}>
        <h2 style={{margin:0, font:'var(--role-title-sm)'}}>Where you&rsquo;re losing points</h2>
        <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>Weakest domains in this mode</span>
      </div>
      <div style={{display:'flex', flexDirection:'column'}}>
        {cats.map((c, i) => {
          const clickable = !!c.code;
          return (
            <button
              key={`${c.section}-${c.id}`}
              disabled={!clickable}
              onClick={() => clickable && go('category-detail', { section: c.section, domain: c.code, label: c.label })}
              style={{
                display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap: 14, alignItems:'center',
                padding:'12px 6px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
                background:'transparent', border:0, cursor: clickable ? 'pointer' : 'default', textAlign:'left', width:'100%',
              }}
            >
              <AccuracyRing value={c.accuracy} size={40} stroke={5} color={sectionColor(c.section)} />
              <div style={{display:'flex', flexDirection:'column'}}>
                <span style={{font:'var(--role-body)', color:'var(--text-primary)'}}>{c.label}</span>
                <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>
                  {SECTION_SHORT[c.section]} · {c.done} answered{clickable ? ' · view detail' : ''}
                </span>
              </div>
              <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)'}}>{c.accuracy}%</span>
              <Icon name="chevron-right" style={{width:14, height:14, color: clickable ? 'var(--text-tertiary)' : 'transparent'}}/>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function AttemptList({ attempts, kind, go }) {
  const { Card, Badge } = SixteenNS;
  return (
    <Card padding="none">
      <div style={{
        display:'grid', gridTemplateColumns:'130px minmax(160px, 1fr) 90px 90px 24px', gap: 12, alignItems:'center',
        padding:'10px 16px', font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)',
        color:'var(--text-tertiary)', borderBottom:'1px solid var(--border-1)',
      }}>
        <span>When</span><span>Section</span>
        <span style={{textAlign:'right'}}>{kind === 'sections' ? 'Estimate' : 'Accuracy'}</span>
        <span style={{textAlign:'right'}}>{kind === 'sections' ? 'Accuracy' : 'Correct'}</span>
        <span/>
      </div>
      {attempts.map((s, i) => (
        <button key={s.id} onClick={() => go('session-detail', { id: s.id })} style={{
          display:'grid', gridTemplateColumns:'130px minmax(160px, 1fr) 90px 90px 24px', gap: 12, alignItems:'center',
          padding:'12px 16px', background:'transparent', border:0, borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
          cursor:'pointer', textAlign:'left', width:'100%',
        }}>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{relTime(s.created_at)}</span>
          <Badge variant={s.section} dot size="sm">{SECTION_SHORT[s.section] ?? s.section}</Badge>
          <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>
            {kind === 'sections' ? (s.scaled_score ?? '—') : `${s.accuracy}%`}
          </span>
          <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)', textAlign:'right'}}>
            {kind === 'sections' ? `${s.accuracy}%` : `${s.score_correct}/${s.score_total}`}
          </span>
          <Icon name="chevron-right" style={{width:14, height:14, color:'var(--text-tertiary)'}}/>
        </button>
      ))}
    </Card>
  );
}

function LastScoreHeader({ test, go }) {
  const { Card, Button, ScoreBadge } = SixteenNS;
  if (!test) return null;
  const { rw, math, composite, at } = test;
  const canView = !!(rw || math);
  return (
    <Card padding="lg" style={{ marginBottom: 16 }}>
      <div style={{ display:'flex', gap: 24, alignItems:'center', flexWrap:'wrap' }}>
        {composite != null ? (
          <ScoreBadge value={composite} label="Last score" />
        ) : (
          <div>
            <div style={{ font:'var(--role-title-md)', color:'var(--text-primary)' }}>Last test incomplete</div>
            <div style={{ font:'var(--role-body)', color:'var(--text-secondary)', marginTop: 2 }}>Finish both sections for a 1600-scale score.</div>
          </div>
        )}
        {composite != null && <div style={{ width: 1, height: 56, background:'var(--border-1)' }} />}
        {rw?.scaled_score != null && <ScoreBadge value={rw.scaled_score} max={800} label="Reading & Writing" domain="rw" size="md" />}
        {math?.scaled_score != null && <ScoreBadge value={math.scaled_score} max={800} label="Math" domain="math" size="md" />}
        <div style={{ flex: 1, minWidth: 0 }} />
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap: 8 }}>
          <span style={{ font:'var(--role-caption)', color:'var(--text-tertiary)' }}>{relTime(new Date(at).toISOString())}</span>
          {canView && (
            <Button variant="secondary" onClick={() => go('test-review', { rwId: rw?.id, mathId: math?.id })}>View full review</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function TestList({ tests, go }) {
  const { Card, Button } = SixteenNS;
  const cols = '130px 90px 1fr 1fr auto';
  return (
    <Card padding="none">
      <div style={{
        display:'grid', gridTemplateColumns: cols, gap: 12, alignItems:'center',
        padding:'10px 16px', font:'var(--role-eyebrow)', textTransform:'uppercase', letterSpacing:'var(--tracking-caps)',
        color:'var(--text-tertiary)', borderBottom:'1px solid var(--border-1)',
      }}>
        <span>When</span><span style={{textAlign:'right'}}>Total</span><span>Reading &amp; Writing</span><span>Math</span><span/>
      </div>
      {tests.map((t, i) => (
        <div key={t.key} style={{
          display:'grid', gridTemplateColumns: cols, gap: 12, alignItems:'center',
          padding:'12px 16px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
        }}>
          <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{relTime(new Date(t.at).toISOString())}</span>
          <span style={{font:'var(--role-numeric)', fontWeight:600, color:'var(--text-primary)', textAlign:'right'}}>{t.composite ?? '—'}</span>
          <HalfCell half={t.rw} label="R&W" go={go} />
          <HalfCell half={t.math} label="Math" go={go} />
          <Button variant="secondary" size="sm" disabled={!(t.rw || t.math)} onClick={() => go('test-review', { rwId: t.rw?.id, mathId: t.math?.id })}>View</Button>
        </div>
      ))}
    </Card>
  );
}

function HalfCell({ half, label, go }) {
  if (!half) {
    return <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{label} — not taken</span>;
  }
  return (
    <button onClick={() => go('session-detail', { id: half.id })} style={{
      display:'flex', alignItems:'center', gap: 8, background:'transparent', border:0, cursor:'pointer', textAlign:'left', padding: 0,
    }}>
      <span style={{font:'var(--role-numeric)', color:'var(--text-secondary)'}}>{half.scaled_score ?? '—'}</span>
      <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)'}}>{half.accuracy}% · view</span>
      <Icon name="chevron-right" style={{width:13, height:13, color:'var(--text-tertiary)'}}/>
    </button>
  );
}

function DiagnosticEmpty({ cfg, go, readOnly }) {
  const { Button } = SixteenNS;
  const session = usePracticeSession();
  const start = () => {
    if (readOnly) return;
    session.start({ mode: 'mock-exam' });
    go('rw-question', { kind: 'module' }); // a full SAT always opens with R&W
  };
  return (
    <EmptyState
      title={cfg.emptyTitle}
      hint={readOnly
        ? 'Nothing here yet — this student hasn’t taken one.'
        : 'Take a diagnostic full SAT to see your strengths and where you’re losing points.'}
      action={readOnly ? null : <Button variant="primary" size="lg" onClick={start}>Take a diagnostic</Button>}
    />
  );
}

export default PracticeAnalysis;
