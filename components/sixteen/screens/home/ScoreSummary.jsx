'use client';
import { Button, Card, EmptyState, Metric, Section } from '@/components/sixteen';
import { totalDelta } from './helpers';
import s from './Home.module.css';

const SECTIONS = [
  { id: 'rw', label: 'Reading & Writing', color: 'var(--rw-color)' },
  { id: 'math', label: 'Math', color: 'var(--math-color)' },
];

// Estimated total + section scores with their latest movement. Scores come only
// from full-length sections, so a missing one says how to get it.
export function ScoreSummary({ stats, readOnly, firstName, go }) {
  const scores = stats?.scores || { rw: null, math: null, total: null };
  const trend = stats?.trend || {};
  const hasAny = scores.rw != null || scores.math != null;
  const whose = readOnly ? `${firstName}'s` : 'your';

  return (
    <Section
      title="Estimated score"
      description={`Based on ${whose} most recent full-length section in each subject.`}
    >
      <Card padding="none" className={s.scoreCard}>
        {hasAny ? (
          <div className={s.scores}>
            <Metric
              className={s.scoreTotal}
              size="lg"
              label="Total"
              value={scores.total ?? '—'}
              unit="/ 1600"
              delta={totalDelta(stats)}
              hint={scores.total == null ? 'Needs both sections' : undefined}
            />
            {SECTIONS.map((sec) => (
              <Metric
                key={sec.id}
                className={s.scoreSection}
                label={sec.label}
                value={scores[sec.id] ?? '—'}
                unit="/ 800"
                color={scores[sec.id] != null ? sec.color : undefined}
                delta={scores[sec.id] != null ? trend[sec.id] : null}
                hint={scores[sec.id] == null ? `Take a full ${sec.label} section` : undefined}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon="gauge"
            title="No score estimate yet"
            body={
              readOnly
                ? `${firstName} gets an estimate on the 1600 scale after finishing a full Reading & Writing or Math section.`
                : 'Finish a full Reading & Writing or Math section and we will estimate your score on the 1600 scale.'
            }
            action={
              readOnly ? null : (
                <Button variant="outline" onClick={() => go('practice', { tab: 'full' })}>
                  Take a full section
                </Button>
              )
            }
          />
        )}
      </Card>
    </Section>
  );
}
