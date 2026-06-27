'use client';
import React from 'react';

/**
 * OptionRow — Bluebook-style A/B/C/D answer row.
 *  - Letter circle (sans, bold) on the left
 *  - Text in sans-serif body
 *  - Cross-out button on the right when `showEliminator` is on
 *  - Selected: blue ring + filled circle; Eliminated: 50% opacity + strikethrough
 *  - General-practice feedback: `feedback='correct'` (green) | 'wrong' (red,
 *    struck, locked out). `locked` makes the whole question non-interactive once
 *    solved. Tried-wrong and locked options ignore clicks.
 */
export function OptionRow({
  letter,
  selected = false,
  eliminated = false,
  showEliminator = true,
  feedback = null, // null | 'correct' | 'wrong'
  locked = false,
  onSelect,
  onToggleEliminate,
  children,
  style: styleProp,
}) {
  const [hover, setHover] = React.useState(false);
  const isCorrect = feedback === 'correct';
  const isWrong = feedback === 'wrong';
  const clickable = !eliminated && !locked && !isWrong;
  const ring = isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : selected ? 'var(--test-selected)' : 'var(--test-line)';
  const ringW = selected || isCorrect || isWrong ? 2 : 1;
  const circleBg = isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : selected ? 'var(--test-fill)' : 'transparent';
  const circleBorder = isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--test-line)';
  const struck = eliminated || isWrong;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => clickable && onSelect?.()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: hover && clickable && !selected ? 'var(--test-option-hover)' : 'transparent',
        border: `${ringW}px solid ${ring}`,
        borderRadius: 'var(--radius-md)',
        cursor: clickable ? 'pointer' : 'default',
        transition: 'var(--xn-color), border-width var(--dur-fast) var(--ease-out)',
        ...styleProp,
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: '50%',
        border: `1.5px solid ${circleBorder}`,
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700, fontSize: 14,
        color: (isCorrect || isWrong) ? '#fff' : selected ? 'var(--test-fill-fg)' : 'var(--test-ink)',
        background: circleBg,
      }}>{letter}</span>
      <span style={{
        flex: 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 15, lineHeight: 1.4,
        color: 'var(--test-ink)',
        textDecoration: struck ? 'line-through' : 'none',
        textDecorationThickness: '1.5px',
        opacity: struck ? 0.55 : 1,
      }}>{children}</span>
      {showEliminator && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleEliminate?.(); }}
          title={eliminated ? 'Undo cross-out' : 'Cross out this option'}
          style={{
            flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28,
            borderRadius: '50%',
            border: '1.5px solid var(--test-line)',
            background: 'var(--test-canvas)',
            color: 'var(--test-ink)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontWeight: 700, fontSize: 13,
            textDecoration: eliminated ? 'none' : 'line-through',
            textDecorationThickness: '1.8px',
          }}
        >{eliminated ? 'Undo' : letter}</button>
      )}
    </div>
  );
}
