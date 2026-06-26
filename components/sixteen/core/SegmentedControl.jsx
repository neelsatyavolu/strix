'use client';
import React from 'react';

/** SegmentedControl — Mac-native segmented picker. */
export function SegmentedControl({
  options,                 // [{value, label, icon?}]
  value,
  onChange,
  size = 'md',             // 'sm' | 'md'
  fullWidth = false,
  style: styleProp,
}) {
  const H = { sm: 24, md: 30 };
  const FZ = { sm: 12, md: 13 };
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--sunken)',
        borderRadius: 'var(--radius-md)',
        padding: 2,
        gap: 0,
        height: H[size],
        width: fullWidth ? '100%' : undefined,
        ...styleProp,
      }}
    >
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            style={{
              flex: fullWidth ? 1 : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '0 10px',
              fontSize: FZ[size],
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: selected ? 'var(--paper)' : 'transparent',
              border: 0,
              borderRadius: 'calc(var(--radius-md) - 2px)',
              boxShadow: selected ? '0 0 0 0.5px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'var(--xn-color), box-shadow var(--dur-fast) var(--ease-out)',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
