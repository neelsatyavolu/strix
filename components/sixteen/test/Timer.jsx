'use client';
import React from 'react';
import { cx } from '../core/cx';
import s from './chrome.module.css';

/**
 * Timer — mm:ss countdown in tabular figures. Pulses softly when under 5 minutes.
 * "Hide" button sits *below* the time (Bluebook layout), not beside it.
 */
export function Timer({
  seconds,
  hidden = false,
  onToggleHide,
  warningAt = 300,
  showHideToggle = true,
  style: styleProp,
}) {
  const m = Math.max(0, Math.floor(seconds / 60));
  const sec = Math.max(0, seconds % 60);
  const fmt = `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  const warn = seconds <= warningAt;

  return (
    <div className={s.timer} style={styleProp}>
      <div
        className={cx(s.timerValue, hidden && s.timerHidden, warn && !hidden && s.timerWarn)}
        role="timer"
        aria-label={hidden ? 'Timer hidden' : `${m} minutes ${sec} seconds left`}
      >
        {hidden ? ' ' : fmt}
      </div>
      {showHideToggle && (
        <button type="button" onClick={onToggleHide} className={s.timerToggle}>
          {hidden ? 'Show' : 'Hide'}
        </button>
      )}
    </div>
  );
}
