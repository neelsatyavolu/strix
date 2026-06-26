'use client';
import React from 'react';

/** Tabs — minimal Mac-native tab bar with underline indicator. */
export function Tabs({
  tabs,                 // [{value, label, count?}]
  value,
  onChange,
  variant = 'underline', // 'underline' | 'pill'
  style: styleProp,
}) {
  if (variant === 'pill') {
    return (
      <div style={{
        display: 'inline-flex', gap: 2, padding: 3,
        background: 'var(--sunken)', borderRadius: 'var(--radius-md)',
        ...styleProp,
      }}>
        {tabs.map(t => {
          const sel = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange?.(t.value)}
              style={{
                padding: '5px 12px',
                font: 'var(--role-label)',
                color: sel ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: sel ? 'var(--paper)' : 'transparent',
                border: 0,
                borderRadius: 'calc(var(--radius-md) - 2px)',
                boxShadow: sel ? '0 0 0 0.5px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer', transition: 'var(--xn-color)',
              }}
            >
              {t.label}
              {t.count != null && (
                <span style={{ marginLeft: 6, opacity: 0.6, fontFeatureSettings: 'tnum' }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div style={{
      display: 'flex', gap: 4, borderBottom: '1px solid var(--border-1)',
      ...styleProp,
    }}>
      {tabs.map(t => {
        const sel = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange?.(t.value)}
            style={{
              padding: '8px 12px',
              font: 'var(--role-body)',
              fontWeight: sel ? 590 : 500,
              color: sel ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: 'transparent',
              border: 0,
              borderBottom: sel ? '2px solid var(--brand-blue)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              transition: 'var(--xn-color)',
            }}
          >
            {t.label}
            {t.count != null && (
              <span style={{ marginLeft: 6, font: 'var(--role-caption)', color: 'var(--text-tertiary)', fontFeatureSettings: 'tnum' }}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
