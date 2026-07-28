'use client';
import React from 'react';

const MIN_H = 30;
const MAX_H = 120;

/**
 * ChatComposer — iMessage-style text input at the bottom of the tutor sidebar.
 * Multi-line: Enter sends, Shift+Enter inserts a newline; height grows with content.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Message',
  disabled = false,
  style: styleProp,
}) {
  const taRef = React.useRef(null);

  // Resize without the classic height:0 collapse (that paints a 1-frame jitter
  // of the whole chat column when the draft clears on send).
  const resize = React.useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    if (!value) {
      el.style.height = `${MIN_H}px`;
      return;
    }
    // Grow/shrink from current height using scrollHeight; clamp to range.
    el.style.height = `${MIN_H}px`;
    const next = Math.min(Math.max(el.scrollHeight, MIN_H), MAX_H);
    el.style.height = `${next}px`;
  }, [value]);

  React.useLayoutEffect(() => {
    resize();
  }, [resize]);

  const submit = () => {
    if (!value || !value.trim() || disabled) return;
    // Collapse the box before parent clears `value` so stream + composer reflow
    // in one layout pass instead of multi-line → empty → remeasure.
    const el = taRef.current;
    if (el) el.style.height = `${MIN_H}px`;
    onSend?.(value.trim());
  };
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        padding: 10,
        borderTop: '1px solid var(--border-1)',
        background: 'var(--surface-titlebar)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        ...styleProp,
      }}
    >
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          height: MIN_H,
          minHeight: MIN_H,
          maxHeight: MAX_H,
          padding: '6px 12px',
          borderRadius: 18,
          border: '1px solid var(--border-3)',
          background: 'var(--paper)',
          font: 'var(--role-body)',
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'none',
          overflowY: 'auto',
          lineHeight: '18px',
          fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value?.trim()}
        title="Send"
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: !value?.trim() ? 'var(--ink-5)' : 'var(--brand-blue)',
          color: '#fff',
          border: 0,
          display: 'grid', placeItems: 'center',
          cursor: !value?.trim() ? 'not-allowed' : 'pointer',
          transition: 'background var(--dur-fast) var(--ease-out)',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      </button>
    </form>
  );
}
