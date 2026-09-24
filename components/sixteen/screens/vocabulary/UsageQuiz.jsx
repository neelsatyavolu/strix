'use client';
import { Button, Icon, Kbd } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import s from './UsageQuiz.module.css';

const LETTERS = ['A', 'B', 'C', 'D'];

function optionState(i, { item, picked, feedback }) {
  if (!feedback) return picked === i ? 'pending' : 'idle';
  // Highlight the option that was correct for THIS quiz (not the bank canonical).
  if (i === item.correctIndex) return 'correct';
  if (i === picked && !feedback.correct) return 'wrong';
  return 'dim';
}

function outcomeNote(feedback) {
  if (feedback.reason) return 'We couldn’t save this answer. It will come back next session.';
  if (!feedback.correct) return 'This word stays in rotation so you can try it again.';
  if (feedback.known) return 'Learned — you knew it without flipping.';
  if (feedback.flipped) return 'Nice. It’ll come back until you know it without flipping.';
  return null;
}

/** “Which sentence uses the word correctly?” — options, then feedback + Next. */
export default function UsageQuiz({ item, picked, feedback, submitting, onPick, onNext, isLast }) {
  const passages = item.passages || [];
  const correctPassage = passages[item.correctIndex];
  const note = feedback ? outcomeNote(feedback) : null;

  return (
    <div className={s.quiz}>
      <h2 className={s.prompt}>
        Which sentence uses <em className={s.word}>{item.word}</em> correctly?
      </h2>

      <div className={s.options} role="group" aria-label="Answer choices">
        {passages.map((passage, i) => {
          const state = optionState(i, { item, picked, feedback });
          return (
            <button
              key={i}
              type="button"
              disabled={!!feedback || submitting}
              onClick={() => onPick(i)}
              className={cx(s.option, s[state])}
            >
              <span className={s.letter}>{LETTERS[i]}</span>
              <span className={s.passage}>{passage}</span>
              {state === 'correct' && <Icon name="check" size={16} className={s.mark} />}
              {state === 'wrong' && <Icon name="x" size={16} className={s.mark} />}
            </button>
          );
        })}
      </div>

      {!feedback && (
        <p className={s.keys}>
          Press <Kbd>1</Kbd>–<Kbd>{passages.length || 4}</Kbd> to answer
        </p>
      )}

      {feedback && (
        <div className={cx(s.feedback, feedback.correct ? s.good : s.bad)} role="status">
          <div className={s.verdict}>
            <Icon name={feedback.correct ? 'circle-check' : 'circle-x'} size={18} />
            {feedback.correct ? 'Correct' : 'Not quite'}
          </div>
          <p className={s.definition}>
            <strong>{feedback.word || item.word}</strong> — {feedback.definition || item.definition}
          </p>
          {!feedback.correct && correctPassage && (
            <p className={s.detail}>
              <span className={s.detailLabel}>Correct usage</span>
              {correctPassage}
            </p>
          )}
          {(feedback.memoryTip || item.memoryTip) && (
            <p className={s.detail}>
              <span className={s.detailLabel}>How to remember</span>
              {feedback.memoryTip || item.memoryTip}
            </p>
          )}
          {note && <p className={s.note}>{note}</p>}
          <div className={s.next}>
            <Button variant="primary" onClick={onNext}>
              {isLast ? 'Finish' : 'Next word'}
            </Button>
            <span className={s.keys}>or press <Kbd>Enter</Kbd></span>
          </div>
        </div>
      )}
    </div>
  );
}
