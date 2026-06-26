'use client';
import React from 'react';

/**
 * Titlebar — macOS-style title bar with traffic lights, center title, optional
 * trailing actions. 38px tall with vibrancy-y backdrop.
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dot color={trafficLightsActive ? '#FF5F57' : '#C2C2C2'} />
        <Dot color={trafficLightsActive ? '#FEBC2E' : '#C2C2C2'} />
        <Dot color={trafficLightsActive ? '#28C840' : '#C2C2C2'} />
      </div>
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
