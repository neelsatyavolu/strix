'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';

// ModuleReview — between Module 1 and the adaptive Module 2A/2B.

function ModuleReview({ go }) {
  const { Card, Button, Badge, StatCard, AccuracyRing, DomainBar } = SixteenNS;
  const session = usePracticeSession();
  const m1 = session.moduleResult(0);
  const [starting, setStarting] = React.useState(false);

  if (!m1) {
    return (
      <div style={{ padding: '40px 48px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ font: 'var(--role-title-md)' }}>No module in progress</h1>
        <p style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>Start a full section to run the adaptive modules.</p>
        <Button variant="primary" onClick={() => go('practice-setup')}>Set up a section</Button>
      </div>
    );
  }

  const sectionLabel = session.section === 'math' ? 'Math' : 'Reading & Writing';
  const sectionColor = session.section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';
  const answered = m1.review.filter((r) => r.response?.value).length;
  const incorrect = answered - m1.correct;
  const skipped = m1.total - answered;
  const variant = session.m2Variant;
  const nextLabel = variant === 'hard' ? 'Module 2B' : 'Module 2A';
  const nextDescription =
    variant === 'hard'
      ? `Module 2 is adaptive. Based on Module 1, your next module is the harder ${nextLabel} — ${m1.total} questions.`
      : `Module 2 is adaptive. Based on Module 1, your next module is ${nextLabel} — ${m1.total} questions.`;

  const rows = m1.review
    .map((x, i) => ({
      n: i + 1,
      label: x.question.domainLabel,
      diff: x.question.difficulty,
      state: !x.response?.value ? 'skipped' : x.isCorrect ? 'correct' : 'incorrect',
      flagged: !!x.response?.flagged,
    }))
    .filter((r) => r.state !== 'correct' || r.flagged);

  const onStart = () => { setStarting(true); session.startModule2(go); };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 880, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>{sectionLabel}</span>
      <h1 style={{ margin: '4px 0 8px', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>
        Module 1 · {m1.correct} of {m1.total}.
      </h1>
      <p style={{ margin: '0 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Module 2 adapts to how you did. Finish both modules in one sitting for the most accurate estimate.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <AccuracyRing value={m1.accuracy} size={88} color={sectionColor} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatCard label="Answered" value={answered} size="sm" />
              <StatCard label="Correct" value={m1.correct} size="sm" />
            </div>
          </div>
          <DomainBar style={{ marginTop: 18 }} segments={[
            { value: m1.correct, label: 'Correct', color: 'var(--correct)' },
            { value: incorrect, label: 'Incorrect', color: 'var(--incorrect)' },
            { value: skipped, label: 'Skipped', color: 'var(--unanswered)' },
          ]} />
        </Card>

        <Card padding="lg">
          <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>Coming up</span>
          <h2 style={{ margin: '6px 0 6px', font: 'var(--role-title-md)' }}>{nextLabel}</h2>
          <p style={{ margin: 0, font: 'var(--role-body-lg)', color: 'var(--text-body)' }}>{nextDescription}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <Button variant="primary" size="lg" loading={starting || session.status === 'loading'} disabled={starting || session.status === 'loading'} onClick={onStart}>
              {starting || session.status === 'loading' ? `Loading ${nextLabel}…` : `Start ${nextLabel}`}
            </Button>
            <Button variant="secondary" onClick={() => go('dashboard')}>Take a break</Button>
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--brand-blue-soft)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Icon name="info" style={{ width: 14, height: 14, color: 'var(--brand-blue)', marginTop: 2 }} />
            <span style={{ font: 'var(--role-caption)', color: 'var(--brand-ink)' }}>
              Getting routed to the harder module is what lets you reach the top of the scale.
            </span>
          </div>
        </Card>
      </div>

      {rows.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <h2 style={{ margin: '0 0 10px', font: 'var(--role-title-md)' }}>Questions to revisit</h2>
          <Card padding="none">
            {rows.map((r, i) => (
              <div key={r.n} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 12, alignItems: 'center',
                padding: '12px 16px', borderTop: i === 0 ? 0 : '1px solid var(--border-1)',
              }}>
                <span style={{ width: 26, height: 26, borderRadius: 4, background: 'var(--ink-1)', color: '#fff', display: 'grid', placeItems: 'center', font: 'var(--role-label)', fontWeight: 700 }}>{r.n}</span>
                <span style={{ font: 'var(--role-body)' }}>{r.label}</span>
                <Badge variant={r.diff === 'H' ? 'warning' : 'neutral'} size="sm">{r.diff === 'H' ? 'Hard' : r.diff === 'E' ? 'Easy' : 'Medium'}</Badge>
                {r.state === 'incorrect' && <Badge variant="error" size="sm">Incorrect</Badge>}
                {r.state === 'skipped' && <Badge variant="neutral" size="sm">Skipped</Badge>}
                {r.state === 'correct' && r.flagged && <Badge variant="warning" size="sm">Marked</Badge>}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

export default ModuleReview;
