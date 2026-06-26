import React from 'react';

/** Kbd — keyboard shortcut hint. ⌘ K-style. */
export function Kbd({ children, style: styleProp }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 4px',
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-secondary)',
        background: 'var(--paper)',
        boxShadow: '0 0 0 0.5px var(--border-3), 0 1px 0 0 var(--border-3)',
        borderRadius: 4,
        ...styleProp,
      }}
    >
      {children}
    </kbd>
  );
}
