'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { examBreakCanBegin } from '@/lib/practice/sessionLogic.mjs';

// ExamBreak — the 10-minute break between the R&W and Math sections of a full SAT.
// The clock here is the real break timer; section time does not run during it.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function ExamBreak({ go }) {
  const { Card, Button } = SixteenNS;
  const session = usePracticeSession();
  const exam = session.exam;
  const [seconds, setSeconds] = React.useState(10 * 60);
  const [starting, setStarting] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  if (!exam) {
    return (
      <div style={{ padding: '40px 48px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ font: 'var(--role-title-md)' }}>No exam in progress</h1>
        <Button variant="primary" onClick={() => go('practice-setup')}>Set up a test</Button>
      </div>
    );
  }

  const nextSection = exam.sections[exam.index];
  const justDone = exam.results[exam.results.length - 1];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const canBegin = examBreakCanBegin({ seconds, status: session.status, starting });
  const loadingNext = starting || session.status === 'loading';
  const begin = () => {
    if (!canBegin) return;
    setStarting(true);
    session.startExamNextSection(go);
  };

  return (
    <div style={{ padding: '40px 48px', maxWidth: 720, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>Full SAT · Break</span>
      <h1 style={{ margin: '4px 0 6px', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Take a 10-minute break.</h1>
      <p style={{ margin: '0 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        On test day this is a 10-minute break between sections. Up next: <strong>{SECTION_LABEL[nextSection]}</strong>.
      </p>

      <Card padding="xl" style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontSize: 72, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1 }}>
          {mm}:{ss}
        </div>
        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', marginTop: 6 }}>
          Break remaining
        </div>
      </Card>

      {justDone && (
        <Card padding="lg" style={{ marginBottom: 18 }}>
          <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            {SECTION_LABEL[justDone.section]} · done
          </span>
          <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-body)', marginTop: 4 }}>
            {justDone.correct} of {justDone.total} correct · estimated {justDone.scaled}/800
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="primary" size="lg" loading={loadingNext} disabled={!canBegin} onClick={begin}>
          {loadingNext ? `Loading ${SECTION_LABEL[nextSection]}…` : `Begin ${SECTION_LABEL[nextSection]}`}
        </Button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--brand-blue-soft)', borderRadius: 'var(--radius-md)' }}>
          <Icon name="info" style={{ width: 14, height: 14, color: 'var(--brand-blue)', marginTop: 2 }} />
          <span style={{ font: 'var(--role-caption)', color: 'var(--brand-ink)' }}>
            Once you begin the next section you can&rsquo;t return to {SECTION_LABEL[justDone?.section] || 'the previous section'}.
          </span>
        </div>
      </div>
    </div>
  );
}

export default ExamBreak;
