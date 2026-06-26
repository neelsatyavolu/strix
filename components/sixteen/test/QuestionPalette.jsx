'use client';
import React from 'react';

/**
 * QuestionPalette — Bluebook-style numbered grid of questions.
 * Pass `items` as `{n, status, marked}[]` where status is
 * 'current' | 'answered' | 'unanswered'.
 */
export function QuestionPalette({
  items,
  onSelect,
  onReviewAll,
  style: styleProp,
}) {
  return (
    <div style={{
      background: 'var(--paper)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 0,
      width: 420,
      overflow: 'hidden',
      ...styleProp,
    }}>
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border-1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ font: 'var(--role-title-sm)', color: 'var(--ink-1)' }}>
          Section 1, Module 1: Reading and Writing
        </span>
      </div>
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        font: 'var(--role-caption)',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--border-1)',
      }}>
        <Legend swatch={<LocSwatch kind="current" />} label="Current" />
        <Legend swatch={<LocSwatch kind="unanswered" />} label="Unanswered" />
        <Legend swatch={<LocSwatch kind="marked" />} label="For Review" />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 1fr)',
        gap: 6,
        padding: 16,
      }}>
        {items.map(it => <PaletteCell key={it.n} {...it} onClick={() => onSelect?.(it.n)} />)}
      </div>
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-1)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          type="button"
          onClick={onReviewAll}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            color: 'var(--ink-1)',
            border: '1.5px solid var(--ink-1)',
            borderRadius: 'var(--radius-pill)',
            font: 'var(--role-body)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >Go to Review Page</button>
      </div>
    </div>
  );
}

function Legend({ swatch, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {swatch}{label}
    </span>
  );
}
function LocSwatch({ kind }) {
  const base = { width: 18, height: 18, borderRadius: 4, display:'grid', placeItems:'center', position:'relative' };
  if (kind === 'current')    return <span style={{ ...base, background: 'var(--ink-1)' }} />;
  if (kind === 'unanswered') return <span style={{ ...base, background: 'transparent', border: '1.5px dashed var(--ink-3)' }} />;
  if (kind === 'marked')     return <span style={{ ...base, background: '#FFEFD9' }}><Flag size={11} color="var(--test-flag)" /></span>;
  return <span style={base} />;
}

function PaletteCell({ n, status, marked, onClick }) {
  // status: 'current' | 'answered' | 'unanswered'
  const isAnswered = status === 'answered';
  const isCurrent  = status === 'current';
  const base = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    minHeight: 32,
    borderRadius: 4,
    display: 'grid', placeItems: 'center',
    cursor: 'pointer',
    border: 0,
    transition: 'var(--xn-color)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: 13,
  };
  let style;
  if (isCurrent) {
    style = { ...base, background: 'var(--ink-1)', color: '#fff', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10)' };
  } else if (isAnswered) {
    style = { ...base, background: '#1B2A4B', color: '#fff' };
  } else {
    style = { ...base, background: 'transparent', color: 'var(--ink-1)', border: '1.5px dashed var(--ink-3)' };
  }
  return (
    <button type="button" style={style} onClick={onClick}>
      {n}
      {marked && (
        <span style={{ position:'absolute', top:-6, right:-6 }}>
          <Flag size={12} color="var(--test-flag)" />
        </span>
      )}
    </button>
  );
}

function Flag({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M3 1.5v13" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M3 2.5h9l-2 3 2 3H3z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}
