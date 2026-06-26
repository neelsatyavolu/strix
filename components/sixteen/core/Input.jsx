'use client';
import React from 'react';

/** Input — Mac-native text field. */
export function Input({
  size = 'md',
  variant = 'default',   // 'default' | 'sunken' | 'flat'
  icon = null,
  trailing = null,
  invalid = false,
  disabled = false,
  fullWidth = true,
  type = 'text',
  style: styleProp,
  inputStyle: inputStyleProp,
  ...rest
}) {
  const H = { sm: 26, md: 30, lg: 36 };
  const FZ = { sm: 12, md: 13, lg: 14 };
  const PAD_L = icon ? (size === 'sm' ? 26 : 30) : (size === 'sm' ? 8 : 10);
  const PAD_R = trailing ? (size === 'sm' ? 26 : 30) : (size === 'sm' ? 8 : 10);

  const [focus, setFocus] = React.useState(false);

  const variants = {
    default: {
      background: 'var(--paper)',
      boxShadow: invalid
        ? `inset 0 0 0 1px var(--error)${focus ? ', 0 0 0 3px rgba(217,45,32,0.25)' : ''}`
        : focus
          ? 'inset 0 0 0 1px var(--brand-blue), 0 0 0 3px var(--focus-ring)'
          : 'inset 0 0 0 1px var(--border-3)',
    },
    sunken: {
      background: 'var(--sunken)',
      boxShadow: focus ? 'inset 0 0 0 1px var(--brand-blue), 0 0 0 3px var(--focus-ring)' : 'none',
    },
    flat: {
      background: 'transparent',
      boxShadow: focus ? '0 1px 0 0 var(--brand-blue)' : '0 1px 0 0 var(--border-2)',
      borderRadius: 0,
    },
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: H[size],
        borderRadius: 'var(--radius-md)',
        width: fullWidth ? '100%' : 'auto',
        transition: 'box-shadow var(--dur-fast) var(--ease-out)',
        opacity: disabled ? 0.5 : 1,
        ...variants[variant],
        ...styleProp,
      }}
    >
      {icon && (
        <span style={{ position: 'absolute', left: 8, display: 'flex', color: 'var(--text-tertiary)', fontSize: 14 }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          height: '100%',
          padding: `0 ${PAD_R}px 0 ${PAD_L}px`,
          background: 'transparent',
          border: 0,
          outline: 0,
          font: `var(--weight-regular) ${FZ[size]}px/1 var(--font-sans)`,
          color: 'var(--text-primary)',
          ...inputStyleProp,
        }}
        {...rest}
      />
      {trailing && (
        <span style={{ position: 'absolute', right: 8, display: 'flex', color: 'var(--text-tertiary)', fontSize: 13 }}>
          {trailing}
        </span>
      )}
    </div>
  );
}
