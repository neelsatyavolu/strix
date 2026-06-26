'use client';
import React from 'react';

/** Badge — small status pill. */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon = null,
  children,
  style: styleProp,
  ...rest
}) {
  const variants = {
    neutral:  { background: 'var(--sunken)',       color: 'var(--text-secondary)' },
    brand:    { background: 'var(--brand-blue-soft)', color: 'var(--brand-blue-press)' },
    success:  { background: 'var(--success-soft)', color: 'var(--success)' },
    warning:  { background: 'var(--warning-soft)', color: 'var(--warning)' },
    error:    { background: 'var(--error-soft)',   color: 'var(--error)' },
    info:     { background: 'var(--info-soft)',    color: 'var(--info)' },
    rw:       { background: 'var(--rw-soft)',      color: 'var(--rw-color)' },
    math:     { background: 'var(--math-soft)',    color: 'var(--math-color)' },
    solid:    { background: 'var(--ink-1)',        color: '#fff' },
  };
  const PAD = { sm: '1px 6px', md: '2px 8px', lg: '4px 10px' };
  const FZ = { sm: 10, md: 11, lg: 12 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: PAD[size],
        fontSize: FZ[size],
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        borderRadius: 'var(--radius-pill)',
        lineHeight: 1.4,
        textTransform: size === 'sm' ? 'uppercase' : 'none',
        letterSpacing: size === 'sm' ? 'var(--tracking-caps)' : 0,
        whiteSpace: 'nowrap',
        ...variants[variant],
        ...styleProp,
      }}
      {...rest}
    >
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', display: 'inline-block',
        }} />
      )}
      {icon}
      {children}
    </span>
  );
}
