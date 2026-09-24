'use client';
import { Badge, Button, EmptyState, Icon, List, ListRow, Page, PageHeader, Section } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { usePlan } from '@/lib/data/hooks';
import { SkeletonList } from './plan/AssignmentBits';
import FromYourTutor from './plan/FromYourTutor';
import GoalSummary from './plan/GoalSummary';
import s from './plan/Plan.module.css';

// StudyPlan — "this week", derived from the student's goal, weak areas, recent
// practice, and due reviews, plus the work their tutor assigned. Every item is
// one click away from the exact practice it recommends.

const TASK_ICON = { review: 'rotate-ccw', drill: 'target', diagnostic: 'graduation-cap' };

function countdown(days) {
  if (days === 0) return 'test is today';
  if (days === 1) return 'test is tomorrow';
  return `test in ${days} days`;
}

// Header subtitle: the goal in one line, or a nudge to set one.
function goalLine(plan, firstName) {
  const parts = [];
  if (plan.target != null) parts.push(`Aiming for ${plan.target}`);
  if (plan.daysUntilTest != null) parts.push(countdown(plan.daysUntilTest));
  if (parts.length) {
    const line = parts.join(' · ');
    return line.charAt(0).toUpperCase() + line.slice(1);
  }
  return firstName
    ? `${firstName} hasn’t set a goal yet.`
    : 'Set a goal score and test date to shape your plan.';
}

function StudyPlan({ go, studentId = null, readOnly = false, studentName = null, studentProfile = null }) {
  const { profile: ownProfile } = useProfile();
  // When a tutor is viewing, use the watched student's goal + scoped data.
  const profile = studentId ? studentProfile : ownProfile;
  const session = usePracticeSession();
  const { plan, loading } = usePlan(profile, studentId);
  const firstName = studentName ? studentName.split(' ')[0] : null;

  const startTask = (t) => {
    if (readOnly) return;
    if (t.kind === 'review') { go('review'); return; }
    if (t.kind === 'diagnostic') {
      session.start({ section: t.section, mode: 'mock-full' });
      go(t.section === 'math' ? 'math-question' : 'rw-question', { kind: 'module' });
      return;
    }
    session.start({ section: t.section, mode: 'drill', category: t.category || undefined, difficulty: t.difficulty || 'all', count: t.count || 10, timing: 'untimed' });
    go(t.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const { done, goal } = plan.weekProgress;
  const pct = goal ? Math.min(100, (done / goal) * 100) : 0;

  return (
    <Page>
      <PageHeader title={firstName ? `${firstName}’s plan` : 'Plan'} subtitle={goalLine(plan, firstName)} />

      <Section
        title="This week"
        description={firstName
          ? `Built from ${firstName}’s goal, weak spots, and what’s due for review.`
          : 'Built from your goal, weak spots, and what’s due for review.'}
      >
        <div className={s.progress}>
          <div className={s.progressHead}>
            <span>Practice sessions this week</span>
            <span className="tnum">{done} of {goal}</span>
          </div>
          <div className={s.track} role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}>
            <div className={s.fill} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {loading && plan.tasks.length === 0 ? (
          <SkeletonList rows={3} />
        ) : plan.tasks.length === 0 ? (
          <List>
            <EmptyState
              compact
              icon="check-circle-2"
              title={firstName ? `${firstName} is on track` : 'You’re on track'}
              body="Nothing urgent right now. A full section is a great way to refresh the score estimate."
              action={!readOnly && (
                <Button variant="secondary" size="sm" onClick={() => go('practice', { tab: 'full' })}>Take a section</Button>
              )}
            />
          </List>
        ) : (
          <List>
            {plan.tasks.map((t, i) => (
              <ListRow
                key={t.id}
                leading={<span className={s.taskIcon}><Icon name={TASK_ICON[t.kind] || 'target'} size={15} /></span>}
                title={
                  <span className={s.titleWithBadge}>
                    {t.title}
                    {t.kind !== 'review' && <Badge variant={t.section} dot size="sm">{t.section === 'rw' ? 'R&W' : 'Math'}</Badge>}
                  </span>
                }
                subtitle={t.reason}
                trailing={!readOnly && (
                  <Button
                    variant={i === 0 ? 'primary' : 'secondary'}
                    size="sm"
                    icon={<Icon name="play" size={12} />}
                    onClick={() => startTask(t)}
                  >
                    {t.kind === 'review' ? 'Review' : 'Start'}
                  </Button>
                )}
              />
            ))}
          </List>
        )}
      </Section>

      {/* The signed-in student's own tutor work; a tutor manages it from Plan & assign. */}
      {!studentId && <FromYourTutor go={go} />}

      <GoalSummary plan={plan} go={go} readOnly={readOnly} firstName={firstName} />
    </Page>
  );
}

export default StudyPlan;
