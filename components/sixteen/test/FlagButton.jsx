'use client';
import React from 'react';
import s from './chrome.module.css';

/**
 * FlagButton — Bluebook "Mark for Review" control. Outline flag when idle;
 * solid orange flag when marked, with the wording flipping to
 * "Marked for Review".
 */
export function FlagButton({ marked = false, onClick, style: styleProp }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marked}
      className={s.flag}
      style={styleProp}
    >
      <FlagIcon size={14} filled={marked} color={marked ? 'var(--test-flag)' : 'var(--test-ink)'} />
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
