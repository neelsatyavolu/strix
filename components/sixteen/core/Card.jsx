'use client';
import React from 'react';

/** Card — neutral raised surface. */
export function Card({
  padding = 'md',
  elevation = 'xs',
  interactive = false,
  selected = false,
  as: Tag = 'div',
  onClick,
  style: styleProp,
  children,
  ...rest
}) {
  const PAD = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  };
  const SHADOW = {
    none: 'none',
    xs: 'var(--shadow-xs)',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
  };
  const [hover, setHover] = React.useState(false);

  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        padding: PAD[padding],
        boxShadow: selected
          ? '0 0 0 2px var(--brand-blue), var(--shadow-sm)'
          : interactive && hover
            ? 'var(--shadow-sm)'
            : SHADOW[elevation],
        cursor: interactive ? 'pointer' : 'default',
        transition: 'var(--xn-elev)',
        transform: interactive && hover ? 'translateY(-1px)' : 'none',
        ...styleProp,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
