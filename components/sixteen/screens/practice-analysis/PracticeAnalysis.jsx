'use client';
import React from 'react';
import { Button, Card, EmptyState, Metric, Section, SegmentedControl } from '@/components/sixteen';
import { useStats, useSessions } from '@/lib/data/hooks';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { isExam, pairTests, relTime, recentAcc } from '@/components/sixteen/stats/shared';
import { DomainList } from '../progress/DomainList';
import { MetricsSkeleton, ListSkeleton } from '../progress/Skeletons';
import { AttemptList, TestList } from './AttemptLists';
import p from '../progress/Progress.module.css';

// PracticeAnalysis — the Full-length tab of Progress. A segmented control picks
// the practice type (modules / sections / full SATs); each shows a summary,
// where you're losing points (weakest domains for that type), and the list of
// past attempts. With no data it suggests taking a diagnostic (a full SAT).

const KINDS = [
  { value: 'modules', label: 'Modules' },
  { value: 'sections', label: 'Sections' },
  { value: 'tests', label: 'Full SATs' },
];

const KIND = {
  tests:    { blurb: 'Complete practice SATs, scored 400–1600.', scope: 'tests', noun: 'full SATs', emptyTitle: 'No full SATs yet' },
  sections: { blurb: 'Full sections — Module 1 plus adaptive Module 2, scored out of 800.', scope: 'sections', noun: 'full sections', emptyTitle: 'No full sections yet' },
  modules:  { blurb: 'Single timed modules.', scope: 'modules', noun: 'modules', emptyTitle: 'No modules yet' },
};

function filterByKind(sessions, kind) {
  if (kind === 'modules') return sessions.filter((sess) => sess.mode === 'mock-m1');
  if (kind === 'sections') return sessions.filter((sess) => sess.mode === 'mock-full' && !isExam(sess));
  return sessions.filter((sess) => sess.mode === 'mock-full' && isExam(sess)); // tests
}

function summaryFor(kind, attempts) {
  if (kind === 'sections') {
    const scaled = attempts.map((sess) => sess.scaled_score).filter((v) => v != null);
    return [
      { label: 'Sections', value: attempts.length },
      { label: 'Best estimate', value: scaled.length ? Math.max(...scaled) : '—', unit: scaled.length ? '/ 800' : undefined },
      { label: 'Latest', value: attempts[0]?.scaled_score ?? '—', unit: attempts[0]?.scaled_score != null ? '/ 800' : undefined },
    ];
  }
  const accs = attempts.map((sess) => sess.accuracy).filter((v) => v != null);
  const avg = accs.length ? Math.round(accs.reduce((a, v) => a + v, 0) / accs.length) : null;
  return [
    { label: 'Modules', value: attempts.length },
    { label: 'Avg. accuracy', value: avg ?? '—', unit: avg != null ? '%' : undefined },
    { label: 'Best accuracy', value: accs.length ? Math.max(...accs) : '—', unit: accs.length ? '%' : undefined },
  ];
}

function PracticeAnalysis({ go, kind: kindProp, onKindChange, studentId = null, readOnly = false, studentName = null }) {
  const kind = KIND[kindProp] ? kindProp : 'modules';
  const cfg = KIND[kind];
  const { sessions, loading } = useSessions(50, studentId);
  const { stats } = useStats(studentId, cfg.scope);

  const attempts = React.useMemo(
    () => [...filterByKind(sessions, kind)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [sessions, kind],
  );
  const tests = React.useMemo(() => (kind === 'tests' ? pairTests(attempts) : []), [attempts, kind]);
  const isEmpty = kind === 'tests' ? tests.length === 0 : attempts.length === 0;

  return (
    <div className={p.tabBody}>
      <div className={p.toolbar}>
        <SegmentedControl label="Practice type" options={KINDS} value={kind} onChange={(k) => onKindChange?.(k)} />
        <p className={p.toolbarText}>{cfg.blurb}</p>
      </div>

      {loading && !sessions.length ? (
        <>
          <MetricsSkeleton count={3} />
          <ListSkeleton />
        </>
      ) : isEmpty ? (
        <DiagnosticEmpty cfg={cfg} go={go} readOnly={readOnly} studentName={studentName} />
      ) : (
        <>
          {kind === 'tests' ? <TestsSummary tests={tests} go={go} /> : <Summary items={summaryFor(kind, attempts)} />}
          <WeakAreas stats={stats} go={go} noun={cfg.noun} />
          <Section title={kind === 'tests' ? 'All full SATs' : 'Attempts'} description="Newest first. Select one to review it.">
            {kind === 'tests'
              ? <TestList tests={tests} go={go} />
              : <AttemptList attempts={attempts} kind={kind} go={go} />}
          </Section>
        </>
      )}
    </div>
  );
}

function Summary({ items }) {
  return (
    <Card padding="lg">
      <div className={p.metrics}>
        {items.map((c) => <Metric key={c.label} label={c.label} value={c.value} unit={c.unit} />)}
      </div>
    </Card>
  );
}

function TestsSummary({ tests, go }) {
  const latest = tests[0];
  const composites = tests.map((t) => t.composite).filter((v) => v != null);
  const { rw, math, composite, at } = latest;
  return (
    <Card padding="lg">
      <div className={p.metricsWithLead}>
        <div className={`${p.metrics} ${p.metricsHero}`}>
          <Metric
            size="lg"
            label="Latest score"
            value={composite ?? '—'}
            unit={composite != null ? '/ 1600' : undefined}
            hint={composite == null ? 'Finish both sections for a total' : relTime(new Date(at).toISOString())}
          />
          <Metric label="Reading & Writing" value={rw?.scaled_score ?? '—'} color={rw?.scaled_score != null ? 'var(--rw-color)' : undefined} />
          <Metric label="Math" value={math?.scaled_score ?? '—'} color={math?.scaled_score != null ? 'var(--math-color)' : undefined} />
          <Metric label="Best total" value={composites.length ? Math.max(...composites) : '—'} hint={`${tests.length} taken`} />
        </div>
        {(rw || math) && (
          <Button variant="secondary" onClick={() => go('test-review', { rwId: rw?.id, mathId: math?.id })}>
            View full review
          </Button>
        )}
      </div>
    </Card>
  );
}

function WeakAreas({ stats, go, noun }) {
  const cats = React.useMemo(() => {
    const rw = (stats?.categories?.rw ?? []).map((c) => ({ ...c, section: 'rw' }));
    const math = (stats?.categories?.math ?? []).map((c) => ({ ...c, section: 'math' }));
    return [...rw, ...math].filter((c) => c.done > 0).sort((a, b) => recentAcc(a) - recentAcc(b)).slice(0, 5);
  }, [stats]);

  if (!cats.length) return null;
  return (
    <Section title="Where you’re losing points" description={`Your weakest domains in ${noun}.`}>
      <DomainList cats={cats} go={go} showSection />
    </Section>
  );
}

function DiagnosticEmpty({ cfg, go, readOnly, studentName }) {
  const session = usePracticeSession();
  const start = () => {
    if (readOnly) return;
    session.start({ mode: 'mock-exam' });
    go('rw-question', { kind: 'module' }); // a full SAT always opens with R&W
  };
  return (
    <EmptyState
      icon="clipboard-list"
      title={cfg.emptyTitle}
      body={readOnly
        ? `${studentName || 'This student'} hasn’t taken any ${cfg.noun} yet.`
        : 'Take a diagnostic full SAT to see your strengths and where you’re losing points.'}
      action={readOnly ? null : <Button onClick={start}>Take a diagnostic</Button>}
    />
  );
}

export default PracticeAnalysis;
