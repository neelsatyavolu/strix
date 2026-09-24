'use client';
import React from 'react';
import s from './chrome.module.css';

/**
 * QuestionNumberBadge — dark filled rounded-square chip with the question
 * number, plus a dashed horizontal rule that extends across the row.
 * `flag` is rendered at the right end of the rule (typically a FlagButton).
 */
export function QuestionNumberBadge({
  n,
  flag = null,
  style: styleProp,
}) {
  return (
    <div className={s.badgeRow} style={styleProp}>
      <span className={s.badge}>{n}</span>
      <div className={s.badgeRule}>{flag}</div>
    </div>
  );
}
