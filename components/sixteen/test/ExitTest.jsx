'use client';
import React from 'react';
import { Icon } from '@/components/sixteen';

// ExitTest — header "Exit" control for the in-test surface. Targeted/general
// practice ('drill') and spaced-repetition review keep their progress so the
// session can be resumed later; full modules, sections and exams discard
// everything, so we warn before leaving.
export function ExitTest({ mode, onConfirm }) {
  const [open, setOpen] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const isDrill = mode === 'drill' || mode === 'review';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title="Exit session"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '4px 8px',
          background: hover ? 'rgba(255,255,255,0.10)' : 'transparent',
          color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4,
          font: 'var(--role-caption)', fontWeight: 500, fontSize: 11,
          transition: 'background var(--dur-fast) var(--ease-out)',
        }}
      >
        <Icon name="log-out" style={{ width: 18, height: 18, color: '#fff' }} />
        <span>Exit</span>
      </button>

      {open && (
        <ConfirmExit
          isDrill={isDrill}
          onCancel={() => setOpen(false)}
          onConfirm={() => { setOpen(false); onConfirm(); }}
        />
      )}
    </>
  );
}

function ConfirmExit({ isDrill, onCancel, onConfirm }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'grid', placeItems: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ width: 420, maxWidth: '90%', background: '#FFFFFF', borderRadius: 10, boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}
      >
        <div style={{ padding: '20px 22px 8px' }}>
          <h2 style={{ margin: 0, font: 'var(--role-title-sm)', color: 'var(--ink-1)' }}>
            {isDrill ? 'Exit practice?' : 'Exit without saving?'}
          </h2>
          <p style={{ margin: '10px 0 0', font: 'var(--role-body)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isDrill ? (
              <>Your progress is saved. You can pick this session back up from your dashboard.</>
            ) : (
              <><strong style={{ color: 'var(--error)' }}>None of this attempt will be saved</strong> — including questions you&rsquo;ve already answered. This can&rsquo;t be undone.</>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '16px 22px 20px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px', background: 'transparent', color: 'var(--ink-1)',
              border: '1.5px solid var(--ink-1)', borderRadius: 'var(--radius-pill)',
              font: 'var(--role-body)', fontWeight: 600, cursor: 'pointer',
            }}
          >{isDrill ? 'Keep practicing' : 'Keep going'}</button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 22px',
              background: isDrill ? 'var(--test-button)' : 'var(--error)',
              color: '#fff', border: 0, borderRadius: 'var(--radius-pill)',
              font: 'var(--role-body)', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 0 0.5px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.10)',
            }}
          >{isDrill ? 'Exit' : 'Exit without saving'}</button>
        </div>
      </div>
    </div>
  );
}

export default ExitTest;
