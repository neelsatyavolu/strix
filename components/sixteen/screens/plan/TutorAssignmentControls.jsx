'use client';
import React from 'react';
import { Button, Icon } from '@/components/sixteen';
import { reviewTarget } from './assignmentMeta';
import s from './TutorAssignmentControls.module.css';

// Per-assignment tutor actions: open the review, retract, and leave feedback.

export function ReviewButton({ assignment, go, label }) {
  const target = reviewTarget(assignment);
  if (!target) return null;
  return <Button variant="ghost" size="sm" onClick={() => go(target[0], target[1])}>{label}</Button>;
}

// Retract an open assignment (soft) with a one-tap inline confirm.
export function RetractButton({ assignment, onDone }) {
  const [confirming, setConfirming] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const retract = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, status: 'retracted' }),
      });
      const json = await res.json();
      if (json?.success) onDone?.(); else setBusy(false);
    } catch { setBusy(false); }
  };
  if (!confirming) {
    return <Button variant="ghost" size="sm" style={{ color: 'var(--error)' }} onClick={() => setConfirming(true)}>Retract</Button>;
  }
  return (
    <span className={s.confirm}>
      <span className={s.confirmText}>Retract?</span>
      <Button variant="destructive" size="sm" loading={busy} onClick={retract}>Yes</Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>No</Button>
    </span>
  );
}

// Inline tutor-feedback editor on a single assignment (read view + edit form).
export function FeedbackEditor({ assignment, onSaved }) {
  const [editing, setEditing] = React.useState(false);
  const [text, setText] = React.useState(assignment.feedback || '');
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/tutor/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: assignment.id, feedback: text.trim() || null }),
      });
      const json = await res.json();
      if (json?.success) { setEditing(false); onSaved?.(); }
    } catch { /* leave the editor open so the tutor can retry */ } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    if (!assignment.feedback) {
      return (
        <button type="button" className={s.link} onClick={() => setEditing(true)}>
          <Icon name="message-circle" size={13} /> Add feedback
        </button>
      );
    }
    return (
      <div className={s.note}>
        <Icon name="message-circle" size={14} className={s.noteIcon} />
        <p className={s.noteText}>{assignment.feedback}</p>
        <button type="button" className={s.link} onClick={() => setEditing(true)}>Edit</button>
      </div>
    );
  }

  return (
    <div className={s.editor}>
      <textarea
        className={s.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Leave feedback for your student…"
        aria-label="Feedback"
        autoFocus
      />
      <div className={s.editorActions}>
        <Button variant="ghost" size="sm" onClick={() => { setText(assignment.feedback || ''); setEditing(false); }}>Cancel</Button>
        <Button variant="primary" size="sm" loading={busy} disabled={busy} onClick={save}>Save feedback</Button>
      </div>
    </div>
  );
}
