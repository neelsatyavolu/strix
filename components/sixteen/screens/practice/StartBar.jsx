'use client';
import { Button, Icon } from '@/components/sixteen';
import s from './Practice.module.css';

/**
 * StartBar — sticky footer with a one-line summary of what's about to start and
 * the tab's single primary action. Read-only (tutor watching) disables Start.
 */
export default function StartBar({ title, detail, label, onStart, readOnly = false, studentName, disabled = false }) {
  const who = studentName || 'The student';
  return (
    <div className={s.startBar}>
      <div className={s.startText}>
        <span className={s.startTitle}>{title}</span>
        {readOnly ? (
          <span className={s.startDetail}>Read-only — {who} starts their own practice.</span>
        ) : (
          detail && <span className={s.startDetail}>{detail}</span>
        )}
      </div>
      <Button
        variant="primary"
        size="lg"
        disabled={readOnly || disabled}
        onClick={readOnly ? undefined : onStart}
        icon={<Icon name="play" size={14} />}
      >
        {label}
      </Button>
    </div>
  );
}
