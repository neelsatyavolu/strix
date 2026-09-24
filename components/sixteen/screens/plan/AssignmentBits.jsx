'use client';
import { Badge, Icon, List, ListRow, Skeleton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import s from './Plan.module.css';

// Small building blocks shared by the student and tutor assignment lists.

// Section/type badge — a full SAT has no single section, so it gets a 'SAT' chip.
export function TypeBadge({ assignment: a }) {
  if (a.mode === 'mock-exam') return <Badge variant="neutral" dot>SAT</Badge>;
  return <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>;
}

// Completed-score figure — exam/section show the scaled estimate; drill/module raw.
export function ScoreCell({ assignment: a }) {
  if (a.mode === 'mock-exam' || a.mode === 'mock-full') {
    return a.scaled_score != null ? <span className={s.score}>{a.scaled_score}</span> : null;
  }
  const pct = a.score_total ? Math.round((a.score_correct / a.score_total) * 100) : 0;
  return (
    <span className={cx(s.score, pct >= 75 ? s.scoreGood : s.scoreLow)}>
      {a.score_correct}/{a.score_total}
    </span>
  );
}

// The tutor's note on an assignment, as the student sees it.
export function FeedbackNote({ text }) {
  if (!text) return null;
  return (
    <div className={s.feedback}>
      <Icon name="message-circle" size={15} className={s.feedbackIcon} />
      <div>
        <p className={s.feedbackLabel}>Tutor feedback</p>
        <p className={s.feedbackText}>{text}</p>
      </div>
    </div>
  );
}

// One assignment: a standard row, with an optional body (feedback) beneath it.
export function AssignmentItem({ assignment, subtitle, meta, trailing, children }) {
  return (
    <div className={s.item}>
      <ListRow
        leading={<TypeBadge assignment={assignment} />}
        title={assignment.title}
        subtitle={subtitle}
        meta={meta}
        trailing={trailing}
      />
      {children && <div className={s.itemBody}>{children}</div>}
    </div>
  );
}

// A labelled group of rows inside a section ("Overdue (2)").
export function GroupLabel({ title, count, tone }) {
  return (
    <h3 className={cx(s.groupLabel, tone === 'error' && s.groupLabelError)}>
      {title} <span className={s.count}>{count}</span>
    </h3>
  );
}

// Loading placeholder shaped like a List of rows.
export function SkeletonList({ rows = 3 }) {
  return (
    <List>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={s.skelRow}>
          <Skeleton width={32} height={32} radius={16} />
          <div className={s.skelText}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="30%" height={11} />
          </div>
          <Skeleton width={64} height={26} radius={8} />
        </div>
      ))}
    </List>
  );
}
