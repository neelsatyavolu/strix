'use client';
import { cx } from '@/components/sixteen/core/cx';
import s from './Flashcard.module.css';

/** Flip card — front shows the word, back shows the definition and memory tip. */
export default function Flashcard({ flipped, onFlip, word, definition, memoryTip }) {
  return (
    <div className={s.stage}>
      <button
        type="button"
        className={cx(s.card, flipped && s.flipped)}
        aria-label={flipped ? `Show the word ${word}` : `Show the definition of ${word}`}
        aria-pressed={flipped}
        onClick={onFlip}
      >
        <span className={cx(s.face, s.front)} aria-hidden={flipped}>
          <span className={s.word}>{word}</span>
          <span className={s.hint}>Do you know this word?</span>
        </span>

        <span className={cx(s.face, s.back)} aria-hidden={!flipped}>
          <span className={s.backWord}>{word}</span>
          <span className={s.definition}>{definition}</span>
          {memoryTip && (
            <span className={s.tip}>
              <span className={s.tipLabel}>How to remember</span>
              <span className={s.tipText}>{memoryTip}</span>
            </span>
          )}
        </span>
      </button>
    </div>
  );
}
