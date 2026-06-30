'use client';
import * as SixteenNS from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';
import { compositeScore, compositeRange } from '@/lib/scoring/curve';
import { ReviewList } from '@/components/sixteen/screens/ScoreReport';

// ExamReport — full SAT composite (400–1600) from the two section snapshots.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function ExamReport({ go }) {
  const { Card, Button } = SixteenNS;
  const session = usePracticeSession();
  const exam = session.exam;

  if (!exam || exam.results.length < exam.sections.length) {
    return (
      <div style={{ padding: '60px 48px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ font: 'var(--role-title-md)', margin: '0 0 8px' }}>No completed exam</h1>
        <Button variant="primary" onClick={() => go('practice-setup')}>Start a full SAT</Button>
      </div>
    );
  }

  const rw = exam.results.find((r) => r.section === 'rw');
  const math = exam.results.find((r) => r.section === 'math');
  const total = compositeScore(rw?.scaled, math?.scaled);
  const totalRange = rw?.scaledRange && math?.scaledRange ? compositeRange(rw.scaledRange, math.scaledRange) : null;

  return (
    <div style={{ padding: '36px 48px', maxWidth: 920, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        Full SAT · Estimate
      </span>
      <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>You finished the full test.</h1>
      <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Estimate from College Board&rsquo;s official per-test scoring tables, with a confidence range based on CB&rsquo;s published measurement error. Real SAT scores use College Board&rsquo;s private item-level scoring.
      </p>

      <Card padding="xl" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1 }}>
            {total}
          </div>
        <div>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>Estimated / 1600</div>
          {totalRange && (
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              Likely {totalRange.lower}–{totalRange.upper}
            </div>
          )}
        </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
          {[rw, math].filter(Boolean).map((s) => (
            <SectionTile key={s.section} s={s} />
          ))}
        </div>
      </Card>

      {[rw, math].filter(Boolean).map((s) => (
        <div key={s.section} style={{ marginBottom: 8 }}>
          <h2 style={{ margin: '18px 0 12px', font: 'var(--role-title-md)' }}>{SECTION_LABEL[s.section]} · review</h2>
          <ReviewList review={s.review} />
        </div>
      ))}

      <div style={{ marginTop: 22, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={() => { session.reset(); go('dashboard'); }}>Back to home</Button>
        <Button variant="primary" onClick={() => { session.reset(); go('practice-setup'); }}>New test</Button>
      </div>
    </div>
  );
}

function SectionTile({ s }) {
  const { Card } = SixteenNS;
  const color = s.section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';
  const routed = s.m2Variant === 'hard' ? 'Module 2B (harder)' : s.m2Variant === 'easy' ? 'Module 2A (easier)' : null;
  return (
    <Card padding="lg">
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        {SECTION_LABEL[s.section]}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
        <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 600, color }}>{s.scaled}</span>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>/800</span>
        {s.scaledRange && (
          <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>· likely {s.scaledRange.lower}–{s.scaledRange.upper}</span>
        )}
      </div>
      <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
        {s.correct} of {s.total} correct · {s.accuracy}%{routed ? ` · ${routed}` : ''}
      </div>
      {s.byDomain.map((b) => (
        <div key={b.domain} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 48px', gap: 8, padding: '5px 0', alignItems: 'center' }}>
          <span style={{ font: 'var(--role-caption)', color: 'var(--text-primary)' }}>{b.label}</span>
          <div style={{ height: 5, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(b.correct / b.total) * 100}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
          </div>
          <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontSize: 12 }}>{b.correct}/{b.total}</span>
        </div>
      ))}
    </Card>
  );
}

export default ExamReport;
