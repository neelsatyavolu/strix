'use client';
import React from 'react';

/**
 * Timer — mono mm:ss countdown. Pulses softly when under 5 minutes.
 * "Hide" button sits *below* the time (Bluebook layout), not beside it.
 */
export function Timer({
  seconds,
  hidden = false,
  onToggleHide,
  warningAt = 300,
  showHideToggle = true,
  style: styleProp,
}) {
  const m = Math.max(0, Math.floor(seconds / 60));
  const s = Math.max(0, seconds % 60);
  const fmt = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const warn = seconds <= warningAt;

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      color: '#fff', lineHeight: 1, ...styleProp,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: 0.5,
        opacity: hidden ? 0 : 1,
        animation: warn && !hidden ? 'sixteen-pulse 1s ease-in-out infinite' : 'none',
        height: 24,
      }}>{hidden ? ' ' : fmt}</div>
      {showHideToggle && (
        <button
          type="button"
          onClick={onToggleHide}
          style={{
            font: 'var(--role-caption)',
            color: 'rgba(255,255,255,0.95)',
            background: 'transparent',
            border: 0,
            padding: '2px 6px',
            marginTop: 2,
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          {hidden ? 'Show' : 'Hide'}
        </button>
      )}
      <style>{`@keyframes sixteen-pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }`}</style>
    </div>
  );
}
