'use client';
import React from 'react';
import { cx } from '../core/cx';
import s from './OptionRow.module.css';

/**
 * OptionRow — Bluebook-style A/B/C/D answer row.
 *  - Letter circle (sans, bold) on the left
 *  - Text in sans-serif body
 *  - Cross-out button on the right when `showEliminator` is on
 *  - Selected: ring + filled circle; Eliminated: 55% opacity + strikethrough
 *  - General-practice feedback: `feedback='correct'` (green) | 'wrong' (red,
 *    struck, locked out). `locked` makes the whole question non-interactive once
 *    solved. Tried-wrong and locked options ignore clicks.
 *  - Keyboard: clickable rows are focusable; Enter/Space selects.
 */
export function OptionRow({
  letter,
  selected = false,
  eliminated = false,
  showEliminator = true,
  feedback = null, // null | 'correct' | 'wrong'
  locked = false,
  // Optional trailing caption (e.g. tutor mirror: "Correct", "Student · Correct").
  endLabel = null,
  onSelect,
  onToggleEliminate,
  children,
  style: styleProp,
}) {
  const isCorrect = feedback === 'correct';
  const isWrong = feedback === 'wrong';
  const clickable = !eliminated && !locked && !isWrong;
  const struck = eliminated || isWrong;

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return; // let the eliminator button handle its own keys
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    onSelect?.();
  };

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-pressed={clickable ? selected : undefined}
      onClick={() => clickable && onSelect?.()}
      onKeyDown={clickable ? onKeyDown : undefined}
      className={cx(
        s.row,
        clickable && s.clickable,
        isCorrect ? s.correct : isWrong ? s.wrong : selected && s.selected,
      )}
      style={styleProp}
    >
      <span className={s.letter}>{letter}</span>
      <span className={cx(s.text, struck && s.struck)}>{children}</span>
      {endLabel ? <span className={s.endLabel}>{endLabel}</span> : null}
      {showEliminator && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleEliminate?.(); }}
          title={eliminated ? 'Undo cross-out' : 'Cross out this option'}
          aria-label={eliminated ? `Undo cross-out of choice ${letter}` : `Cross out choice ${letter}`}
          className={cx(s.elim, eliminated && s.elimUndo)}
        >
          {eliminated ? 'Undo' : letter}
        </button>
      )}
    </div>
  );
}
