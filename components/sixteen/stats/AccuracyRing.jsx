'use client';
import React from 'react';

/**
 * AccuracyRing — circular % progress ring, mono numeral in the middle.
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
  const pct = Math.min(100, Math.max(0, value)) / 100;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6, ...styleProp }}>
      <div style={{ position:'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', fontWeight: 600,
          color: 'var(--text-primary)',
          fontSize: size * 0.30,
          lineHeight: 1,
          gap: size * 0.03,
        }}>
          <span>{Math.round(value)}</span>
          <span style={{ fontSize: size * 0.22, color:'var(--text-tertiary)', fontWeight: 500 }}>%</span>
        </div>
      </div>
      {label && <span style={{ font: 'var(--role-caption)', color: 'var(--text-secondary)' }}>{label}</span>}
    </div>
  );
}
