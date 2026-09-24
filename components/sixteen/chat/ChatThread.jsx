'use client';
import React from 'react';
import s from './Chat.module.css';
import { cx } from '../core/cx';
import { MessageBubble, TypingBubble, ThinkingBubble } from './MessageBubble';

// Distance from the bottom (px) that still counts as "reading the latest".
const PIN_SLOP = 72;

/**
 * ChatThread — scrolling list of bubbles. Keeps the view pinned to the newest
 * message only while the reader is already near the bottom, so new messages
 * never yank someone who scrolled up. Call `ref.current.pin()` before sending
 * to force the next update to scroll down.
 *
 * messages: [{ id, side: 'mine' | 'theirs', text, time? }]
 */
export const ChatThread = React.forwardRef(function ChatThread(
  { messages, typing = false, thinking = false, empty = null, className, style },
  ref,
) {
  const elRef = React.useRef(null);
  const pinnedRef = React.useRef(true);

  React.useImperativeHandle(ref, () => ({ pin: () => { pinnedRef.current = true; } }), []);

  React.useLayoutEffect(() => {
    const el = elRef.current;
    if (!el || !pinnedRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, typing, thinking]);

  const onScroll = () => {
    const el = elRef.current;
    if (el) pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_SLOP;
  };

  const isEmpty = messages.length === 0 && !typing && !thinking;

  return (
    <div
      ref={elRef}
      onScroll={onScroll}
      className={cx(s.thread, className)}
      style={style}
      role="log"
      aria-live="polite"
    >
      {isEmpty && empty ? (
        <div className={s.threadEmpty}>
          {empty.title && <p className={s.threadEmptyTitle}>{empty.title}</p>}
          {empty.body && <p className={s.threadEmptyBody}>{empty.body}</p>}
        </div>
      ) : (
        <>
          {messages.map((m) => <MessageBubble key={m.id} side={m.side} text={m.text} time={m.time} />)}
          {thinking && <ThinkingBubble />}
          {typing && <TypingBubble />}
        </>
      )}
    </div>
  );
});
