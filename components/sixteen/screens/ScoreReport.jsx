'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';
import { usePracticeSession } from '@/components/sixteen/session/SessionContext';

// ScoreReport — after a drill, shows real results + per-question review.
// Falls back to the scaled full-section report for module/full sessions.

function ScoreReport({ go }) {
  const session = usePracticeSession();
  if (session.status === 'submitted' && session.result) {
    if (session.config?.mode === 'drill') return <DrillReport go={go} session={session} />;
    return <SectionReport go={go} session={session} />;
  }
  return <FullSectionReport go={go} />;
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
        Section score · {sectionLabel}
      </span>
      <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>You finished the section.</h1>
      <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Estimated on a representative curve{routedLabel ? `. You were routed to ${routedLabel}.` : '.'} Real scores use College Board&rsquo;s per-form equating.
      </p>

      <Card padding="xl" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 600, color: sectionColor, lineHeight: 1 }}>
              {r.scaled}
            </div>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              {sectionLabel} · /800
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

function ReviewItem({ item, n }) {
  const { Card, Badge } = SixteenNS;
  const [open, setOpen] = React.useState(false);
  const { question: q, response, isCorrect } = item;
  const answered = !!response?.value;
  const yourLetter = response?.value;
  const yourChoice = q.choices.find((c) => c.letter === yourLetter);
  const correctChoices = q.choices.filter((c) => q.correct.includes(c.letter));

  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{String(n).padStart(2, '0')}</span>
        <Badge variant={isCorrect ? 'success' : answered ? 'error' : 'neutral'} dot>
          {isCorrect ? 'Correct' : answered ? 'Incorrect' : 'Skipped'}
        </Badge>
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{q.domainLabel}{q.skillLabel ? ` · ${q.skillLabel}` : ''}</span>
        <span style={{ marginLeft: 'auto', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>Difficulty {q.difficulty}</span>
      </div>

      <div className="cb-stem" style={{ fontSize: 15 }} dangerouslySetInnerHTML={{ __html: q.stemHtml }} />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', margin: '12px 0 4px', font: 'var(--role-body)' }}>
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>Your answer: </span>
          {q.type === 'spr'
            ? <span style={{ fontFamily: 'var(--font-mono)', color: isCorrect ? 'var(--success)' : 'var(--error)' }}>{yourLetter || '—'}</span>
            : <span style={{ color: isCorrect ? 'var(--success)' : 'var(--error)' }}>{yourLetter ? yourLetter : '—'}{yourChoice ? ' · ' : ''}<span dangerouslySetInnerHTML={{ __html: yourChoice?.html || '' }} /></span>}
        </div>
        <div>
          <span style={{ color: 'var(--text-tertiary)' }}>Correct: </span>
          {q.type === 'spr'
            ? <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{q.correct.join(' or ')}</span>
            : <span style={{ color: 'var(--success)' }}>{q.correct.join(', ')}{correctChoices.length ? ' · ' : ''}<span dangerouslySetInnerHTML={{ __html: correctChoices.map((c) => c.html).join(' / ') }} /></span>}
        </div>
      </div>

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

function FullSectionReport({ go }) {
  const { Card, Button, Badge, ScoreBadge } = SixteenNS;
  const d = SixteenData;
  const r = d.scoreReport;

  const cat = (b) => (
    <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px', gap: 8, padding: '8px 0', alignItems: 'center' }}>
      <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{b.label}</span>
      <div style={{ height: 6, background: 'var(--sunken)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${(b.correct / b.total) * 100}%`, height: '100%', background: b.correct === b.total ? 'var(--success)' : 'var(--brand-blue)' }} />
      </div>
      <span style={{ font: 'var(--role-numeric)', color: 'var(--text-secondary)', textAlign: 'right' }}>{b.correct} / {b.total}</span>
    </div>
  );

  return (
    <div style={{ padding: '36px 48px', maxWidth: 980, margin: '0 auto' }}>
      <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
        Practice Score Report · Today
      </span>
      <h1 style={{ margin: '4px 0 0', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>You finished both modules.</h1>
      <p style={{ margin: '4px 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Scored on the official curve. Up {r.delta} from your last full section.
      </p>

      <Card padding="xl" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 28, alignItems: 'center' }}>
          <ScoreBadge value={r.total} max={1600} label="Estimated total" size="xl" trend={`+${r.delta}`} />
          <ScoreBadge value={r.rw} max={800} label="Reading & Writing" domain="rw" size="lg" />
          <ScoreBadge value={r.math} max={800} label="Math" domain="math" size="lg" />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 18 }}>
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ margin: 0, font: 'var(--role-title-md)' }}>Reading &amp; Writing</h2>
            <Badge variant="rw" dot>{r.rw} / 800</Badge>
          </div>
          <div style={{ marginBottom: 8 }}>{r.rwBreakdown.map(cat)}</div>
        </Card>
        <Card padding="lg">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h2 style={{ margin: 0, font: 'var(--role-title-md)' }}>Math</h2>
            <Badge variant="math" dot>{r.math} / 800</Badge>
          </div>
          <div style={{ marginBottom: 8 }}>{r.mathBreakdown.map(cat)}</div>
        </Card>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={() => go('dashboard')}>Back to home</Button>
        <Button variant="secondary" onClick={() => go('stats')}>View all stats →</Button>
      </div>
    </div>
  );
}

export default ScoreReport;
