'use client';
import { Skeleton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import s from './AssignForm.module.css';

// Pick the form an official assignment runs on: Question Bank (randomized) or a
// specific Bluebook test (taken tests are muted, never disabled).
export default function BluebookPicker({ available, completed, loading = false, value, onChange, allowQuestionBank }) {
  return (
    <div className={s.chips} role="radiogroup" aria-label="Test form">
      <Chip active={value == null} disabled={!allowQuestionBank} onClick={() => onChange(null)}>
        Question Bank
      </Chip>
      {loading && [0, 1, 2].map((i) => <Skeleton key={i} width={84} height={28} radius={8} />)}
      {available.map((t) => (
        <Chip key={t} active={value === t} muted={completed.includes(t)} onClick={() => onChange(t)}>
          Bluebook {t}{completed.includes(t) ? ' · taken' : ''}
        </Chip>
      ))}
    </div>
  );
}

function Chip({ active, muted, disabled, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cx(s.chip, active && s.chipActive, muted && s.chipMuted)}
    >
      {children}
    </button>
  );
}
