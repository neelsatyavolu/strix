'use client';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useAssignments } from '@/lib/data/hooks';

// StudentAssignments — the student's view of tutor-assigned practice, split into
// overdue / upcoming / completed, with the tutor's feedback shown inline.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function dueText(iso) {
  if (!iso) return 'No due date';
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `Overdue by ${-days} day${-days === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

function FeedbackNote({ text }) {
  if (!text) return null;
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12, padding: '10px 12px', background: 'color-mix(in srgb, var(--brand-blue) 7%, transparent)', borderRadius: 'var(--radius-md)' }}>
      <Icon name="message-circle" size={15} style={{ color: 'var(--brand-blue)', flexShrink: 0, marginTop: 2 }} />
      <div>
        <div style={{ font: 'var(--role-caption)', color: 'var(--brand-blue)', fontWeight: 600, marginBottom: 2 }}>Tutor feedback</div>
        <div style={{ font: 'var(--role-body)', color: 'var(--text-body)', whiteSpace: 'pre-wrap' }}>{text}</div>
      </div>
    </div>
  );
}

function StudentAssignments({ go }) {
  const { Card, Button, Badge } = SixteenNS;
  const session = usePracticeSession();
  const { assignments, loading } = useAssignments();

  const now = Date.now();
  const list = assignments || [];
  const overdue = list.filter((a) => a.status === 'assigned' && a.due_at && new Date(a.due_at).getTime() < now);
  const upcoming = list.filter((a) => a.status === 'assigned' && !(a.due_at && new Date(a.due_at).getTime() < now));
  const past = list.filter((a) => a.status === 'completed');

  const start = (a) => {
    session.start({
      section: a.section, mode: 'drill', category: a.domain || undefined,
      difficulty: a.difficulty || 'all', count: a.question_count || 10, timing: 'untimed', assignmentId: a.id,
    });
    go(a.section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  const openCard = (a, tone) => (
    <Card key={a.id} padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
          <div style={{ font: 'var(--role-caption)', color: tone === 'overdue' ? 'var(--error)' : 'var(--text-tertiary)' }}>
            {SECTION_LABEL[a.section]} · {a.question_count} questions · {dueText(a.due_at)}
          </div>
        </div>
        <Button variant="primary" size="sm" icon={<Icon name="play" size={12} />} onClick={() => start(a)}>Start</Button>
      </div>
      <FeedbackNote text={a.feedback} />
    </Card>
  );

  return (
    <div style={{ padding: '28px 36px' }}>
      <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Assignments</h1>
      <p style={{ margin: '4px 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Practice your tutor has set for you, and their feedback on what you&rsquo;ve done.
      </p>

      {loading && list.length === 0 ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)', font: 'var(--role-body)' }}>Loading your assignments…</Card>
      ) : list.length === 0 ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <Icon name="clipboard-list" size={28} style={{ color: 'var(--text-tertiary)' }} />
          <div style={{ font: 'var(--role-title-sm)', margin: '8px 0 4px' }}>No assignments yet</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
            When your tutor assigns practice, it&rsquo;ll show up here.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} tone="error">
              {overdue.map((a) => openCard(a, 'overdue'))}
            </Section>
          )}
          {upcoming.length > 0 && (
            <Section title="Upcoming" count={upcoming.length}>
              {upcoming.map((a) => openCard(a))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title="Completed" count={past.length}>
              {past.map((a) => {
                const pct = a.score_total ? Math.round((a.score_correct / a.score_total) * 100) : 0;
                return (
                  <Card key={a.id} padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                          {a.completed_at ? `Completed ${new Date(a.completed_at).toLocaleDateString()}` : 'Completed'}
                        </div>
                      </div>
                      <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: pct >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                        {a.score_correct}/{a.score_total}
                      </span>
                      {a.session_id && (
                        <Button variant="outline" size="sm" onClick={() => go('session-detail', { id: a.session_id })}>Review</Button>
                      )}
                    </div>
                    <FeedbackNote text={a.feedback} />
                  </Card>
                );
              })}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, count, tone, children }) {
  return (
    <section>
      <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)', color: tone === 'error' ? 'var(--error)' : 'var(--ink-1)' }}>
        {title} <span style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>({count})</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </section>
  );
}

export default StudentAssignments;
