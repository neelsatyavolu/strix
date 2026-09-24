'use client';
import React from 'react';
import { Button, Icon, List, Section } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useAssignments } from '@/lib/data/hooks';
import { AssignmentItem, FeedbackNote, GroupLabel, ScoreCell } from './AssignmentBits';
import { dueText, groupAssignments, reviewTarget, shortDate, typeMeta } from './assignmentMeta';
import s from './Plan.module.css';

// "From your tutor" — the signed-in student's tutor-assigned practice, split into
// overdue / upcoming / done, with the tutor's feedback inline. Hidden entirely
// when the student has no assignments.

const DONE_PREVIEW = 5;

export default function FromYourTutor({ go }) {
  const session = usePracticeSession();
  const { assignments } = useAssignments();
  const [showAllDone, setShowAllDone] = React.useState(false);

  // Overdue boundary, read once per mount — render must stay pure (no Date.now
  // during render), and the list refetches on navigation anyway.
  const [now] = React.useState(() => Date.now());
  const list = assignments || [];
  if (list.length === 0) return null;
  const { overdue, upcoming, done } = groupAssignments(list, now);
  const doneShown = showAllDone ? done : done.slice(0, DONE_PREVIEW);
  // One primary action: the most pressing open assignment.
  const nextId = (overdue[0] || upcoming[0])?.id;

  const start = (a) => {
    if (a.mode === 'mock-exam') {
      session.start({ mode: 'mock-exam', bluebookTest: a.bluebook_test ?? null, assignmentId: a.id });
      go('rw-question', { kind: 'module' }); // a full SAT always opens with R&W
      return;
    }
    if (a.mode === 'mock-m1' || a.mode === 'mock-full') {
      session.start({
        mode: a.mode, section: a.section, bluebookTest: a.bluebook_test ?? null,
        moduleKey: a.module_key ?? null, timing: 'total', assignmentId: a.id,
      });
      go(a.section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
      return;
    }
    session.start({
      section: a.section, mode: 'drill', category: a.domain || undefined,
      difficulty: a.difficulty || 'all', count: a.question_count || 10, timing: 'untimed', assignmentId: a.id,
    });
    go(a.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const openRow = (a, isOverdue) => (
    <AssignmentItem
      key={a.id}
      assignment={a}
      subtitle={
        <>
          {typeMeta(a)} · <span className={isOverdue ? s.overdue : undefined}>{dueText(a.due_at, now)}</span>
        </>
      }
      trailing={
        <Button variant={a.id === nextId ? 'primary' : 'secondary'} size="sm" icon={<Icon name="play" size={12} />} onClick={() => start(a)}>
          Start
        </Button>
      }
    >
      {a.feedback && <FeedbackNote text={a.feedback} />}
    </AssignmentItem>
  );

  return (
    <Section title="From your tutor" description="Practice your tutor set for you, and their notes on what you’ve done.">
      {overdue.length > 0 && (
        <div className={s.group}>
          <GroupLabel title="Overdue" count={overdue.length} tone="error" />
          <List>{overdue.map((a) => openRow(a, true))}</List>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className={s.group}>
          <GroupLabel title="Upcoming" count={upcoming.length} />
          <List>{upcoming.map((a) => openRow(a, false))}</List>
        </div>
      )}
      {done.length > 0 && (
        <div className={s.group}>
          <GroupLabel title="Done" count={done.length} />
          <List>
            {doneShown.map((a) => {
              const target = reviewTarget(a);
              return (
                <AssignmentItem
                  key={a.id}
                  assignment={a}
                  subtitle={a.completed_at ? `Completed ${shortDate(a.completed_at)}` : 'Completed'}
                  meta={<ScoreCell assignment={a} />}
                  trailing={target && (
                    <Button variant="ghost" size="sm" onClick={() => go(target[0], target[1])}>Review</Button>
                  )}
                >
                  {a.feedback && <FeedbackNote text={a.feedback} />}
                </AssignmentItem>
              );
            })}
          </List>
          {done.length > DONE_PREVIEW && (
            <div className={s.moreRow}>
              <Button variant="ghost" size="sm" onClick={() => setShowAllDone((v) => !v)}>
                {showAllDone ? 'Show fewer' : `Show all ${done.length}`}
              </Button>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
