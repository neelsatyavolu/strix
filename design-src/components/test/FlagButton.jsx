import React from 'react';

/**
 * FlagButton — Bluebook "Mark for Review" pill. Outline + outline-flag when
 * idle; solid orange flag when marked, with the wording flipping to
 * "Marked for Review".
 */
export function FlagButton({ marked = false, onClick, style: styleProp }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marked}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        font: 'var(--role-label)',
        fontWeight: 500,
        fontSize: 13,
        background: 'transparent',
        color: '#1D1D1F',
        border: 'none',
        borderRadius: 0,
        cursor: 'pointer',
        transition: 'var(--xn-color)',
        ...styleProp,
      }}
    >
      <FlagIcon size={14} filled={marked} color={marked ? 'var(--test-flag)' : '#1D1D1F'} />
      {marked ? 'Marked for Review' : 'Mark for Review'}
    </button>
  );
}

function FlagIcon({ size = 14, color, filled }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M3 1.5v13" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
      <path d="M3 2.5h9l-2 3 2 3H3z"
        fill={filled ? color : 'transparent'}
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
