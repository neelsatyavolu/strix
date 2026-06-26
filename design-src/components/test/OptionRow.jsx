import React from 'react';

/**
 * OptionRow — Bluebook-style A/B/C/D answer row.
 *  - Letter circle (sans, bold) on the left
 *  - Text in sans-serif body
 *  - Cross-out button on the right when `showEliminator` is on
 *  - Selected: blue ring + filled circle; Eliminated: 50% opacity + strikethrough
 */
export function OptionRow({
  letter,
  selected = false,
  eliminated = false,
  showEliminator = true,
  onSelect,
  onToggleEliminate,
  children,
  style: styleProp,
}) {
  const [hover, setHover] = React.useState(false);
  const ring = selected ? 'var(--test-selected)' : '#1D1D1F';
  const ringW = selected ? 2 : 1;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !eliminated && onSelect?.()}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: hover && !eliminated && !selected ? '#FAFAFB' : 'transparent',
        border: `${ringW}px solid ${ring}`,
        borderRadius: 'var(--radius-md)',
        cursor: eliminated ? 'default' : 'pointer',
        transition: 'var(--xn-color), border-width var(--dur-fast) var(--ease-out)',
        ...styleProp,
      }}
    >
      <span style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: '50%',
        border: '1.5px solid #1D1D1F',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700, fontSize: 14,
        color: selected ? '#fff' : '#1D1D1F',
        background: selected ? '#1D1D1F' : 'transparent',
      }}>{letter}</span>
      <span style={{
        flex: 1,
        fontFamily: 'var(--font-sans)',
        fontSize: 15, lineHeight: 1.4,
        color: '#1D1D1F',
        textDecoration: eliminated ? 'line-through' : 'none',
        textDecorationThickness: '1.5px',
        opacity: eliminated ? 0.55 : 1,
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
            border: '1.5px solid #1D1D1F',
            background: '#fff',
            color: '#1D1D1F',
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
