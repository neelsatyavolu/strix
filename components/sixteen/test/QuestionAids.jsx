'use client';
import React from 'react';
import { Icon } from '../Icon';
import { cx } from '../core/cx';
import c from './chrome.module.css';
import s from './dialogs.module.css';

// Small pieces shared by the Reading & Writing and Math question screens.

/** EliminatorToggle — the struck-through "ABC" button that turns on cross-out mode. */
export function EliminatorToggle({ on, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Cross out answers"
      aria-label="Cross out answers"
      aria-pressed={on}
      className={cx(c.elimToggle, on && c.elimToggleOn)}
    >
      ABC
    </button>
  );
}

/** DrillFeedback — general-practice inline feedback under the answer choices. */
export function DrillFeedback({ solved, triedAny, rationaleHtml }) {
  if (!solved && !triedAny) return null;
  return (
    <div className={c.feedback}>
      <p role="status" className={cx(c.feedbackMsg, solved ? c.feedbackOk : c.feedbackBad)}>
        {solved ? 'Correct.' : 'Not quite — try again.'}
      </p>
      {solved && rationaleHtml && (
        <div
          className={cx('cb-stem', c.rationale)}
          // Inline so it beats the global .cb-stem size/color regardless of CSS order.
          style={{ fontSize: 14, color: 'var(--text-body)' }}
          dangerouslySetInnerHTML={{ __html: rationaleHtml }}
        />
      )}
    </div>
  );
}

/** DoneAlreadyButton — swaps the current question for a similar one. */
export function DoneAlreadyButton({ busy, onClick }) {
  return (
    <div className={c.doneAlready}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        title="Hide this question permanently and get a similar one"
        className={c.linkBtn}
      >
        {busy ? 'Finding another question…' : "I've done this already"}
      </button>
    </div>
  );
}

/** DirectionsModal — section directions opened from the Directions bar. */
export function DirectionsModal({ onClose, title = 'Section Directions', children }) {
  return (
    <div className={s.scrim} style={{ zIndex: 50 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="test-directions-title" className={cx(s.dialog, s.dialogWide)}>
        <div className={s.dialogHead}>
          <h2 id="test-directions-title" className={s.dialogTitle}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close directions" className={s.close}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className={s.dialogBody} style={{ paddingBottom: 20 }}>{children}</div>
      </div>
    </div>
  );
}
