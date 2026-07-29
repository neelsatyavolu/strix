'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';

// Vocabulary — flashcard (know / flip) + “which passage uses the word correctly?”
// Bank: AODEFEN SAT 400. Progress in Supabase (Leitner boxes).

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'due', label: 'Due' },
  { id: 'new', label: 'New' },
  { id: 'learning', label: 'Learning' },
  { id: 'mastered', label: 'Mastered' },
];

function Vocabulary() {
  const { Card, Button } = SixteenNS;
  const [hub, setHub] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [phase, setPhase] = React.useState('hub'); // hub | practice | done
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [sessionLoading, setSessionLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);
  const [hubTick, setHubTick] = React.useState(0);

  const loadHub = React.useCallback(() => { setHubTick((t) => t + 1); }, []);

  React.useEffect(() => {
    let on = true;
    fetch('/api/vocab')
      .then((r) => r.json())
      .then((j) => {
        if (!on) return;
        if (!j?.success) throw new Error(j?.error || 'Failed to load');
        setHub(j.data);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (!on) return;
        setError(e.message || 'Failed to load');
        setLoading(false);
      });
    return () => { on = false; };
  }, [hubTick]);

  const startPractice = async () => {
    setSessionLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ count: '12' });
      const r = await fetch(`/api/vocab/session?${q}`);
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Could not start');
      const list = j.data.items || [];
      if (!list.length) throw new Error('No words available.');
      setItems(list);
      setIdx(0);
      setResults([]);
      setPhase('practice');
    } catch (e) {
      setError(e.message || 'Could not start');
    } finally {
      setSessionLoading(false);
    }
  };

  const onItemDone = (payload) => {
    setResults((prev) => [...prev, { correct: payload.correct, word: payload.word }]);
    if (idx + 1 >= items.length) {
      setPhase('done');
      loadHub();
    } else {
      setIdx((i) => i + 1);
    }
  };

  const summary = hub?.summary;

  const words = React.useMemo(() => {
    let list = hub?.words || [];
    if (filter === 'due') list = list.filter((w) => w.box === 0 || (w.dueAt && new Date(w.dueAt) <= new Date() && !w.mastered));
    if (filter === 'new') list = list.filter((w) => w.box === 0);
    if (filter === 'learning') list = list.filter((w) => w.box >= 1 && !w.mastered);
    if (filter === 'mastered') list = list.filter((w) => w.mastered);
    return list;
  }, [hub, filter]);

  if (phase === 'practice' && items[idx]) {
    return (
      <FlashPractice
        key={items[idx].wordId + idx}
        item={items[idx]}
        index={idx}
        total={items.length}
        onDone={onItemDone}
        onExit={() => { setPhase('hub'); loadHub(); }}
      />
    );
  }

  if (phase === 'done') {
    const correct = results.filter((r) => r.correct).length;
    return (
      <div style={{ padding: '28px 36px', maxWidth: 560 }}>
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <Icon name="check-circle-2" size={32} style={{ color: 'var(--success)' }} />
          <h1 style={{ margin: '12px 0 4px', font: 'var(--role-title-lg)' }}>Session complete</h1>
          <p style={{ margin: '0 0 8px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
            {correct} of {results.length} correct
          </p>
          <p style={{ margin: '0 0 20px', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>
            Due words will resurface on a schedule so they stick.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary" icon={<Icon name="play" size={13} />} onClick={() => startPractice()}>
              Practice again
            </Button>
            <Button variant="secondary" onClick={() => { setPhase('hub'); loadHub(); }}>
              Back to Vocabulary
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Icon name="library" size={22} style={{ color: 'var(--brand-blue)' }} />
        <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Vocabulary</h1>
      </div>
      <p style={{ margin: '4px 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Flashcards from a 400-word Digital SAT list — know it or flip for the definition, then pick which passage uses the word correctly.
      </p>

      {error && (
        <Card padding="md" style={{ marginBottom: 16, borderColor: 'var(--error)', color: 'var(--error)' }}>
          {error}
        </Card>
      )}

      {loading && !hub ? (
        <Card padding="lg" style={{ color: 'var(--text-tertiary)' }}>Loading your vocabulary…</Card>
      ) : (
        <>
          <Card padding="lg" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', marginBottom: 16 }}>
              <Stat n={summary?.due ?? 0} label="Due / new" />
              <Stat n={summary?.learning ?? 0} label="Learning" />
              <Stat n={summary?.mastered ?? 0} label="Mastered" />
              <Stat n={summary?.total ?? hub?.bankSize ?? 0} label="In bank" />
              <div style={{ flex: 1 }} />
              <Button
                variant="primary"
                size="md"
                disabled={sessionLoading}
                icon={<Icon name="play" size={14} />}
                onClick={() => startPractice()}
              >
                {sessionLoading ? 'Starting…' : 'Start practice'}
              </Button>
            </div>
            <p style={{ margin: 0, font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
              Each card: see the word → “I know it” or flip for the definition → choose which passage uses it correctly.
            </p>
          </Card>

          <Card padding="lg">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginRight: 4 }}>
                Browse
              </span>
              {FILTERS.map((f) => (
                <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
              ))}
              <span style={{ marginLeft: 'auto', font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                {words.length} word{words.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 420, overflow: 'auto' }}>
              {words.length === 0 ? (
                <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                  Nothing in this filter yet.
                </div>
              ) : words.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(100px, 160px) 1fr auto',
                    gap: 12,
                    padding: '10px 4px',
                    borderBottom: '1px solid var(--border-1)',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ font: 'var(--role-label)', fontWeight: 600, color: 'var(--text-primary)' }}>{w.word}</span>
                  <span style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>{w.definition}</span>
                  <StatusPill word={w} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/** Two-step card: flash face → usage MCQ. */
function FlashPractice({ item, index, total, onDone, onExit }) {
  const { Card, Button } = SixteenNS;
  const [step, setStep] = React.useState('card'); // card | usage
  const [flipped, setFlipped] = React.useState(false);
  const [picked, setPicked] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const goUsage = () => setStep('usage');

  const submit = async (choiceIndex) => {
    if (feedback || submitting) return;
    setPicked(choiceIndex);
    setSubmitting(true);
    const passage = (item.passages || [])[choiceIndex] || '';
    try {
      const r = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordId: item.wordId,
          mode: 'flash',
          passage,
          flipped,
        }),
      });
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Submit failed');
      setFeedback(j.data);
    } catch (e) {
      setFeedback({
        correct: false,
        reason: e.message,
        definition: item.definition,
        word: item.word,
        correctPassage: item.passages?.[item.correctIndex],
      });
    } finally {
      setSubmitting(false);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];

  if (step === 'card') {
    return (
      <div style={{ padding: '28px 36px', maxWidth: 560 }}>
        <SessionHeader index={index} total={total} mode="Flashcard" onExit={onExit} />
        <Card
          padding="xl"
          style={{
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: flipped ? 'default' : 'pointer',
            userSelect: 'none',
            transition: 'background 0.15s ease',
          }}
          onClick={() => { if (!flipped) setFlipped(true); }}
        >
          {!flipped ? (
            <>
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                Do you know this word?
              </div>
              <div style={{ font: 'var(--role-title-lg)', fontSize: 36, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 12 }}>
                {item.word}
              </div>
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                Tap the card to flip for the definition
              </div>
            </>
          ) : (
            <>
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
                Definition
              </div>
              <div style={{ font: 'var(--role-title-sm)', color: 'var(--ink-1)', marginBottom: 10 }}>
                {item.word}
              </div>
              <div style={{ font: 'var(--role-body-lg)', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 400 }}>
                {item.definition}
              </div>
            </>
          )}
        </Card>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!flipped ? (
            <>
              <Button variant="primary" size="md" onClick={goUsage}>
                I know it
              </Button>
              <Button variant="secondary" size="md" icon={<Icon name="refresh-cw" size={13} />} onClick={() => setFlipped(true)}>
                Flip card
              </Button>
            </>
          ) : (
            <Button variant="primary" size="md" onClick={goUsage}>
              Check usage
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 640 }}>
      <SessionHeader index={index} total={total} mode="Usage" onExit={onExit} />
      <Card padding="lg">
        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 6 }}>
          In which passage is the word used correctly?
        </div>
        <div style={{ font: 'var(--role-title-sm)', color: 'var(--ink-1)', marginBottom: 4 }}>
          {item.word}
        </div>
        {(flipped || feedback) && (
          <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 16 }}>
            {item.definition}
          </div>
        )}
        {!flipped && !feedback && (
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 16 }}>
            Choose the passage where “{item.word}” is used with the right meaning.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(item.passages || []).map((passage, i) => {
            const isPick = picked === i;
            const isCorrect = feedback && (feedback.correctPassage ? passage === feedback.correctPassage : i === item.correctIndex);
            const isWrong = feedback && isPick && !feedback.correct;
            let bg = 'var(--sunken)';
            let border = '1px solid var(--border-2)';
            if (isCorrect) { bg = 'rgba(34, 160, 90, 0.12)'; border = '1px solid var(--success)'; }
            if (isWrong) { bg = 'rgba(220, 50, 50, 0.1)'; border = '1px solid var(--error)'; }
            return (
              <button
                key={i}
                type="button"
                disabled={!!feedback || submitting}
                onClick={() => submit(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                  padding: '12px 14px', borderRadius: 'var(--radius-md)',
                  background: bg, border, cursor: feedback ? 'default' : 'pointer',
                  font: 'var(--role-body)', color: 'var(--text-primary)', lineHeight: 1.45,
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', minWidth: 18,
                }}>{letters[i]}</span>
                <span style={{ flex: 1 }}>{passage}</span>
              </button>
            );
          })}
        </div>

        {feedback && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-1)' }}>
            <div style={{ font: 'var(--role-label)', color: feedback.correct ? 'var(--success)' : 'var(--error)', marginBottom: 6 }}>
              {feedback.correct ? 'Correct' : 'Not quite'}
            </div>
            <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{feedback.word || item.word}</strong>
              {' — '}
              {feedback.definition || item.definition}
            </div>
            {!feedback.correct && feedback.correctPassage && (
              <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 12, padding: '10px 12px', background: 'rgba(34, 160, 90, 0.08)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ font: 'var(--role-caption)', color: 'var(--success)', display: 'block', marginBottom: 4 }}>Correct usage</span>
                {feedback.correctPassage}
              </div>
            )}
            <Button variant="primary" onClick={() => onDone({ correct: !!feedback.correct, word: item.word })}>
              {index + 1 >= total ? 'Finish' : 'Next'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function SessionHeader({ index, total, mode, onExit }) {
  const { Button, Badge } = SixteenNS;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <Button variant="ghost" size="sm" onClick={onExit} icon={<Icon name="x" size={14} />}>Exit</Button>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        {index + 1} / {total}
      </span>
      <Badge>{mode}</Badge>
      <div style={{ flex: 1 }} />
      <div style={{ width: 120, height: 4, background: 'var(--sunken)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${((index + 1) / total) * 100}%`, height: '100%', background: 'var(--brand-blue)' }} />
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div style={{ font: 'var(--role-numeric)', fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1 }}>
        {n}
      </div>
      <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
        {label}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 999,
        border: active ? '1px solid var(--brand-blue)' : '1px solid var(--border-2)',
        background: active ? 'var(--brand-blue)' : 'var(--sunken)',
        color: active ? '#fff' : 'var(--text-secondary)',
        font: 'var(--role-caption)',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function StatusPill({ word }) {
  let label = 'New';
  let color = 'var(--text-tertiary)';
  if (word.mastered) { label = 'Mastered'; color = 'var(--success)'; }
  else if (word.box >= 1) { label = 'Learning'; color = 'var(--brand-blue)'; }
  return (
    <span style={{ font: 'var(--role-caption)', color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

export default Vocabulary;
