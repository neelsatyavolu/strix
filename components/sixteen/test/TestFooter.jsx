'use client';
import React from 'react';
import { Icon } from '../Icon';
import { cx } from '../core/cx';
import s from './chrome.module.css';

/**
 * TestFooter — Bluebook-style footer: name/student left, current question +
 * palette toggle center, Back / Next right.
 */
export function TestFooter({
  studentName = '',
  current = 1,
  total = 27,
  onPalette,
  paletteOpen = false,
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  nextTitle,
  style: styleProp,
}) {
  return (
    <footer className={s.footer} style={styleProp}>
      <div className={s.footerName}>{studentName}</div>
      <button
        type="button"
        onClick={onPalette}
        aria-expanded={paletteOpen}
        className={s.paletteToggle}
      >
        Question {current} of {total}
        <span className={cx(s.chevron, paletteOpen && s.chevronOpen)}>
          <Icon name="chevron-up" size={14} strokeWidth={2.5} />
        </span>
      </button>
      <div className={s.footerRight}>
        <button type="button" onClick={onBack} className={cx(s.pill, s.pillOutline)}>
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          title={nextTitle}
          className={cx(s.pill, s.pillPrimary)}
        >
          {nextLabel}
        </button>
      </div>
    </footer>
  );
}
