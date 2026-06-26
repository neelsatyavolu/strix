'use client';
import React from 'react';

/** Toggle — Mac-native switch (iOS-style). */
export function Toggle({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  description,
  style: styleProp,
}) {
  const W = { sm: 28, md: 34 };
  const H = { sm: 16, md: 20 };
  const knob = H[size] - 4;
  const onColor = 'var(--success)';

  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        width: W[size],
        height: H[size],
        borderRadius: 'var(--radius-pill)',
        background: checked ? onColor : 'var(--ink-5)',
        border: 0,
        padding: 0,
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'var(--xn-color)',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? W[size] - knob - 2 : 2,
          width: knob,
          height: knob,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.20), 0 0 0 0.5px rgba(0,0,0,0.04)',
          transition: 'left var(--dur-fast) var(--ease-out)',
        }}
      />
    </button>
  );

  if (label || description) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer', ...styleProp }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {label && <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{label}</span>}
          {description && <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{description}</span>}
        </div>
        {switchEl}
      </label>
    );
  }
  return switchEl;
}
