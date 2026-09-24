'use client';
import React from 'react';
import { Button, Icon, Kbd } from '@/components/sixteen';
import Flashcard from './Flashcard';
import UsageQuiz from './UsageQuiz';
import { useStudyKeys } from './useStudyKeys';
import s from './Study.module.css';

const PICK_KEYS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
const NEXT_KEYS = new Set(['Enter', 'ArrowRight']);

function SessionBar({ index, total, onExit }) {
  const pct = total ? ((index + 1) / total) * 100 : 0;
  return (
    <div className={s.bar}>
      <Button variant="ghost" size="sm" icon={<Icon name="x" size={14} />} onClick={onExit}>
        End session
      </Button>
      <div className={s.progress} aria-hidden="true">
        <span className={s.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={s.counter}>{index + 1} of {total}</span>
    </div>
  );
}

/** One word: flip card (“I know it” / flip) → usage quiz → onDone. */
export default function StudySession({ item, index, total, onDone, onExit }) {
  const [step, setStep] = React.useState('card'); // card | usage
  const [flipped, setFlipped] = React.useState(false);
  const [picked, setPicked] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const goUsage = () => setStep('usage');
  const flip = () => setFlipped((f) => !f);
  const next = () => onDone({ correct: !!feedback?.correct, word: item.word });

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

  useStudyKeys((key) => {
    if (step === 'card') {
      if (key === ' ') { flip(); return true; }
      if (NEXT_KEYS.has(key)) { goUsage(); return true; }
      return false;
    }
    if (feedback) {
      if (NEXT_KEYS.has(key)) { next(); return true; }
      return false;
    }
    const choice = PICK_KEYS[key.toLowerCase()];
    if (choice != null && choice < (item.passages || []).length) { submit(choice); return true; }
    return false;
  });

  return (
    <div className={s.session}>
      <SessionBar index={index} total={total} onExit={onExit} />

      {step === 'card' ? (
        <div className={s.stack}>
          <Flashcard
            flipped={flipped}
            onFlip={flip}
            word={item.word}
            definition={item.definition}
            memoryTip={item.memoryTip}
          />
          <div className={s.actions}>
            <Button variant="secondary" size="lg" icon={<Icon name="refresh-cw" size={14} />} onClick={flip}>
              {flipped ? 'Flip back' : 'Show definition'}
            </Button>
            <Button variant="primary" size="lg" onClick={goUsage}>
              {flipped ? 'Check usage' : 'I know it'}
            </Button>
          </div>
          <p className={s.keys}>
            <Kbd>Space</Kbd> flip <span className={s.sep} /> <Kbd>Enter</Kbd> {flipped ? 'check usage' : 'I know it'}
          </p>
          {!flipped && (
            <p className={s.note}>Know it without flipping and use it correctly to mark it learned.</p>
          )}
        </div>
      ) : (
        <UsageQuiz
          item={item}
          picked={picked}
          feedback={feedback}
          submitting={submitting}
          onPick={submit}
          onNext={next}
          isLast={index + 1 >= total}
        />
      )}
    </div>
  );
}
