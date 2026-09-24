'use client';
import React from 'react';
import { Badge, EmptyState, List, Page, PageHeader, Section } from '@/components/sixteen';
import { useTutorAssignments } from '@/lib/data/hooks';
import AssignForm from './plan/AssignForm';
import { AssignmentItem, ScoreCell, SkeletonList } from './plan/AssignmentBits';
import { FeedbackEditor, RetractButton, ReviewButton } from './plan/TutorAssignmentControls';
import { MODULE_LABEL, SECTION_LABEL, shortDate } from './plan/assignmentMeta';

// TutorAssignments ("Plan & assign") — a tutor assigns practice to the student
// they're viewing and tracks completion. A finished assignment links straight to
// the per-question review of what the student actually did (RLS lets the tutor
// read it).

function bbSuffix(bluebook) {
  return bluebook ? ` · Bluebook ${bluebook}` : ' · Question Bank';
}

// One-line description of an open assignment, scaled to its type.
function metaLine(a) {
  const due = a.due_at ? ` · due ${shortDate(a.due_at)}` : '';
  if (a.mode === 'mock-exam') return `Full SAT${bbSuffix(a.bluebook_test)}${due}`;
  if (a.mode === 'mock-full') return `${SECTION_LABEL[a.section]} section${bbSuffix(a.bluebook_test)}${due}`;
  if (a.mode === 'mock-m1') return `${MODULE_LABEL[a.module_key] || 'Module 1'}${bbSuffix(a.bluebook_test)}${due}`;
  return `${a.question_count} questions${due}`;
}

// Header subtitle: who this is for, plus their goal when they've set one.
function subtitleFor(firstName, profile, now) {
  const intro = `Assign practice to ${firstName || 'your student'} and see how it went.`;
  const goal = [];
  if (profile?.target_score) goal.push(`aiming for ${profile.target_score}`);
  if (profile?.test_date) {
    const days = Math.max(0, Math.ceil((new Date(profile.test_date).getTime() - now) / 86_400_000));
    goal.push(days === 0 ? 'testing today' : `testing in ${days} day${days === 1 ? '' : 's'}`);
  }
  if (!goal.length) return intro;
  return `${intro} ${firstName ? `${firstName} is` : 'They’re'} ${goal.join(' and ')}.`;
}

function TutorAssignments({ go, studentId = null, studentName = null, studentProfile = null }) {
  const { assignments, loading, reload } = useTutorAssignments(studentId);
  const [now] = React.useState(() => Date.now());
  const firstName = studentName ? studentName.split(' ')[0] : null;

  const list = assignments || [];
  const open = list.filter((a) => a.status === 'assigned');
  const done = list.filter((a) => a.status === 'completed');
  const showSkeleton = loading && list.length === 0;

  return (
    <Page>
      <PageHeader title="Plan & assign" subtitle={subtitleFor(firstName, studentProfile, now)} />

      <Section title="New assignment">
        <AssignForm studentId={studentId} firstName={firstName} onCreated={reload} />
      </Section>

      <Section title="Assigned" description={open.length ? `${open.length} waiting on ${firstName || 'your student'}` : undefined}>
        {showSkeleton ? <SkeletonList rows={2} /> : open.length === 0 ? (
          <List>
            <EmptyState compact icon="clipboard-list" title="Nothing assigned right now" body="New assignments show up here until they’re done." />
          </List>
        ) : (
          <List>
            {open.map((a) => (
              <AssignmentItem
                key={a.id}
                assignment={a}
                subtitle={metaLine(a)}
                trailing={
                  <>
                    <RetractButton assignment={a} onDone={reload} />
                    <Badge variant="neutral" size="sm">Waiting</Badge>
                  </>
                }
              >
                <FeedbackEditor assignment={a} onSaved={reload} />
              </AssignmentItem>
            ))}
          </List>
        )}
      </Section>

      <Section title="Completed">
        {showSkeleton ? <SkeletonList rows={2} /> : done.length === 0 ? (
          <List>
            <EmptyState compact icon="check-circle-2" title="Nothing completed yet" body="Scores and a link to each review appear here once work is done." />
          </List>
        ) : (
          <List>
            {done.map((a) => (
              <AssignmentItem
                key={a.id}
                assignment={a}
                subtitle={a.completed_at ? `Done ${shortDate(a.completed_at)}` : 'Done'}
                meta={<ScoreCell assignment={a} />}
                trailing={<ReviewButton assignment={a} go={go} label="Open review" />}
              >
                <FeedbackEditor assignment={a} onSaved={reload} />
              </AssignmentItem>
            ))}
          </List>
        )}
      </Section>
    </Page>
  );
}

export default TutorAssignments;
