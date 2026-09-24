'use client';
import React from 'react';

/**
 * AccuracyRing — circular % progress ring with a tabular numeral in the middle.
 */
export function AccuracyRing({
  value,                 // 0–100
  size = 72,
  stroke = 8,
  color = 'var(--brand-blue)',
  trackColor = 'var(--sunken)',
  label,                 // small label below
  style: styleProp,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.min(100, Math.max(0, safe)) / 100;
  const mid = size / 2;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, ...styleProp }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={mid} cy={mid} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
          {pct > 0 && (
            <circle
              cx={mid} cy={mid} r={r} fill="none" stroke={color} strokeWidth={stroke}
              strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
              transform={`rotate(-90 ${mid} ${mid})`}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          fontSize: size * 0.28,
          lineHeight: 1,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1 }}>
            <span>{Math.round(safe)}</span>
            <span style={{ fontSize: size * 0.17, color: 'var(--text-tertiary)', fontWeight: 500 }}>%</span>
          </span>
        </div>
      </div>
      {label && <span style={{ font: 'var(--role-caption)', color: 'var(--text-secondary)' }}>{label}</span>}
    </div>
  );
}
