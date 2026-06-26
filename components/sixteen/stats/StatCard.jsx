'use client';
import React from 'react';

/**
 * StatCard — a labelled number with optional sublabel + trend bubble.
 */
export function StatCard({
  label,
  value,
  unit,             // small unit string e.g. '%' or 's'
  sublabel,         // small caption under the value
  trend,            // e.g. '+12'  or '-3'
  domain,           // 'rw' | 'math' | null
  size = 'md',      // 'sm' | 'md' | 'lg'
  align = 'start',  // 'start' | 'center'
  style: styleProp,
}) {
  const FZ = { sm: 24, md: 30, lg: 40 };
  const COLOR =
    domain === 'rw'   ? 'var(--rw-color)'   :
    domain === 'math' ? 'var(--math-color)' :
    'var(--ink-1)';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      ...styleProp,
    }}>
      <span style={{
        font: 'var(--role-eyebrow)', textTransform: 'uppercase',
        letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)',
      }}>{label}</span>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          fontSize: FZ[size],
          letterSpacing: '-0.02em',
          color: COLOR,
          lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ font: 'var(--role-body)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{unit}</span>}
        {trend != null && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600, fontSize: 11,
            color: String(trend).startsWith('-') ? 'var(--error)' : 'var(--success)',
            background: String(trend).startsWith('-') ? 'var(--error-soft)' : 'var(--success-soft)',
            padding: '1px 6px', borderRadius: 'var(--radius-sm)', marginLeft: 4,
          }}>{trend}</span>
        )}
      </div>
      {sublabel && <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{sublabel}</span>}
    </div>
  );
}
