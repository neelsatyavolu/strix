import React from 'react';

/** ScoreBadge — the iconic Sixteen score numeral. */
export function ScoreBadge({
  value,           // number, e.g. 1480
  max = 1600,
  label,           // e.g. "Total score" or "R&W"
  domain = null,   // 'rw' | 'math' | null
  size = 'lg',     // 'sm' | 'md' | 'lg' | 'xl'
  trend = null,    // e.g. '+40'
  style: styleProp,
}) {
  const FZ = { sm: 28, md: 40, lg: 56, xl: 72 };
  const COLOR =
    domain === 'rw'   ? 'var(--rw-color)'   :
    domain === 'math' ? 'var(--math-color)' :
    'var(--ink-1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...styleProp }}>
      {label && (
        <span style={{
          font: 'var(--role-eyebrow)', textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)',
        }}>{label}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          fontSize: FZ[size],
          letterSpacing: '-0.04em',
          color: COLOR,
          lineHeight: 1,
        }}>{value}</span>
        <span style={{
          font: 'var(--role-body)', color: 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
        }}>/ {max}</span>
        {trend != null && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600, fontSize: 12,
            color: String(trend).startsWith('-') ? 'var(--error)' : 'var(--success)',
            background: String(trend).startsWith('-') ? 'var(--error-soft)' : 'var(--success-soft)',
            padding: '2px 6px', borderRadius: 'var(--radius-sm)', marginLeft: 4,
          }}>{trend}</span>
        )}
      </div>
    </div>
  );
}
