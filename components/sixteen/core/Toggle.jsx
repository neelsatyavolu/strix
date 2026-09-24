'use client';
import s from './Toggle.module.css';
import { cx } from './cx';

/** Toggle — Mac-native switch, optionally with a label + description row. */
export function Toggle({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  label,
  description,
  className,
  style,
}) {
  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={typeof label === 'string' ? label : undefined}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(s.switch, s[size], checked && s.on, !(label || description) && className)}
      style={label || description ? undefined : style}
    >
      <span className={s.knob} />
    </button>
  );

  if (label || description) {
    return (
      <label className={cx(s.row, disabled && s.rowDisabled, className)} style={style}>
        <span className={s.text}>
          {label && <span className={s.label}>{label}</span>}
          {description && <span className={s.desc}>{description}</span>}
        </span>
        {switchEl}
      </label>
    );
  }
  return switchEl;
}
