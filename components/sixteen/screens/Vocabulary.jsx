'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';

// Vocabulary — flashcard (know / flip) + “which passage uses the word correctly?”
// Bank: AODEFEN SAT 500. Progress in Supabase (Leitner boxes).

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'To learn' },
  { id: 'known', label: 'Known' },
  { id: 'due', label: 'Due' },
  { id: 'learning', label: 'Learning' },
];

/** Full main-pane shell: flex-fills AppShell, centers content, responsive padding. */
const shellStyle = {
  flex: 1,
  alignSelf: 'stretch',
  width: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
  padding: 'clamp(16px, 3.5vh, 36px) clamp(16px, 4vw, 48px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'auto',
};

function shellInner(maxWidth) {
  return {
    width: '100%',
    maxWidth,
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  };
}

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
  const [query, setQuery] = React.useState('');

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
  const knownCount = React.useMemo(
    () => (hub?.words || []).filter((w) => w.known).length,
    [hub],
  );
  const bankSize = summary?.total ?? hub?.bankSize ?? 0;

  const words = React.useMemo(() => {
    let list = hub?.words || [];
    if (filter === 'todo') list = list.filter((w) => !w.known);
    if (filter === 'known') list = list.filter((w) => w.known);
    if (filter === 'due') {
      list = list.filter((w) => !w.known && (w.box === 0 || (w.dueAt && new Date(w.dueAt) <= new Date())));
    }
    if (filter === 'learning') list = list.filter((w) => !w.known && w.box >= 1 && (w.timesSeen || 0) > 0);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((w) =>
        w.word.toLowerCase().includes(q) || (w.definition || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [hub, filter, query]);

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
      <div style={shellStyle}>
        <div style={{
          ...shellInner(520),
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Card padding="xl" style={{ textAlign: 'center', width: '100%' }}>
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
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={shellInner(960)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexShrink: 0 }}>
          <Icon name="library" size={22} style={{ color: 'var(--brand-blue)' }} />
          <h1 style={{ margin: 0, font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>Vocabulary</h1>
        </div>
        <p style={{ margin: '4px 0 18px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)', flexShrink: 0 }}>
          Flashcards from a 500-word Digital SAT list — know it or flip for the definition, then pick which passage uses the word correctly.
        </p>

        {error && (
          <Card padding="md" style={{ marginBottom: 16, borderColor: 'var(--error)', color: 'var(--error)', flexShrink: 0 }}>
            {error}
          </Card>
        )}

        {loading && !hub ? (
          <Card padding="lg" style={{ color: 'var(--text-tertiary)' }}>Loading your vocabulary…</Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
            <Card padding="lg" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-end', marginBottom: 16 }}>
                <Stat n={knownCount} label="Known" />
                <Stat n={Math.max(0, bankSize - knownCount)} label="To learn" />
                <Stat n={summary?.due ?? 0} label="Due" />
                <Stat n={summary?.learning ?? 0} label="Learning" />
                <div style={{ flex: 1, minWidth: 12 }} />
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
              <div style={{
                height: 6,
                borderRadius: 3,
                background: 'var(--sunken)',
                overflow: 'hidden',
                marginBottom: 10,
              }}>
                <div style={{
                  width: bankSize ? `${(knownCount / bankSize) * 100}%` : '0%',
                  height: '100%',
                  background: 'var(--success)',
                  transition: 'width 0.2s ease',
                }} />
              </div>
              <p style={{ margin: 0, font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
                {knownCount} of {bankSize} known — earned only by “I know it” (no flip) + correct usage.
                Flip to study first and the word stays in practice even when you answer correctly.
              </p>
            </Card>

            <Card padding="lg" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginRight: 4 }}>
                  Word list
                </span>
                {FILTERS.map((f) => (
                  <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
                ))}
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search words…"
                  style={{
                    marginLeft: 'auto',
                    minWidth: 140,
                    maxWidth: 220,
                    flex: '1 1 140px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-2)',
                    background: 'var(--sunken)',
                    font: 'var(--role-caption)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {words.length}
                </span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px minmax(100px, 150px) 1fr',
                gap: 10,
                padding: '0 4px 8px',
                font: 'var(--role-caption)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-caps)',
                borderBottom: '1px solid var(--border-1)',
                flexShrink: 0,
              }}>
                <span title="Known">✓</span>
                <span>Word</span>
                <span>Definition</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1, minHeight: 0, overflow: 'auto' }}>
                {words.length === 0 ? (
                  <div style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)', padding: '12px 0' }}>
                    Nothing in this filter yet.
                  </div>
                ) : words.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px minmax(100px, 150px) 1fr',
                      gap: 10,
                      padding: '10px 4px',
                      borderBottom: '1px solid var(--border-1)',
                      alignItems: 'center',
                      background: w.known ? 'rgba(34, 160, 90, 0.04)' : 'transparent',
                    }}
                  >
                    <span
                      aria-label={w.known ? 'Known' : 'Not known yet'}
                      style={{
                        font: 'var(--role-label)',
                        fontWeight: 700,
                        color: w.known ? 'var(--success)' : 'var(--border-2)',
                        textAlign: 'center',
                      }}
                    >
                      {w.known ? '✓' : '·'}
                    </span>
                    <span style={{
                      font: 'var(--role-label)',
                      fontWeight: 600,
                      color: w.known ? 'var(--success)' : 'var(--text-primary)',
                    }}>
                      {w.word}
                    </span>
                    <span style={{ font: 'var(--role-body)', color: 'var(--text-secondary)' }}>
                      {w.definition}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
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
      <div style={shellStyle}>
        <div style={shellInner(640)}>
          <SessionHeader index={index} total={total} mode="Flashcard" onExit={onExit} />
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 16,
            padding: 'clamp(8px, 2vh, 24px) 0',
          }}>
            <FlipCard flipped={flipped} onFlip={() => setFlipped((f) => !f)} word={item.word} definition={item.definition} memoryTip={item.memoryTip} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
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
                <>
                  <Button variant="primary" size="md" onClick={goUsage}>
                    Check usage
                  </Button>
                  <Button variant="secondary" size="md" icon={<Icon name="refresh-cw" size={13} />} onClick={() => setFlipped(false)}>
                    Flip back
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={shellInner(720)}>
        <SessionHeader index={index} total={total} mode="Usage" onExit={onExit} />
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(4px, 1.5vh, 16px) 0',
        }}>
          <Card padding="lg" style={{
            width: '100%',
            maxHeight: '100%',
            overflow: 'auto',
            boxSizing: 'border-box',
          }}>
            <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 6, textAlign: 'center' }}>
              In which passage is the word used correctly?
            </div>
            <div style={{ font: 'var(--role-title-sm)', color: 'var(--ink-1)', marginBottom: 4, textAlign: 'center' }}>
              {item.word}
            </div>
            {!feedback && (
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginBottom: 16, textAlign: 'center' }}>
                Choose the passage where “{item.word}” is used with the right meaning.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(item.passages || []).map((passage, i) => {
                const isPick = picked === i;
                // Highlight the option that was correct for THIS quiz (not bank canonical)
                const isCorrectOpt = feedback && i === item.correctIndex;
                const isWrong = feedback && isPick && !feedback.correct;
                let bg = 'var(--sunken)';
                let border = '1px solid var(--border-2)';
                if (isCorrectOpt) { bg = 'rgba(34, 160, 90, 0.12)'; border = '1px solid var(--success)'; }
                if (isWrong) { bg = 'rgba(220, 50, 50, 0.1)'; border = '1px solid var(--error)'; }
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!!feedback || submitting}
                    onClick={() => submit(i)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                      padding: 'clamp(12px, 1.6vh, 16px) 14px', borderRadius: 'var(--radius-md)',
                      background: bg, border, cursor: feedback ? 'default' : 'pointer',
                      font: 'var(--role-body)', color: 'var(--text-primary)', lineHeight: 1.45,
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-tertiary)', minWidth: 18,
                    }}>{letters[i]}</span>
                    <span style={{ flex: 1 }}>{passage}</span>
                    {isCorrectOpt && (
                      <span style={{ font: 'var(--role-caption)', color: 'var(--success)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Correct
                      </span>
                    )}
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
                {/* Always show the right passage for this quiz (right or wrong pick) */}
                {(item.passages || [])[item.correctIndex] && (
                  <div style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', marginBottom: 12, padding: '10px 12px', background: 'rgba(34, 160, 90, 0.08)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ font: 'var(--role-caption)', color: 'var(--success)', display: 'block', marginBottom: 4 }}>
                      {feedback.correct ? 'Right answer' : 'Correct usage'}
                    </span>
                    {(item.passages || [])[item.correctIndex]}
                  </div>
                )}
                {(feedback.memoryTip || item.memoryTip) && (
                  <div style={{
                    font: 'var(--role-body)',
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                    padding: '10px 12px',
                    background: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <span style={{ font: 'var(--role-caption)', color: 'var(--brand-blue)', display: 'block', marginBottom: 4 }}>How to remember</span>
                    {feedback.memoryTip || item.memoryTip}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Button variant="primary" onClick={() => onDone({ correct: !!feedback.correct, word: item.word })}>
                    {index + 1 >= total ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/** 3D flip card — front = word, back = definition + memory tip. */
function FlipCard({ flipped, onFlip, word, definition, memoryTip }) {
  const faceBase = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 24,
    boxSizing: 'border-box',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--surface-card)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-1)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    overflow: 'auto',
  };

  return (
    <div
      style={{
        flex: '1 1 auto',
        minHeight: 'min(420px, 52vh)',
        maxHeight: 'min(560px, 68vh)',
        width: '100%',
        perspective: 1400,
        perspectiveOrigin: '50% 50%',
        // Explicit height so absolute faces have something to fill
        height: 'min(520px, 60vh)',
      }}
    >
      <button
        type="button"
        aria-label={flipped ? 'Flip card back to word' : 'Flip card to definition'}
        onClick={onFlip}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          padding: 0,
          margin: 0,
          background: 'transparent',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
          transition: 'transform var(--dur-slower) var(--ease-out)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          // Soft lift while hovering the card
          filter: flipped ? 'none' : undefined,
        }}
      >
        {/* Front — word */}
        <div style={{ ...faceBase, transform: 'rotateY(0deg)', zIndex: flipped ? 0 : 1 }}>
          <div style={{
            font: 'var(--role-caption)',
            color: 'var(--text-tertiary)',
            marginBottom: 20,
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-caps)',
          }}>
            Do you know this word?
          </div>
          <div style={{
            font: 'var(--role-title-lg)',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 700,
            color: 'var(--ink-1)',
            marginBottom: 16,
            lineHeight: 1.15,
          }}>
            {word}
          </div>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
            Tap to flip for the definition
          </div>
        </div>

        {/* Back — definition + mnemonic */}
        <div style={{
          ...faceBase,
          transform: 'rotateY(180deg)',
          zIndex: flipped ? 1 : 0,
        }}>
          <div style={{
            font: 'var(--role-caption)',
            color: 'var(--text-tertiary)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: 'var(--tracking-caps)',
          }}>
            Definition
          </div>
          <div style={{
            font: 'var(--role-title-sm)',
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            color: 'var(--ink-1)',
            marginBottom: 14,
          }}>
            {word}
          </div>
          <div style={{
            font: 'var(--role-body-lg)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            maxWidth: 440,
            padding: '0 12px',
            marginBottom: memoryTip ? 18 : 0,
          }}>
            {definition}
          </div>
          {memoryTip && (
            <div style={{
              maxWidth: 440,
              width: '100%',
              margin: '0 12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.18)',
              textAlign: 'left',
              boxSizing: 'border-box',
            }}>
              <div style={{
                font: 'var(--role-caption)',
                color: 'var(--brand-blue)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--tracking-caps)',
                marginBottom: 6,
              }}>
                How to remember
              </div>
              <div style={{
                font: 'var(--role-body)',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}>
                {memoryTip}
              </div>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

function SessionHeader({ index, total, mode, onExit }) {
  const { Button, Badge } = SixteenNS;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
      flexWrap: 'wrap',
      flexShrink: 0,
      width: '100%',
    }}>
      <Button variant="ghost" size="sm" onClick={onExit} icon={<Icon name="x" size={14} />}>Exit</Button>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        {index + 1} / {total}
      </span>
      <Badge>{mode}</Badge>
      <div style={{ flex: 1, minWidth: 8 }} />
      <div style={{ width: 'min(140px, 28vw)', height: 4, background: 'var(--sunken)', borderRadius: 2, overflow: 'hidden' }}>
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

export default Vocabulary;
