'use client';
import React from 'react';
import renderMathInElement from 'katex/contrib/auto-render';

/**
 * MessageBubble — iMessage-style speech bubble for tutor mode.
 */
export function MessageBubble({
  side = 'theirs',      // 'mine' | 'theirs'
  text,
  attachment,           // optional ReactNode (e.g. a quoted question card)
  time,                 // string e.g. '2:14 PM'
  showTail = true,
  style: styleProp,
}) {
  const mine = side === 'mine';
  const textRef = React.useRef(null);

  // Typeset any LaTeX (\(...\) inline, \[...\] display) the tutor sends, matching
  // QuestionMath's delimiters so AI math replies render instead of showing raw.
  // Set textContent imperatively (rather than via a React child) so KaTeX's DOM
  // mutations don't collide with React reconciliation on the next text update.
  React.useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.textContent = text ?? '';
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
      });
    } catch { /* leave the plain text in place if KaTeX fails */ }
  }, [text]);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: mine ? 'flex-end' : 'flex-start',
      gap: 2,
      ...styleProp,
    }}>
      {attachment && (
        <div style={{
          marginBottom: 4, maxWidth: 280,
        }}>{attachment}</div>
      )}
      <div style={{
        position: 'relative',
        maxWidth: 280,
        padding: '7px 12px',
        background: mine ? 'var(--bubble-mine)' : 'var(--bubble-theirs)',
        color: mine ? 'var(--bubble-mine-fg)' : 'var(--bubble-theirs-fg)',
        borderRadius: 18,
        borderBottomRightRadius: mine && showTail ? 4 : 18,
        borderBottomLeftRadius: !mine && showTail ? 4 : 18,
        font: 'var(--role-body)',
        lineHeight: 1.35,
        wordWrap: 'break-word',
      }}>
        <span ref={textRef} />
      </div>
      {time && (
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{time}</span>
      )}
    </div>
  );
}

/**
 * TypingBubble — iMessage-style "…" indicator shown while the other person is
 * typing. A 'theirs' bubble with three bouncing dots and no label.
 */
export function TypingBubble() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <style>{`
        @keyframes mb-type-bounce { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '9px 13px',
        background: 'var(--bubble-theirs)',
        color: 'var(--bubble-theirs-fg)',
        borderRadius: 18, borderBottomLeftRadius: 4,
      }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'currentColor',
            animation: `mb-type-bounce 1.4s infinite ease-in-out ${i * 0.16}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

/**
 * ThinkingBubble — animated "Thinking" indicator shown while the tutor/AI
 * composes a reply. Styled as a 'theirs' bubble with a label + bouncing dots.
 */
export function ThinkingBubble({ label = 'Thinking' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <style>{`
        @keyframes mb-think-bounce { 0%, 80%, 100% { opacity: .3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
      `}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        maxWidth: 280, padding: '8px 12px',
        background: 'var(--bubble-theirs)',
        color: 'var(--bubble-theirs-fg)',
        borderRadius: 18, borderBottomLeftRadius: 4,
        font: 'var(--role-body)', lineHeight: 1.35,
      }}>
        <span style={{ opacity: 0.7 }}>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'currentColor',
              animation: `mb-think-bounce 1.4s infinite ease-in-out ${i * 0.16}s`,
            }} />
          ))}
        </span>
      </div>
    </div>
  );
}
