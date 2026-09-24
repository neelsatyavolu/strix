'use client';
import React from 'react';
import { Icon } from '../Icon';
import { cx } from '../core/cx';
import c from './chrome.module.css';
import s from './dialogs.module.css';

export function ModuleReview({
  title,
  items,
  onSelect,
  onBack,
  onSubmit,
  submitDisabled = false,
}) {
  const answered = items.filter((it) => it.status === 'answered').length;
  const marked = items.filter((it) => it.marked).length;

  return (
    <div className={s.review}>
      <div className={s.reviewInner}>
        <p className={s.reviewKicker}>{title}</p>
        <h1 className={s.reviewTitle}>Check your work.</h1>
        <p className={s.reviewSummary}>
          {answered} of {items.length} answered{marked ? ` · ${marked} marked for review` : ''}
        </p>

        <div className={s.reviewGrid}>
          {items.map((it) => {
            const done = it.status === 'answered';
            return (
              <button
                key={it.n}
                type="button"
                onClick={() => onSelect?.(it.n)}
                className={s.reviewItem}
                aria-label={`Question ${it.n}, ${done ? 'answered' : 'unanswered'}${it.marked ? ', marked for review' : ''}`}
              >
                <span className={cx(s.reviewNum, done ? s.reviewNumDone : s.reviewNumOpen)}>{it.n}</span>
                <span className={s.reviewMeta}>
                  <span className={s.reviewStatus}>{done ? 'Answered' : 'Unanswered'}</span>
                  <span className={cx(s.reviewMark, it.marked && s.reviewMarked)}>
                    {it.marked && <Icon name="flag" size={12} />}
                    {it.marked ? 'For review' : 'Not marked'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={s.reviewActions}>
          <button type="button" onClick={onBack} className={cx(c.pill, c.pillOutline)}>
            Back to questions
          </button>
          <button
            type="button"
            disabled={submitDisabled}
            onClick={onSubmit}
            className={cx(c.pill, c.pillPrimary)}
          >
            Submit module
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModuleReview;
