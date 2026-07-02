'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { compositeScore, compositeRange } from '@/lib/scoring/curve';
import { ReviewList } from './ScoreReport';

// TestReview — read-only review of a full SAT (both sections together), loaded
// from the two persisted half-sessions. Composes the 400–1600 composite from
// each half and lays out both section breakdowns and question reviews.

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

function TestReview({ go, rwId, mathId }) {
  const { Card, Button } = SixteenNS;
  const [halves, setHalves] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let on = true;
    const ids = [rwId, mathId].filter(Boolean);
    Promise.all(ids.map((id) => fetch(`/api/sessions/${id}`).then((r) => r.json())))
      .then((results) => {
        if (!on) return;
        const ok = results.filter((j) => j?.success).map((j) => j.data);
        if (!ok.length) setError(results[0]?.error || 'Could not load this test.');
        else setHalves(ok);
        setLoading(false);
      })
      .catch(() => { if (on) { setError('Could not load this test.'); setLoading(false); } });
    return () => { on = false; };
  }, [rwId, mathId]);

  const rw = halves?.find((h) => h.section === 'rw') || null;
  const math = halves?.find((h) => h.section === 'math') || null;
  const total = rw && math ? compositeScore(rw.scaled, math.scaled) : null;
  const totalRange = rw?.scaledRange && math?.scaledRange ? compositeRange(rw.scaledRange, math.scaledRange) : null;
  const ordered = [rw, math].filter(Boolean);

  return (
    <div style={{ padding: '36px 48px', maxWidth: 920, margin: '0 auto' }}>
      <button
        onClick={() => go('practice-tests')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-secondary)', font: 'var(--role-label)', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" style={{ width: 15, height: 15 }} /> Back to Practice Tests
      </button>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : error ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>Couldn&apos;t load this test</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>{error}</div>
        </Card>
      ) : (
        <>
          <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
            Full SAT · Estimate
          </span>
          <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Test review</h1>
          <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
            Calibrated SAT estimate, with a confidence range based on College Board&rsquo;s published measurement error.
          </p>

          <Card padding="xl" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 72, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1 }}>
                {total ?? '—'}
              </div>
              <div>
                <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                  {total != null ? 'Estimated / 1600' : 'One section missing'}
                </div>
                {totalRange && (
                  <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    Likely {totalRange.lower}–{totalRange.upper}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
              {ordered.map((s) => (
                <SectionTile key={s.section} s={s} />
              ))}
            </div>
          </Card>

          {ordered.map((s) => (
            <div key={s.section} style={{ marginBottom: 8 }}>
              <h2 style={{ margin: '18px 0 12px', font: 'var(--role-title-md)' }}>{SECTION_LABEL[s.section]} · review</h2>
              {s.review.length === 0 ? (
                <Card padding="lg" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No questions recorded for this section.</Card>
              ) : (
                <ReviewList review={s.review} />
              )}
            </div>
          ))}

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => go('practice-tests')}>Back to Practice Tests</Button>
          </div>
        </>
      )}
    </div>
  );
}

function SectionTile({ s }) {
  const { Card } = SixteenNS;
  const color = s.section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';
  return (
    <Card padding="lg">
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        {SECTION_LABEL[s.section]}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
        <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 40, fontWeight: 600, color }}>{s.scaled ?? '—'}</span>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>/800</span>
        {s.scaledRange && (
          <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>· likely {s.scaledRange.lower}–{s.scaledRange.upper}</span>
        )}
      </div>
      <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', margin: '4px 0 10px' }}>
        {s.correct} of {s.total} correct · {s.accuracy}%
      </div>
      {s.byDomain.map((b) => (
        <div key={b.domain} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 48px', gap: 8, padding: '5px 0', alignItems: 'center' }}>
          <span style={{ font: 'var(--role-caption)', color: 'var(--text-primary)' }}>{b.label}</span>
          <div style={{ height: 5, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${b.total ? (b.correct / b.total) * 100 : 0}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
          </div>
          <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right', fontSize: 12 }}>{b.correct}/{b.total}</span>
        </div>
      ))}
    </Card>
  );
}

export default TestReview;
