'use client';
import React from 'react';

/**
 * QuestionNumberBadge — dark filled rounded-square chip with the question
 * number in white, plus a thin horizontal rule that extends across the row.
 * `flag` is rendered to the right of the rule (typically a FlagButton).
 */
export function QuestionNumberBadge({
  n,
  flag = null,
  style: styleProp,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      gap: 8,
      marginBottom: 18,
      ...styleProp,
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1D1D1F',
        color: '#fff',
        width: 30,
        height: 28,
        borderRadius: 4,
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: 15,
        flexShrink: 0,
      }}>{n}</span>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderBottom: '1.5px dashed #1D1D1F',
      }}>
        <div style={{ flex: 1 }}/>
        {flag}
      </div>
    </div>
  );
}
