'use client';

/** ScoreBadge — a score numeral with its scale (e.g. 1410 / 1600) and optional trend. */
export function ScoreBadge({
  value,
  max = 1600,
  label,
  domain = null,   // 'rw' | 'math' | null
  size = 'lg',     // 'sm' | 'md' | 'lg' | 'xl'
  trend = null,    // e.g. '+40'
  style: styleProp,
}) {
  const FZ = { sm: 24, md: 32, lg: 44, xl: 60 };
  const COLOR =
    domain === 'rw' ? 'var(--rw-color)' :
    domain === 'math' ? 'var(--math-color)' :
    'var(--text-primary)';
  const down = String(trend).startsWith('-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...styleProp }}>
      {label && (
        <span style={{ font: 'var(--role-label)', color: 'var(--text-secondary)' }}>{label}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          fontSize: FZ[size],
          letterSpacing: '-0.025em',
          color: COLOR,
          lineHeight: 1,
        }}>{value}</span>
        <span style={{ font: 'var(--role-body)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>/ {max}</span>
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
    </div>
  );
}
