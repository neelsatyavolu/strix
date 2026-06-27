'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { ReviewItem } from './ScoreReport';

// SessionDetail — read-only review of one persisted practice session (score +
// per-question right/wrong), loaded from /api/sessions/:id. Works for your own
// history and, for a tutor, a watched student's sessions (RLS-scoped).

const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
const MODE_LABEL = { drill: 'Drill', 'mock-m1': 'Module 1', 'mock-full': 'Full section' };

function SessionDetail({ go, id }) {
  const { Card, Button, Badge } = SixteenNS;
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let on = true;
    fetch(`/api/sessions/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!on) return;
        if (j?.success) setData(j.data);
        else setError(j?.error || 'Could not load this session.');
        setLoading(false);
      })
      .catch(() => { if (on) { setError('Could not load this session.'); setLoading(false); } });
    return () => { on = false; };
  }, [id]);

  const section = data?.section || 'rw';
  const sectionColor = section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';
  const isDrill = (data?.mode || 'drill') === 'drill';
  // For a targeted drill every question shares one domain — surface it.
  const drillCat = isDrill ? (data?.review || []).find((r) => r.question?.domainLabel)?.question?.domainLabel : null;

  return (
    <div style={{ padding: '36px 48px', maxWidth: 920, margin: '0 auto' }}>
      <button
        onClick={() => go('stats')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--text-secondary)', font: 'var(--role-label)', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" style={{ width: 15, height: 15 }} /> Back to Stats
      </button>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>Loading…</div>
      ) : error ? (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>Couldn&apos;t load this session</div>
          <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>{error}</div>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
              {MODE_LABEL[data.mode] || data.mode} · {SECTION_LABEL[section]}{drillCat ? ` · ${drillCat}` : ''}
            </span>
            <Badge variant={section} dot size="sm">{section === 'rw' ? 'R&W' : 'Math'}</Badge>
          </div>
          <h1 style={{ margin: '4px 0 24px', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>
            {data.correct} of {data.total} correct
          </h1>

          <Card padding="xl" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, flexWrap: 'wrap' }}>
              <div>
                <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, color: sectionColor, lineHeight: 1 }}>
                  {isDrill || data.scaled == null ? `${data.accuracy}%` : data.scaled}
                </div>
                <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                  {isDrill || data.scaled == null ? 'Accuracy' : `${SECTION_LABEL[section]} · /800`}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {data.correct} of {data.total} correct · {data.accuracy}% accuracy
                </div>
                {data.byDomain.map((b) => (
                  <div key={b.domain} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 54px', gap: 10, padding: '7px 0', alignItems: 'center' }}>
                    <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{b.label}</span>
                    <div style={{ height: 6, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${b.total ? (b.correct / b.total) * 100 : 0}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
                    </div>
                    <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>{b.correct} / {b.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <h2 style={{ margin: '0 0 12px', font: 'var(--role-title-md)' }}>Question review</h2>
          {data.review.length === 0 ? (
            <Card padding="lg" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>No questions recorded for this session.</Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.review.map((item, i) => (
                <ReviewItem key={item.question.id || i} item={item} n={i + 1} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => go('stats')}>Back to Stats</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default SessionDetail;
