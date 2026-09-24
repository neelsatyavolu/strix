'use client';
import React from 'react';
import {
  Button, Card, Icon, Metric, Section, SegmentedControl, EmptyState, DomainBar,
} from '@/components/sixteen';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { recentAcc } from '@/components/sixteen/stats/shared';
import { useInsight } from '@/lib/ai/insights';
import ScoreChart from './ScoreChart';
import ActivityGrid from './ActivityGrid';
import { DomainList, sectionColor } from './DomainList';
import { overallBaseline, topicsPayload, RECENCY_NOTE } from './insights';
import s from './Progress.module.css';

// Overview — the at-a-glance read: headline figures, score trend, R&W vs Math,
// insight, strongest/weakest skills, and practice activity.

const SERIES = [
  { value: 'total', label: 'Total' },
  { value: 'rw', label: 'R&W' },
  { value: 'math', label: 'Math' },
];

// Score points oldest → newest. 'total' is the running estimate (latest R&W +
// latest Math), matching how the headline estimate is computed.
function buildSeries(overTime, which) {
  const pts = [...(overTime ?? [])]
    .filter((p) => typeof p.score === 'number')
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  if (which !== 'total') return pts.filter((p) => p.section === which).map(({ at, score }) => ({ at, score }));
  return pts.reduce((acc, p) => {
    const latest = { ...acc.latest, [p.section]: p.score };
    const next = latest.rw != null && latest.math != null ? [...acc.out, { at: p.at, score: latest.rw + latest.math }] : acc.out;
    return { latest, out: next };
  }, { latest: {}, out: [] }).out;
}

function splitSkills(stats) {
  const all = [
    ...(stats.categories?.rw ?? []).map((c) => ({ ...c, section: 'rw', key: `rw-${c.id}` })),
    ...(stats.categories?.math ?? []).map((c) => ({ ...c, section: 'math', key: `math-${c.id}` })),
  ].filter((c) => c.done > 0);
  const ranked = [...all].sort((a, b) => recentAcc(b) - recentAcc(a) || b.done - a.done);
  const nBest = Math.min(3, Math.ceil(ranked.length / 2));
  const nWorst = Math.min(3, ranked.length - nBest);
  return {
    all,
    strongest: ranked.slice(0, nBest),
    weakest: nWorst > 0 ? ranked.slice(-nWorst).reverse() : [],
  };
}

export default function OverviewTab({ stats, sessions, go, studentId, readOnly, studentName, onTabChange }) {
  const overall = stats.sectionTotals?.overall ?? { done: 0 };
  const skills = React.useMemo(() => splitSkills(stats), [stats]);
  const who = studentName ? `${studentName}` : 'You';

  if (!overall.done && !sessions.length) {
    return (
      <EmptyState
        icon="chart-line"
        title={readOnly ? `${who} hasn't practiced yet` : 'No practice yet'}
        body="Scores, strengths, and history show up here after the first session."
        action={readOnly ? null : <Button onClick={() => go('practice', { tab: 'drill' })}>Start practicing</Button>}
      />
    );
  }

  return (
    <div className={s.tabBody}>
      <HeadlineMetrics stats={stats} />
      <ScoreSection overTime={stats.overTime} />
      <Section title="Reading & Writing vs Math" description="Recent accuracy and latest estimate for each section.">
        <div className={s.twoCol}>
          <SubjectCard section="rw" stats={stats} onOpen={() => onTabChange('rw')} />
          <SubjectCard section="math" stats={stats} onOpen={() => onTabChange('math')} />
        </div>
      </Section>
      <OverallInsight cats={skills.all} studentId={studentId} />
      {skills.strongest.length > 0 && (
        <div className={s.twoCol}>
          <Section title="Strongest skills">
            <DomainList cats={skills.strongest} go={go} showSection bar={false} />
          </Section>
          <Section title="Needs work">
            {skills.weakest.length ? (
              <DomainList cats={skills.weakest} go={go} showSection bar={false} />
            ) : (
              <Card padding="none"><EmptyState compact icon="target" title="Not enough data yet" body="Practice a few more skills to compare." /></Card>
            )}
          </Section>
        </div>
      )}
      <Section title="Practice activity" description="Sessions per day.">
        <Card padding="lg"><ActivityGrid sessions={sessions} /></Card>
      </Section>
    </div>
  );
}

