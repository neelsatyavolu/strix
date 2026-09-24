'use client';
import React from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import s from './Chat.module.css';
import { cx } from '../core/cx';

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
    <div className={cx(s.msg, mine && s.mine)} style={styleProp}>
      {attachment && <div className={s.attachment}>{attachment}</div>}
      <div className={cx(s.bubble, showTail && (mine ? s.tailMine : s.tailTheirs))}>
        <span ref={textRef} />
      </div>
      {time && <span className={s.time}>{time}</span>}
    </div>
  );
}

function Dots({ small = false }) {
  return (
    <span className={s.dots} aria-hidden="true">
      <span className={cx(s.dot, small && s.dotSm)} />
      <span className={cx(s.dot, small && s.dotSm)} />
      <span className={cx(s.dot, small && s.dotSm)} />
    </span>
  );
}

/**
 * TypingBubble — iMessage-style "…" indicator shown while the other person is
 * typing. A 'theirs' bubble with three bouncing dots and no label.
 */
export function TypingBubble() {
  return (
    <div className={s.msg} role="status" aria-label="Typing">
      <div className={s.dotsBubble}><Dots /></div>
    </div>
  );
}

/**
 * ThinkingBubble — animated "Thinking" indicator shown while the tutor/AI
 * composes a reply. Styled as a 'theirs' bubble with a label + bouncing dots.
 */
export function ThinkingBubble({ label = 'Thinking' }) {
  return (
    <div className={s.msg} role="status">
      <div className={s.dotsBubble}>
        <span className={s.thinkingLabel}>{label}</span>
        <Dots small />
      </div>
    </div>
  );
}
