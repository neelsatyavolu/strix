'use client';
import React from 'react';

/** IconButton — square button for icon-only actions (toolbars, titlebar, palette). */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  active = false,
  disabled = false,
  label,
  onClick,
  children,
  style: styleProp,
  ...rest
}) {
  const D = { sm: 22, md: 28, lg: 34 };
  const FZ = { sm: 14, md: 16, lg: 18 };

  const variants = {
    ghost: {
      background: active ? 'var(--sunken)' : 'transparent',
      color: 'var(--text-primary)',
    },
    solid: {
      background: 'var(--sunken)',
      color: 'var(--text-primary)',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)',
    },
    primary: {
      background: 'var(--brand-blue)',
      color: '#fff',
    },
    test: { // for use in test header — translucent on dark navy
      background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
      color: '#fff',
    },
  };

  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const hoverBg = !disabled && hover ? {
    ghost:   { background: 'var(--sunken)' },
    solid:   { background: 'var(--border-1)' },
    primary: { background: 'var(--brand-blue-hover)' },
    test:    { background: 'rgba(255,255,255,0.14)' },
  }[variant] : null;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: D[size],
        height: D[size],
        fontSize: FZ[size],
        borderRadius: 'var(--radius-md)',
        border: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'var(--xn-color), var(--xn-press)',
        transform: press && !disabled ? 'scale(0.92)' : 'none',
        ...variants[variant],
        ...hoverBg,
        ...styleProp,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
