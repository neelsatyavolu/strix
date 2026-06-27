'use client';
import React from 'react';

/**
 * TestFooter — Bluebook-style footer: name/student left, current question +
 * palette toggle center, Back / Next right.
 */
export function TestFooter({
  studentName = '',
  current = 1,
  total = 27,
  onPalette,
  paletteOpen = false,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  nextTitle,
  style: styleProp,
}) {
  return (
    <footer style={{
      height: 'var(--test-footer-height)',
      background: 'var(--test-canvas)',
      borderTop: '1px solid var(--test-rule)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 24px',
      ...styleProp,
    }}>
      <div style={{ font: 'var(--role-body)', fontWeight: 600, color: 'var(--ink-1)' }}>
        {studentName}
      </div>
      <button
        type="button"
        onClick={onPalette}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 14px',
          background: 'var(--ink-1)',
          color: '#fff',
          borderRadius: 'var(--radius-pill)',
          border: 0,
          font: 'var(--role-body)',
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.10)',
        }}
      >
        Question {current} of {total}
        <span style={{ display:'inline-flex', transform: paletteOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease-out)', fontSize: 10 }}>▴</span>
      </button>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onBack}
          style={btnStyle({ kind: 'ghost' })}
        >Back</button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          title={nextTitle}
          style={btnStyle({ kind: 'next', disabled: nextDisabled })}
        >{nextLabel}</button>
      </div>
    </footer>
  );
}

function btnStyle({ kind, disabled }) {
  if (kind === 'next') {
    return {
      padding: '9px 24px',
      background: disabled ? 'var(--ink-5)' : 'var(--test-button)',
      color: '#fff',
      borderRadius: 'var(--radius-pill)',
      border: 0,
      font: 'var(--role-body)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      transition: 'background var(--dur-fast) var(--ease-out)',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.10)',
    };
  }
  return {
    padding: '9px 18px',
    background: 'transparent',
    color: 'var(--ink-1)',
    border: '1.5px solid var(--ink-1)',
    borderRadius: 'var(--radius-pill)',
    font: 'var(--role-body)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background var(--dur-fast) var(--ease-out)',
  };
}
