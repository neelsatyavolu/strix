'use client';
import React from 'react';
import { isDesktop } from '@/lib/ai/bridge';

/**
 * Titlebar — macOS-style title bar with traffic lights, center title, optional
 * trailing actions. 38px tall with vibrancy-y backdrop.
 *
 * In the desktop app the real macOS traffic lights are drawn by the OS
 * (titleBarStyle: hiddenInset), so we suppress the faux CSS dots there to avoid
 * a doubled set — reserving the same width keeps the native lights clear and the
 * centered title in place.
 */
export function Titlebar({
  title = '',
  trailing = null,         // ReactNode rendered at the right
  trafficLightsActive = true,
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
      {isDesktop() ? (
        // Native OS traffic lights occupy this space — reserve their width (3
        // dots × 12px + 2 gaps × 8px) so the centered title stays aligned.
        <div aria-hidden style={{ width: 52 }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Dot color={trafficLightsActive ? '#FF5F57' : '#C2C2C2'} />
          <Dot color={trafficLightsActive ? '#FEBC2E' : '#C2C2C2'} />
          <Dot color={trafficLightsActive ? '#28C840' : '#C2C2C2'} />
        </div>
      )}
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

function Dot({ color }) {
  return <span style={{
    width: 12, height: 12, borderRadius: '50%', background: color,
    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.20)',
  }}/>;
}
