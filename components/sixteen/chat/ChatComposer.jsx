'use client';
import React from 'react';
import s from './Chat.module.css';
import { cx } from '../core/cx';

const MIN_H = 32;
const MAX_H = 120;

/**
 * ChatComposer — iMessage-style text input at the bottom of a chat.
 * Multi-line: Enter sends, Shift+Enter inserts a newline; height grows with content.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Message',
  disabled = false,
  className,
  style: styleProp,
}) {
  const taRef = React.useRef(null);

  // Resize without the classic height:0 collapse (that paints a 1-frame jitter
  // of the whole chat column when the draft clears on send).
  const resize = React.useCallback(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = `${MIN_H}px`;
    if (!value) return;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_H), MAX_H)}px`;
  }, [value]);

  React.useLayoutEffect(() => {
    resize();
  }, [resize]);

  const empty = !value || !value.trim();

  const submit = () => {
    if (empty || disabled) return;
    // Collapse the box before parent clears `value` so stream + composer reflow
    // in one layout pass instead of multi-line → empty → remeasure.
    const el = taRef.current;
    if (el) el.style.height = `${MIN_H}px`;
    onSend?.(value.trim());
  };

  return (
    <form
      className={cx(s.composer, className)}
      style={styleProp}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <textarea
        ref={taRef}
        rows={1}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        className={s.field}
        style={{ height: MIN_H }}
      />
      <button type="submit" disabled={disabled || empty} aria-label="Send" title="Send" className={s.send}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 13V3M3 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
    </form>
  );
}
