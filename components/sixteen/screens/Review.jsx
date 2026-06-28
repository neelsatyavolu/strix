'use client';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { useReviewQueue } from '@/lib/data/hooks';

// Review — spaced-repetition practice. Questions you've missed resurface here on
// a schedule; getting one right twice retires it. Runs one section at a time
// because the practice surface is section-specific.

function Review({ go, studentId = null, readOnly = false, studentName = null }) {
  const { Card, Button, Badge } = SixteenNS;
  const session = usePracticeSession();
  const { queue, loading } = useReviewQueue(studentId);

  const count = queue?.count ?? 0;
  const bySection = queue?.bySection ?? { rw: 0, math: 0 };
  const byDomain = queue?.byDomain ?? [];

  const startReview = (section) => {
    if (readOnly) return;
    session.start({ mode: 'review', section });
    go(section === 'math' ? 'math-question' : 'rw-question', { kind: 'drill' });
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Icon name="rotate-ccw" size={22} style={{ color: 'var(--brand-blue)' }} />
        <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Review</h1>
      </div>
      <p style={{ margin: '4px 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        {studentName
          ? `Questions ${studentName.split(' ')[0]} has missed, queued to resurface at the right moment.`
          : 'Questions you’ve missed, brought back at the right moment so they stick.'}
      </p>

      {loading ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)', font: 'var(--role-body)' }}>Loading your review queue…</Card>
      ) : count === 0 ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <Icon name="check-circle-2" size={28} style={{ color: 'var(--success)' }} />
          <div style={{ font: 'var(--role-title-sm)', margin: '8px 0 4px' }}>All caught up</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
            Nothing is due for review right now. Questions you miss in practice will appear here as they come due.
          </div>
          {!readOnly && (
            <div style={{ marginTop: 16 }}>
              <Button variant="primary" onClick={() => go('practice-setup')} icon={<Icon name="play" size={13} />}>Practice instead</Button>
            </div>
          )}
        </Card>
      ) : (
        <>
          <Card padding="lg" style={{ marginBottom: 18 }}>
            <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1 }}>{count}</div>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginBottom: 14 }}>
              question{count === 1 ? '' : 's'} due now
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {['rw', 'math'].map((sec) => (
                <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--sunken)', borderRadius: 'var(--radius-md)' }}>
                  <Badge variant={sec} dot>{sec === 'rw' ? 'R&W' : 'Math'}</Badge>
                  <span style={{ flex: 1, font: 'var(--role-body)', color: 'var(--text-primary)' }}>{bySection[sec]} due</span>
                  <Button variant="primary" size="sm" disabled={!bySection[sec] || readOnly} icon={<Icon name="play" size={12} />} onClick={() => startReview(sec)}>
                    Review
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {byDomain.length > 0 && (
            <Card padding="lg">
              <div style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 10 }}>By topic</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {byDomain.map((d) => (
                  <div key={d.domain} style={{ display: 'flex', justifyContent: 'space-between', font: 'var(--role-body)', color: 'var(--text-primary)' }}>
                    <span>{d.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default Review;
