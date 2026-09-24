'use client';
import React from 'react';
import { cx } from '../core/cx';
import s from './QuestionPalette.module.css';

/**
 * QuestionPalette — Bluebook-style numbered grid of questions.
 * Pass `items` as `{n, status, marked}[]` where status is
 * 'current' | 'answered' | 'unanswered'.
 */
export function QuestionPalette({
  items,
  onSelect,
  onReviewAll,
  title = 'Section 1, Module 1: Reading and Writing',
  style: styleProp,
}) {
  return (
    <div className={s.palette} style={styleProp} role="dialog" aria-label={title}>
      <div className={s.head}>{title}</div>
      <div className={s.legend}>
        <Legend swatch={<span className={cx(s.swatch, s.swatchCurrent)} />} label="Current" />
        <Legend swatch={<span className={cx(s.swatch, s.swatchUnanswered)} />} label="Unanswered" />
        <Legend
          swatch={<span className={cx(s.swatch, s.swatchMarked)}><Flag size={11} /></span>}
          label="For Review"
        />
      </div>
      <div className={s.grid}>
        {items.map((it) => <PaletteCell key={it.n} {...it} onClick={() => onSelect?.(it.n)} />)}
      </div>
      <div className={s.foot}>
        <button type="button" onClick={onReviewAll} className={s.reviewBtn}>
          Go to Review Page
        </button>
      </div>
    </div>
  );
}

function Legend({ swatch, label }) {
  return <span className={s.legendItem}>{swatch}{label}</span>;
}

function PaletteCell({ n, status, marked, onClick }) {
  // status: 'current' | 'answered' | 'unanswered'
  const cls = status === 'current' ? s.current : status === 'answered' ? s.answered : s.unanswered;
  const label = `Question ${n}, ${status || 'unanswered'}${marked ? ', marked for review' : ''}`;
  return (
    <button
      type="button"
      className={cx(s.cell, cls)}
      onClick={onClick}
      aria-label={label}
      aria-current={status === 'current' ? 'step' : undefined}
    >
      {n}
      {marked && (
        <span className={s.cellFlag}><Flag size={12} /></span>
      )}
    </button>
  );
}

function Flag({ size = 12, color = 'var(--test-flag)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M3 1.5v13" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M3 2.5h9l-2 3 2 3H3z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  );
}
