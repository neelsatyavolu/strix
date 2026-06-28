'use client';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { usePlan, useAssignments } from '@/lib/data/hooks';

// StudyPlan — "this week", derived from the student's goal, weak areas, recent
// practice, and due reviews. Turns the score report into a coach: every card is
// one click away from the exact practice it recommends.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function dueLabel(iso) {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}

const TASK_ICON = { review: 'rotate-ccw', drill: 'target', diagnostic: 'graduation-cap' };

function StudyPlan({ go, studentId = null, readOnly = false, studentName = null, studentProfile = null }) {
  const { Card, Button, Badge } = SixteenNS;
  const { profile: ownProfile } = useProfile();
  // When a tutor is viewing, use the watched student's goal + scoped data.
  const profile = studentId ? studentProfile : ownProfile;
  const session = usePracticeSession();
  const { plan, loading } = usePlan(profile, studentId);
  const { assignments } = useAssignments();
  // The "assigned by your tutor" list is the signed-in student's own work; a
  // tutor reviews assignments from the Assignments tab instead.
  const openAssignments = studentId ? [] : (assignments || []).filter((a) => a.status === 'assigned');

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

  const startAssignment = (a) => {
    if (readOnly) return;
    session.start({
      section: a.section, mode: 'drill', category: a.domain || undefined,
      difficulty: a.difficulty || 'all', count: a.question_count || 10, timing: 'untimed', assignmentId: a.id,
    });
    go(a.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  return (
    <div style={{ padding: '28px 36px' }}>
      <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>
        {studentName ? `${studentName}’s plan this week` : 'Your plan this week'}
      </h1>
      <p style={{ margin: '4px 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        {studentName
          ? 'Where they stand and what to focus on next.'
          : 'A focused path toward your goal, built from where you are right now.'}
      </p>

      {/* Goal + progress */}
      <Card padding="lg" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          <GoalStat label="Goal" value={plan.target != null ? plan.target : '—'} sub={plan.target == null ? 'Set in Settings' : 'Target score'} />
          <Divider />
          <GoalStat label="Estimate" value={plan.currentEstimate != null ? plan.currentEstimate : '—'} sub={plan.currentEstimate == null ? 'Finish a section' : 'Latest total'} />
          {plan.gap != null && plan.gap > 0 && (
            <><Divider /><GoalStat label="To go" value={`+${plan.gap}`} sub="points to target" /></>
          )}
          <Divider />
          <GoalStat
            label="Test date"
            value={plan.daysUntilTest != null ? plan.daysUntilTest : '—'}
            sub={plan.daysUntilTest != null ? 'days away' : 'Set in Settings'}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 6 }}>
            <span>This week&rsquo;s practice</span>
            <span>{plan.weekProgress.done} / {plan.weekProgress.goal} sessions</span>
          </div>
          <div style={{ height: 8, background: 'var(--sunken)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, (plan.weekProgress.done / plan.weekProgress.goal) * 100)}%`, height: '100%', background: 'var(--brand-blue)' }} />
          </div>
        </div>
      </Card>

      {/* Tutor-assigned work */}
      {openAssignments.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)' }}>Assigned by your tutor</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {openAssignments.map((a) => (
              <Card key={a.id} padding="lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name="clipboard-list" size={18} style={{ color: 'var(--brand-blue)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                    <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                      {SECTION_LABEL[a.section]} · {a.question_count} questions{a.due_at ? ` · ${dueLabel(a.due_at)}` : ''}
                    </div>
                  </div>
                  <Button variant="primary" size="sm" icon={<Icon name="play" size={12} />} onClick={() => startAssignment(a)}>Start</Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recommended tasks */}
      <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)' }}>Recommended this week</h2>
      {loading && plan.tasks.length === 0 ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)', font: 'var(--role-body)' }}>Building your plan…</Card>
      ) : plan.tasks.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 4 }}>You&rsquo;re on track 🎉</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
            Nothing urgent right now. Keep practicing to stay sharp — a full section is a great way to refresh your estimate.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.tasks.map((t) => (
            <Card key={t.id} padding="lg">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--sunken)', flexShrink: 0 }}>
                  <Icon name={TASK_ICON[t.kind] || 'target'} size={16} style={{ color: 'var(--brand-blue)' }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{t.title}</span>
                    {t.kind !== 'review' && <Badge variant={t.section} dot size="sm">{t.section === 'rw' ? 'R&W' : 'Math'}</Badge>}
                  </div>
                  <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{t.reason}</div>
                </div>
                <Button variant={t.kind === 'review' ? 'secondary' : 'primary'} size="sm" disabled={readOnly} icon={<Icon name="play" size={12} />} onClick={() => startTask(t)}>
                  {t.kind === 'review' ? 'Review' : 'Start'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalStat({ label, value, sub }) {
  return (
    <div>
      <div style={{ font: 'var(--role-caption)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{sub}</div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', minHeight: 48, background: 'var(--border-1)' }} />;
}

export default StudyPlan;