function HeadlineMetrics({ stats }) {
  const total = stats.scores?.total;
  const overall = stats.sectionTotals?.overall ?? { done: 0 };
  return (
    <Card padding="lg">
      <div className={`${s.metrics} ${s.metricsHero}`}>
        <Metric size="lg" label="Estimated score" value={total ?? '—'} unit={total != null ? '/ 1600' : undefined}
          hint={total == null ? 'Finish a full section in each subject' : 'From your latest full sections'} />
        <Metric label="Accuracy" value={overall.done ? recentAcc(overall) : '—'} unit={overall.done ? '%' : undefined} hint="Recent, weighted" />
        <Metric label="Questions" value={overall.done ?? 0} hint="Answered" />
        <Metric label="Sessions" value={stats.sessionCount ?? 0} hint="Completed" />
      </div>
    </Card>
  );
}

function ScoreSection({ overTime }) {
  const [choice, setChoice] = React.useState(null);
  const series = React.useMemo(() => Object.fromEntries(SERIES.map((o) => [o.value, buildSeries(overTime, o.value)])), [overTime]);
  // Default to the first series with a trend to show.
  const auto = SERIES.find((o) => series[o.value].length >= 2)?.value ?? 'total';
  const which = choice ?? auto;
  const points = series[which];
  const isTotal = which === 'total';
  const scores = points.map((p) => p.score);
  const change = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : null;

  return (
    <Section
      title="Score estimate"
      description="Built from your full-length sections."
      action={<SegmentedControl size="sm" label="Score series" options={SERIES} value={which} onChange={setChoice} />}
    >
      <Card padding="lg">
        {points.length < 2 ? (
          <EmptyState
            compact
            icon="chart-line"
            title="Not enough full sections yet"
            body={isTotal
              ? 'Finish full sections in both Reading & Writing and Math to see your total over time.'
              : 'Finish two full sections in this subject to start a trend.'}
          />
        ) : (
          <>
            <ScoreChart
              points={points}
              color={isTotal ? 'var(--brand-blue)' : sectionColor(which)}
              scaleMin={isTotal ? 400 : 200}
              scaleMax={isTotal ? 1600 : 800}
            />
            <div className={s.metrics} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-1)' }}>
              <Metric size="sm" label="Latest" value={scores[scores.length - 1]} />
              <Metric size="sm" label="Change" value={change > 0 ? `+${change}` : change}
                color={change > 0 ? 'var(--success)' : change < 0 ? 'var(--error)' : undefined} />
              <Metric size="sm" label="High" value={Math.max(...scores)} />
              <Metric size="sm" label="Low" value={Math.min(...scores)} />
            </div>
          </>
        )}
      </Card>
    </Section>
  );
}

function SubjectCard({ section, stats, onOpen }) {
  const tot = stats.sectionTotals?.[section] ?? { done: 0 };
  const score = stats.scores?.[section];
  const trend = stats.trend?.[section];
  const pct = tot.done ? recentAcc(tot) : null;
  const color = sectionColor(section);
  return (
    <Card as="button" type="button" interactive padding="lg" onClick={onOpen} style={{ width: '100%' }} aria-label={`Open ${section === 'rw' ? 'Reading & Writing' : 'Math'} breakdown`}>
      <div className={s.subject}>
        <div className={s.subjectHead}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className={s.dot} style={{ background: color }} />
            {section === 'rw' ? 'Reading & Writing' : 'Math'}
          </span>
          <span className={s.subjectLink}>Breakdown <Icon name="chevron-right" size={14} /></span>
        </div>
        <div className={s.subjectFigures}>
          <Metric label="Estimate" value={score ?? '—'} unit={score != null ? '/ 800' : undefined} delta={trend ?? null} color={score != null ? color : undefined} />
          <Metric size="sm" label="Accuracy" value={pct ?? '—'} unit={pct != null ? '%' : undefined} />
          <Metric size="sm" label="Questions" value={tot.done ?? 0} />
        </div>
        <DomainBar segments={[{ value: pct ?? 0, label: 'Accuracy', color }]} total={100} height={6} showLegend={false} />
      </div>
    </Card>
  );
}

function OverallInsight({ cats, studentId }) {
  const baseline = React.useMemo(() => overallBaseline(cats), [cats]);
  const payload = React.useMemo(() => ({ section: 'Overall SAT', note: RECENCY_NOTE, topics: topicsPayload(cats) }), [cats]);
  const ready = cats.length > 0;
  const ins = useInsight({ scope: `overall${studentId ? `:${studentId}` : ''}`, payload, baseline, ready });
  if (!ready) return null;
  return <InsightCard title="Insights" {...ins} />;
}
