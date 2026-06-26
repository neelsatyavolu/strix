'use client';
import React from 'react';

/**
 * Button — Sixteen's primary CTA. Mac-native feel: tight padding, soft radius,
 * subtle press scale. Variants: primary (filled brand blue), secondary (sunken
 * gray), ghost (transparent), destructive (filled red). Sizes: sm, md, lg.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  style: styleProp,
  ...rest
}) {
  const PAD = {
    sm: '4px 10px',
    md: '6px 14px',
    lg: '9px 18px',
  };
  const FZ = { sm: 12, md: 13, lg: 15 };
  const H = { sm: 24, md: 30, lg: 38 };

  const variants = {
    primary: {
      background: 'var(--brand-blue)',
      color: '#fff',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), 0 1px 1.5px rgba(0,0,0,0.10)',
    },
    secondary: {
      background: 'var(--sunken)',
      color: 'var(--text-primary)',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
    },
    destructive: {
      background: 'var(--error)',
      color: '#fff',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), 0 1px 1.5px rgba(0,0,0,0.10)',
    },
    outline: {
      background: 'var(--paper)',
      color: 'var(--text-primary)',
      boxShadow: 'inset 0 0 0 1px var(--border-2)',
    },
  };

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: H[size],
    padding: PAD[size],
    fontSize: FZ[size],
    fontWeight: 590,
    lineHeight: 1,
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-md)',
    border: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'var(--xn-color), var(--xn-press), box-shadow var(--dur-fast) var(--ease-out)',
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    WebkitAppRegion: 'no-drag',
    ...variants[variant],
    ...styleProp,
  };

  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);

  const hoverStyle = !disabled && hover ? {
    primary:     { background: 'var(--brand-blue-hover)' },
    secondary:   { background: 'var(--border-1)' },
    ghost:       { background: 'var(--sunken)' },
    destructive: { background: '#B82317' },
    outline:     { background: 'var(--canvas)' },
  }[variant] : null;

  const pressStyle = !disabled && press ? { transform: 'scale(0.97)' } : null;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{ ...base, ...hoverStyle, ...pressStyle }}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : icon}
      {children && <span>{children}</span>}
      {iconRight}
    </button>
  );
}

function Spinner({ size }) {
  const d = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  return (
    <svg width={d} height={d} viewBox="0 0 16 16" style={{ animation: 'sixteen-spin 700ms linear infinite' }}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none"/>
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <style>{`@keyframes sixteen-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
