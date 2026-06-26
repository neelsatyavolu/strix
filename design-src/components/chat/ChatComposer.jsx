import React from 'react';

/**
 * ChatComposer — iMessage-style text input at the bottom of the tutor sidebar.
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Message',
  disabled = false,
  style: styleProp,
}) {
  const submit = () => {
    if (!value || !value.trim() || disabled) return;
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
          minHeight: 30,
          maxHeight: 120,
          padding: '6px 12px',
          borderRadius: 18,
          border: '1px solid var(--border-3)',
          background: 'var(--paper)',
          font: 'var(--role-body)',
          color: 'var(--text-primary)',
          outline: 'none',
          resize: 'none',
          fontFamily: 'var(--font-sans)',
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
