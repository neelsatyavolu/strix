'use client';
import React from 'react';

/**
 * Titlebar — macOS-style title bar with a center title and optional trailing
 * actions. 38px tall with vibrancy-y backdrop.
 *
 * The leading slot is reserved for the desktop app's native OS traffic lights
 * (titleBarStyle: hiddenInset); on the website it stays empty.
 */
export function Titlebar({
  title = '',
  trailing = null,         // ReactNode rendered at the right
  style: styleProp,
}) {
  return (
    <div style={{
      height: 'var(--titlebar-height)',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      padding: '0 12px 0 14px',
      gap: 12,
      background: 'var(--surface-titlebar)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border-1)',
      WebkitUserSelect: 'none',
      userSelect: 'none',
      ...styleProp,
    }}>
      {/* Reserve the leading slot: the desktop app fills it with native OS
          traffic lights (titleBarStyle: hiddenInset); the website leaves it
          empty so the centered title stays aligned. */}
      <div aria-hidden style={{ width: 52 }} />
      <div style={{
        textAlign: 'center',
        font: 'var(--role-label)',
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {trailing}
      </div>
    </div>
  );
}
