'use client';
import React from 'react';
import { Button } from '@/components/sixteen';

const wrap = {
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  background: '#FFFFFF',
  textAlign: 'center',
};

export function TestLoading({ label = 'Loading questions…' }) {
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <svg width="28" height="28" viewBox="0 0 16 16" style={{ animation: 'sixteen-spin 700ms linear infinite', color: 'var(--brand-blue)' }}>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" fill="none" />
          <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          <style>{`@keyframes sixteen-spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
        <span style={{ font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
    </div>
  );
}

export function TestMessage({ title, body, onHome, homeLabel = 'Back to setup' }) {
  return (
    <div style={wrap}>
      <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
        <h2 style={{ margin: 0, font: 'var(--role-title-md)', color: 'var(--text-primary)' }}>{title}</h2>
        {body && <p style={{ margin: 0, font: 'var(--role-body)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{body}</p>}
        {onHome && (
          <div style={{ marginTop: 8 }}>
            <Button variant="primary" onClick={onHome}>{homeLabel}</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestMessage;
