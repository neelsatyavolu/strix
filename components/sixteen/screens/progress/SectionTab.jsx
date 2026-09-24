'use client';
import React from 'react';
import { Button, Card, Metric, Section, EmptyState } from '@/components/sixteen';
import { InsightCard } from '@/components/sixteen/stats/InsightCard';
import { SECTION_LABEL, recentAcc } from '@/components/sixteen/stats/shared';
import { useInsight } from '@/lib/ai/insights';
import { DomainList, sectionColor } from './DomainList';
import { sectionBaseline, topicsPayload, RECENCY_NOTE } from './insights';
import s from './Progress.module.css';

// SectionTab — one section (R&W or Math): headline figures, an insight, and the
// per-domain accuracy list. A domain opens its skill + question drill-in.

export default function SectionTab({ section, stats, go, studentId, readOnly, studentName }) {
  const label = SECTION_LABEL[section] ?? section;
  const cats = React.useMemo(() => stats.categories?.[section] ?? [], [stats, section]);
  const tot = stats.sectionTotals?.[section] ?? { done: 0, correct: 0 };
  const color = sectionColor(section);

  if (!tot.done) {
    return (
      <EmptyState
        icon={section === 'math' ? 'calculator' : 'book-open'}
        title={`No ${label} practice yet`}
        body={readOnly
          ? `${studentName || 'This student'} hasn't answered any ${label} questions yet.`
          : `Answer a few ${label} questions to see accuracy by domain.`}
        action={readOnly ? null : <Button onClick={() => go('practice', { tab: 'drill' })}>Start a drill</Button>}
      />
    );
  }

  const score = stats.scores?.[section];
  return (
    <div className={s.tabBody}>
      <Card padding="lg">
        <div className={s.metrics}>
          <Metric label="Estimate" value={score ?? '—'} unit={score != null ? '/ 800' : undefined} delta={stats.trend?.[section] ?? null}
            color={score != null ? color : undefined} hint={score == null ? 'Finish a full section' : 'Latest full section'} />
          <Metric label="Accuracy" value={recentAcc(tot)} unit="%" hint="Recent, weighted" />
          <Metric label="Questions" value={tot.done} hint="Answered" />
          <Metric label="Correct" value={tot.correct ?? 0} hint={`of ${tot.done}`} />
        </div>
      </Card>
      <SectionInsight label={label} cats={cats} accent={color} studentId={studentId} />
      <Section title="By domain" description="Recent accuracy in each content domain. Select one for its skills and questions.">
        <DomainList cats={cats} section={section} go={go} />
      </Section>
    </div>
  );
}

function SectionInsight({ label, cats, accent, studentId }) {
  const baseline = React.useMemo(() => sectionBaseline(label, cats), [label, cats]);
  const payload = React.useMemo(() => ({ section: label, note: RECENCY_NOTE, topics: topicsPayload(cats) }), [label, cats]);
  const ready = cats.some((c) => c.done > 0);
  const ins = useInsight({ scope: `section:${label}${studentId ? `:${studentId}` : ''}`, payload, baseline, ready });
  if (!ready) return null;
  return <InsightCard title="Insights" accent={accent} {...ins} />;
}
