'use client';
import React from 'react';
import { cx } from '../core/cx';
import { ToolButton } from './TestHeader';
import c from './chrome.module.css';
import s from './dialogs.module.css';

// ExitTest — header "Exit" control for the in-test surface. Targeted/general
// practice ('drill') and spaced-repetition review keep their progress so the
// session can be resumed later; full modules, sections and exams discard
// everything, so we warn before leaving.
export function ExitTest({ mode, onConfirm }) {
  const [open, setOpen] = React.useState(false);
  const isDrill = mode === 'drill' || mode === 'review';

  return (
    <>
      <ToolButton label="Exit" icon="log-out" title="Exit session" onClick={() => setOpen(true)} />

      {open && (
        <ConfirmExit
          isDrill={isDrill}
          onCancel={() => setOpen(false)}
          onConfirm={() => { setOpen(false); onConfirm(); }}
        />
      )}
    </>
  );
}

function ConfirmExit({ isDrill, onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} className={s.scrim} style={{ zIndex: 60 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-test-title"
        aria-describedby="exit-test-body"
        className={s.dialog}
      >
        <div className={s.dialogBody}>
          <h2 id="exit-test-title" className={s.dialogTitle}>
            {isDrill ? 'Exit practice?' : 'Exit without saving?'}
          </h2>
          <p id="exit-test-body" className={s.dialogText}>
            {isDrill ? (
              <>Your progress is saved. You can pick this session back up from your dashboard.</>
            ) : (
              <><strong className={s.danger}>None of this attempt will be saved</strong> — including questions you&rsquo;ve already answered. This can&rsquo;t be undone.</>
            )}
          </p>
        </div>
        <div className={s.dialogActions}>
          <button type="button" onClick={onCancel} autoFocus className={cx(c.pill, c.pillOutline)}>
            {isDrill ? 'Keep practicing' : 'Keep going'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cx(c.pill, isDrill ? c.pillPrimary : c.pillDanger)}
          >
            {isDrill ? 'Exit' : 'Exit without saving'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitTest;
