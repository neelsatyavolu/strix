'use client';
import React from 'react';

/**
 * StatCard — a labelled number with optional unit, sublabel and trend bubble.
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
  const FZ = { sm: 22, md: 28, lg: 38 };
  const COLOR =
    domain === 'rw'   ? 'var(--rw-color)'   :
    domain === 'math' ? 'var(--math-color)' :
    'var(--text-primary)';
  const down = String(trend).startsWith('-');
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      ...styleProp,
    }}>
      <span style={{ font: 'var(--role-label)', color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          fontSize: FZ[size] ?? FZ.md,
          letterSpacing: '-0.02em',
          color: COLOR,
          lineHeight: 1,
        }}>{value}</span>
        {unit && <span style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{unit}</span>}
        {trend != null && (
          <span style={{
            font: 'var(--role-label)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: down ? 'var(--error)' : 'var(--success)',
            background: down ? 'var(--error-soft)' : 'var(--success-soft)',
            padding: '1px 6px', borderRadius: 'var(--radius-pill)', marginLeft: 4,
          }}>{trend}</span>
        )}
      </div>
      {sublabel && <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{sublabel}</span>}
    </div>
  );
}
