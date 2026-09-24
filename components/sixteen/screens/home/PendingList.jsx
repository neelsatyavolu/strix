'use client';
import { EmptyState, Icon, List, ListRow, Section, Skeleton } from '@/components/sixteen';
import { useTutorAssignments } from '@/lib/data/hooks';
import { dueLabel, openAssignments, plural } from './helpers';
import s from './Home.module.css';

function Mark({ icon }) {
  return (
    <span className={s.pendingMark} aria-hidden="true">
      <Icon name={icon} size={15} />
    </span>
  );
}

// Tutor's read-only "Up next": what the watched student has waiting, with no
// start/resume actions (rows open the matching read-only screen).
export function PendingList({ studentId, firstName, reviewDue, focus, go }) {
  const { assignments, loading } = useTutorAssignments(studentId);
  const open = openAssignments(assignments);
  const weakest = focus[0];
  const nextDue = open[0] ? dueLabel(open[0].due_at) : null;

  const rows = [
    open.length > 0 && (
      <ListRow
        key="assignments"
        leading={<Mark icon="clipboard-list" />}
        title={`${plural(open.length, 'open assignment')}`}
        subtitle={[open[0].title, nextDue].filter(Boolean).join(' · ')}
        onClick={() => go('plan')}
      />
    ),
    reviewDue > 0 && (
      <ListRow
        key="review"
        leading={<Mark icon="repeat" />}
        title={`${plural(reviewDue, 'question')} due for review`}
        subtitle="Missed questions scheduled to come back"
        onClick={() => go('review')}
      />
    ),
    weakest && (
      <ListRow
        key="focus"
        leading={<Mark icon="target" />}
        title={`Weakest skill: ${weakest.label}`}
        subtitle={`${weakest.accuracy ?? 0}% recent accuracy · ${plural(weakest.attempts, 'question')} answered`}
        onClick={() => go('progress', { tab: weakest.section })}
      />
    ),
  ].filter(Boolean);

  return (
    <Section title={`What's pending for ${firstName}`}>
      {loading && rows.length === 0 ? (
        <List>
          <div className={s.skelRow}><Skeleton width={32} height={32} radius={8} /><Skeleton width="40%" /></div>
        </List>
      ) : rows.length ? (
        <List>{rows}</List>
      ) : (
        <List>
          <EmptyState
            compact
            icon="circle-check"
            title="Nothing pending"
            body={`${firstName} has no open assignments or reviews due.`}
          />
        </List>
      )}
    </Section>
  );
}
