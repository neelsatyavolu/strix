'use client';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useAssignments } from '@/lib/data/hooks';

// StudentAssignments — the student's view of tutor-assigned practice, split into
// overdue / upcoming / completed, with the tutor's feedback shown inline.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const MODULE_LABEL = { m1: 'Module 1', easy: 'Module 2A', hard: 'Module 2B' };

function bbLabel(t) { return t ? `Bluebook ${t}` : 'Question Bank'; }

// One-line description of an assignment, scaled to its type.
function typeMeta(a) {
  if (a.mode === 'mock-exam') return `Full SAT · ${bbLabel(a.bluebook_test)}`;
  if (a.mode === 'mock-full') return `${SECTION_LABEL[a.section]} section · ${bbLabel(a.bluebook_test)}`;
  if (a.mode === 'mock-m1') return `${SECTION_LABEL[a.section]} ${MODULE_LABEL[a.module_key] || 'Module 1'} · ${bbLabel(a.bluebook_test)}`;
  return `${SECTION_LABEL[a.section]} · ${a.question_count} questions`;
}

// A full SAT has no single section, so it gets a 'SAT' chip.
function TypeBadge({ assignment: a, Badge }) {
  if (a.mode === 'mock-exam') return <Badge variant="neutral" dot>SAT</Badge>;
  return <Badge variant={a.section} dot>{a.section === 'rw' ? 'R&W' : 'Math'}</Badge>;
}

// Completed-score cell — exam/section show the scaled estimate; drill/module raw.
function ScoreCell({ assignment: a }) {
  const numStyle = (color) => ({ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color });
  if (a.mode === 'mock-exam' || a.mode === 'mock-full') {
    return a.scaled_score != null ? <span style={numStyle('var(--text-primary)')}>{a.scaled_score}</span> : null;
  }
  const pct = a.score_total ? Math.round((a.score_correct / a.score_total) * 100) : 0;
  return <span style={numStyle(pct >= 75 ? 'var(--success)' : 'var(--warning)')}>{a.score_correct}/{a.score_total}</span>;
}

// A full SAT opens the composite test-review; everything else the session detail.
function reviewTarget(a) {
  if (!a.session_id) return null;
  if (a.mode === 'mock-exam') return ['test-review', { rwId: a.session_id, mathId: a.session_id_2 }];
  return ['session-detail', { id: a.session_id }];
}

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

  const openCard = (a, tone) => (
    <Card key={a.id} padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <TypeBadge assignment={a} Badge={Badge} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
          <div style={{ font: 'var(--role-caption)', color: tone === 'overdue' ? 'var(--error)' : 'var(--text-tertiary)' }}>
            {typeMeta(a)} · {dueText(a.due_at)}
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
                const target = reviewTarget(a);
                return (
                  <Card key={a.id} padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <TypeBadge assignment={a} Badge={Badge} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                          {a.completed_at ? `Completed ${new Date(a.completed_at).toLocaleDateString()}` : 'Completed'}
                        </div>
                      </div>
                      <ScoreCell assignment={a} />
                      {target && (
                        <Button variant="outline" size="sm" onClick={() => go(target[0], target[1])}>Review</Button>
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
