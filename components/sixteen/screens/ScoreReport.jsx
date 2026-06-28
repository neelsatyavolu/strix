'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';

// ScoreReport — drill report or scaled section report, from the live session.

function ScoreReport({ go }) {
  const session = usePracticeSession();
  if (session.status === 'submitted' && session.result) {
    if (session.config?.mode === 'drill') return <DrillReport go={go} session={session} />;
    return <SectionReport go={go} session={session} />;
  }
  return <NoResults go={go} />;
}

function NoResults({ go }) {
  const { Button } = SixteenNS;
  return (
    <div style={{ padding: '60px 48px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ font: 'var(--role-title-md)', margin: '0 0 8px' }}>No results yet</h1>
      <p style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
        Finish a practice session to see your score and review.
      </p>
      <Button variant="primary" onClick={() => go('practice-setup')}>Start practicing</Button>
    </div>
  );
}

function SectionReport({ go, session }) {
  const { Card, Button, Badge } = SixteenNS;
  const r = session.result;
  const sectionLabel = r.section === 'math' ? 'Math' : 'Reading & Writing';
  const sectionColor = r.section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';
  const routedLabel = r.m2Variant === 'hard' ? 'Module 2B (harder)' : r.m2Variant === 'easy' ? 'Module 2A (easier)' : null;

  return (
    <div style={{ padding: '36px 48px', maxWidth: 920, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        Section estimate · {sectionLabel}
      </span>
      <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>You finished the section.</h1>
      <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Practice estimate from a representative curve{routedLabel ? `. This app routed you to ${routedLabel}.` : '.'} Real SAT scores use College Board&rsquo;s private item-level scoring.
      </p>

      <Card padding="xl" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, color: sectionColor, lineHeight: 1 }}>
              {r.scaled}
            </div>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Estimated {sectionLabel} · /800
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              {r.correct} of {r.total} correct · {r.accuracy}% accuracy
            </div>
            {r.byDomain.map((b) => (
              <div key={b.domain} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 54px', gap: 10, padding: '7px 0', alignItems: 'center' }}>
                <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{b.label}</span>
                <div style={{ height: 6, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(b.correct / b.total) * 100}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
                </div>
                <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>{b.correct} / {b.total}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <h2 style={{ margin: '0 0 12px', font: 'var(--role-title-md)' }}>Question review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {r.review.map((item, i) => (
          <ReviewItem key={item.question.id} item={item} n={i + 1} />
        ))}
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={() => { session.reset(); go('dashboard'); }}>Back to home</Button>
        <Button variant="primary" onClick={() => { session.reset(); go('practice-setup', { domain: r.section }); }}>New section</Button>
      </div>
    </div>
  );
}

function DrillReport({ go, session }) {
  const { Card, Button, Badge } = SixteenNS;
  const r = session.result;
  const sectionColor = r.section === 'math' ? 'var(--math-color)' : 'var(--rw-color)';

  return (
    <div style={{ padding: '36px 48px', maxWidth: 860, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        Drill results · {r.section === 'math' ? 'Math' : 'Reading & Writing'}
      </span>
      <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>
        You answered {r.correct} of {r.total} correctly.
      </h1>
      <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Review what you missed below — the explanation is what moves your score.
      </p>

      <Card padding="xl" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, color: sectionColor, lineHeight: 1 }}>
              {r.accuracy}%
            </div>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>Accuracy</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            {r.byDomain.map((b) => (
              <div key={b.domain} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 54px', gap: 10, padding: '7px 0', alignItems: 'center' }}>
                <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{b.label}</span>
                <div style={{ height: 6, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(b.correct / b.total) * 100}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
                </div>
                <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>{b.correct} / {b.total}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <h2 style={{ margin: '0 0 12px', font: 'var(--role-title-md)' }}>Question review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {r.review.map((item, i) => (
          <ReviewItem key={item.question.id} item={item} n={i + 1} />
        ))}
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={() => { session.reset(); go('dashboard'); }}>Back to home</Button>
        <Button variant="primary" onClick={() => { session.reset(); go('practice-setup', { domain: r.section }); }}>Practice again</Button>
      </div>
    </div>
  );
}

export function ReviewItem({ item, n }) {
  const { Card, Badge } = SixteenNS;
  const [open, setOpen] = React.useState(false);
  const { question: q, response, isCorrect } = item;
  const answered = !!response?.value;
  const yourLetter = response?.value;
  const isMcq = q.type !== 'spr' && (q.choices?.length ?? 0) > 0;
  const correct = Array.isArray(q.correct) ? q.correct : [];

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{String(n).padStart(2, '0')}</span>
        <Badge variant={isCorrect ? 'success' : answered ? 'error' : 'neutral'} dot>
          {isCorrect ? 'Correct' : answered ? 'Incorrect' : 'Skipped'}
        </Badge>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{q.domainLabel}{q.skillLabel ? ` · ${q.skillLabel}` : ''}</span>
        {item.isPretest && <Badge variant="neutral" size="sm">Unscored</Badge>}
        <span style={{ marginLeft: 'auto', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>Difficulty {q.difficulty}</span>
      </div>

      <div className="cb-stem" style={{ fontSize: 15 }} dangerouslySetInnerHTML={{ __html: q.stemHtml }} />

      {isMcq ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0 4px' }}>
          {q.choices.map((o) => {
            const isCorrectChoice = correct.includes(o.letter);
            const isYours = yourLetter === o.letter;
            const tone = isCorrectChoice ? 'var(--success)' : isYours ? 'var(--error)' : null;
            return (
              <div key={o.letter} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
                padding: '9px 12px', borderRadius: 8,
                border: `1px solid ${tone || 'var(--border-1)'}`,
                background: tone ? `color-mix(in srgb, ${tone} 8%, transparent)` : 'transparent',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                  font: 'var(--role-label)', fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${tone || 'var(--border-2)'}`, color: tone || 'var(--text-secondary)',
                }}>{o.letter}</span>
                <span className="cb-choice" style={{ font: 'var(--role-body)' }} dangerouslySetInnerHTML={{ __html: o.html }} />
                {isCorrectChoice ? <span style={{ font: 'var(--role-caption)', color: 'var(--success)', fontWeight: 600 }}>Correct</span>
                  : isYours ? <span style={{ font: 'var(--role-caption)', color: 'var(--error)', fontWeight: 600 }}>Your answer</span> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '12px 0 4px', font: 'var(--role-body)' }}>
          <div>
            <span style={{ color: 'var(--text-tertiary)' }}>Your answer: </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--success)' : 'var(--error)' }}>{yourLetter || '—'}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-tertiary)' }}>Correct: </span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{correct.join(' or ') || '—'}</span>
          </div>
        </div>
      )}

      {q.rationaleHtml && (
        <button onClick={() => setOpen((o) => !o)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 0, cursor: 'pointer', font: 'var(--role-label)', color: 'var(--brand-blue)', padding: '4px 0' }}>
          <Icon name={open ? 'chevron-down' : 'chevron-right'} size={14} /> {open ? 'Hide explanation' : 'Show explanation'}
        </button>
      )}
      {open && q.rationaleHtml && (
        <div className="cb-stem" style={{ fontSize: 14, marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border-1)', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: q.rationaleHtml }} />
      )}
    </Card>
  );
}

export default ScoreReport;
