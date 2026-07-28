'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';

// Vocabulary — DSAT-style practice: context fit (~70%) + active production (~30%).
// Progress is per-user in Supabase (Leitner boxes). Bank lives in lib/vocab/bank.ts.

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
  const [category, setCategory] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const [phase, setPhase] = React.useState('hub'); // hub | practice | done
  const [items, setItems] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [sessionLoading, setSessionLoading] = React.useState(false);
  const [results, setResults] = React.useState([]); // { correct, word }
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

  const startPractice = async (cat = category) => {
    setSessionLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ count: '12' });
      if (cat) q.set('category', cat);
      const r = await fetch(`/api/vocab/session?${q}`);
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Could not start');
      const list = j.data.items || [];
      if (!list.length) throw new Error('No words available for this filter.');
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
  const categories = hub?.categories || [];

  const words = React.useMemo(() => {
    let list = hub?.words || [];
    if (category) list = list.filter((w) => w.category === category);
    if (filter === 'due') list = list.filter((w) => w.box === 0 || (w.dueAt && new Date(w.dueAt) <= new Date() && !w.mastered));
    if (filter === 'new') list = list.filter((w) => w.box === 0);
    if (filter === 'learning') list = list.filter((w) => w.box >= 1 && !w.mastered);
    if (filter === 'mastered') list = list.filter((w) => w.mastered);
    return list;
  }, [hub, category, filter]);

  if (phase === 'practice' && items[idx]) {
    return (
      <PracticeCard
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
        Practice high-utility academic words the way the Digital SAT tests them — in context and in use.
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
              Each session mixes short-passage context questions with “use it in a sentence” prompts — closer to Words in Context than flashcard lists.
            </p>
          </Card>

          <div style={{ marginBottom: 14 }}>
            <div style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
              Categories
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Chip active={!category} onClick={() => setCategory(null)}>All</Chip>
              {categories.map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label} · {c.count}
                </Chip>
              ))}
            </div>
          </div>

          {category && (
            <div style={{ marginBottom: 16 }}>
              <Button variant="secondary" size="sm" icon={<Icon name="play" size={12} />} onClick={() => startPractice(category)} disabled={sessionLoading}>
                Practice this category
              </Button>
            </div>
          )}

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
                    gridTemplateColumns: 'minmax(100px, 140px) 1fr auto',
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

function PracticeCard({ item, index, total, onDone, onExit }) {
  if (item.mode === 'produce') {
    return <ProduceStep item={item} index={index} total={total} onDone={onDone} onExit={onExit} />;
  }
  return <ContextStep item={item} index={index} total={total} onDone={onDone} onExit={onExit} />;
}

function ContextStep({ item, index, total, onDone, onExit }) {
  const { Card, Button } = SixteenNS;
  const [picked, setPicked] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (choiceIndex) => {
    if (feedback || submitting) return;
    setPicked(choiceIndex);
    setSubmitting(true);
    try {
      const r = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: item.wordId, mode: 'context', choiceIndex }),
      });
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Submit failed');
      setFeedback(j.data);
    } catch (e) {
      setFeedback({ correct: false, reason: e.message, definition: item.definition, word: item.word });
    } finally {
      setSubmitting(false);
    }
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ padding: '28px 36px', maxWidth: 640 }}>
      <SessionHeader index={index} total={total} mode="Context" category={item.categoryLabel} onExit={onExit} />
      <Card padding="lg">
        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Choose the word or phrase that best completes the passage.
        </div>
        <p style={{ margin: '0 0 20px', font: 'var(--role-body-lg)', color: 'var(--text-primary)', lineHeight: 1.55 }}>
          {item.passage}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(item.choices || []).map((c, i) => {
            const isPick = picked === i;
            const isCorrect = feedback && feedback.correctIndex === i;
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
                  font: 'var(--role-body)', color: 'var(--text-primary)',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', minWidth: 18,
                }}>{letters[i]}</span>
                <span style={{ flex: 1 }}>{c}</span>
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
            {feedback.tip && (
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 12 }}>{feedback.tip}</div>
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

function ProduceStep({ item, index, total, onDone, onExit }) {
  const { Card, Button } = SixteenNS;
  const [text, setText] = React.useState('');
  const [feedback, setFeedback] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    if (feedback || submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: item.wordId, mode: 'produce', sentence: text }),
      });
      const j = await r.json();
      if (!j?.success) throw new Error(j?.error || 'Submit failed');
      setFeedback(j.data);
    } catch (e) {
      setFeedback({ correct: false, reason: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 640 }}>
      <SessionHeader index={index} total={total} mode="Use it" category={item.categoryLabel} onExit={onExit} />
      <Card padding="lg">
        <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 8 }}>
          Write one original sentence using the word so its meaning is clear from context.
        </div>
        <div style={{ marginBottom: 6, font: 'var(--role-title-sm)', color: 'var(--ink-1)' }}>{item.word}</div>
        <div style={{ marginBottom: 16, font: 'var(--role-body)', color: 'var(--text-secondary)' }}>{item.definition}</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!feedback}
          rows={3}
          placeholder={`Use “${item.word}” in a sentence…`}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical',
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-2)', background: 'var(--sunken)',
            font: 'var(--role-body)', color: 'var(--text-primary)',
            marginBottom: 12,
          }}
        />
        {!feedback && (
          <Button variant="primary" disabled={submitting || text.trim().length < 8} onClick={submit}>
            {submitting ? 'Checking…' : 'Check'}
          </Button>
        )}
        {feedback && (
          <div style={{ marginTop: 8 }}>
            <div style={{ font: 'var(--role-label)', color: feedback.correct ? 'var(--success)' : 'var(--error)', marginBottom: 6 }}>
              {feedback.correct ? 'Nice — that works' : 'Try again later'}
            </div>
            {feedback.reason && (
              <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 8 }}>{feedback.reason}</div>
            )}
            {feedback.tip && (
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 12 }}>{feedback.tip}</div>
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

function SessionHeader({ index, total, mode, category, onExit }) {
  const { Button, Badge } = SixteenNS;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <Button variant="ghost" size="sm" onClick={onExit} icon={<Icon name="x" size={14} />}>Exit</Button>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        {index + 1} / {total}
      </span>
      <Badge>{mode}</Badge>
      {category && <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{category}</span>}
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
