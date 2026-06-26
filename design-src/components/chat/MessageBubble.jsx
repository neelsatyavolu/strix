import React from 'react';

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
        {text}
      </div>
      {time && (
        <span style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)', marginTop: 2 }}>{time}</span>
      )}
    </div>
  );
}
