'use client';
import React from 'react';
import { Icon } from '../Icon';

export function ModuleReview({
  title,
  items,
  onSelect,
  onBack,
  onSubmit,
  submitDisabled = false,
}) {
  const answered = items.filter((it) => it.status === 'answered').length;
  const marked = items.filter((it) => it.marked).length;

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--test-canvas)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 48px' }}>
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>
          {title}
        </span>
        <h1 style={{ margin: '4px 0 8px', font: 'var(--role-title-lg)', color: 'var(--ink-1)' }}>
          Check your work.
        </h1>
        <p style={{ margin: '0 0 22px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
          {answered} of {items.length} answered{marked ? ` · ${marked} marked for review` : ''}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 10 }}>
          {items.map((it) => (
            <button
              key={it.n}
              type="button"
              onClick={() => onSelect?.(it.n)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: 'var(--paper)',
                border: '1px solid var(--border-1)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              <span style={{
                width: 30,
                height: 30,
                borderRadius: 4,
                display: 'grid',
                placeItems: 'center',
                background: it.status === 'answered' ? 'var(--test-fill)' : 'transparent',
                color: it.status === 'answered' ? 'var(--test-fill-fg)' : 'var(--ink-1)',
                border: it.status === 'answered' ? 0 : '1.5px dashed var(--ink-3)',
                font: 'var(--role-label)',
                fontWeight: 700,
              }}>
                {it.n}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>
                  {it.status === 'answered' ? 'Answered' : 'Unanswered'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: 'var(--role-caption)', color: it.marked ? 'var(--test-flag)' : 'var(--text-tertiary)' }}>
                  {it.marked && <Icon name="flag" size={12} />}
                  {it.marked ? 'For review' : 'Not marked'}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button type="button" onClick={onBack} style={reviewBtn('ghost')}>
            Back to questions
          </button>
          <button type="button" disabled={submitDisabled} onClick={onSubmit} style={reviewBtn('primary', submitDisabled)}>
            Submit module
          </button>
        </div>
      </div>
    </div>
  );
}

function reviewBtn(kind, disabled = false) {
  if (kind === 'primary') {
    return {
      padding: '9px 22px',
      background: disabled ? 'var(--ink-5)' : 'var(--test-button)',
      color: '#fff',
      border: 0,
      borderRadius: 'var(--radius-pill)',
      font: 'var(--role-body)',
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.7 : 1,
    };
  }
  return {
    padding: '9px 18px',
    background: 'transparent',
    color: 'var(--ink-1)',
    border: '1.5px solid var(--ink-1)',
    borderRadius: 'var(--radius-pill)',
    font: 'var(--role-body)',
    fontWeight: 600,
    cursor: 'pointer',
  };
}

export default ModuleReview;
