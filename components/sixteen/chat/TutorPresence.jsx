'use client';
import React from 'react';

/**
 * TutorPresence — small "Tutor connected" pill, sits in the tutor sidebar header.
 */
export function TutorPresence({
  name,
  status = 'online',         // 'online' | 'idle' | 'offline'
  watching = false,          // true while the tutor is actively watching the screen
  style: styleProp,
}) {
  const color =
    status === 'online' ? 'var(--success)' :
    status === 'idle'   ? 'var(--warning)' : 'var(--ink-4)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      ...styleProp,
    }}>
      <span style={{
        position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color,
      }}>
        {watching && <span style={{
          position: 'absolute', inset: -3, borderRadius: '50%',
          border: `1.5px solid ${color}`, opacity: 0.4,
          animation: 'sixteen-ring 1.6s ease-out infinite',
        }}/>}
      </span>
      <span style={{ font: 'var(--role-label)', color: 'var(--text-primary)' }}>{name}</span>
      <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>
        {watching ? '· watching' : status === 'online' ? '· online' : status === 'idle' ? '· idle' : '· offline'}
      </span>
      <style>{`@keyframes sixteen-ring { 0%{transform:scale(0.8); opacity:0.6} 100%{transform:scale(2.4); opacity:0} }`}</style>
    </div>
  );
}
