'use client';
import s from './SegmentedControl.module.css';
import { cx } from './cx';

/** SegmentedControl — Mac-native segmented picker. options: [{ value, label, icon? }] */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  label,
  className,
  style,
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx(s.group, s[size], fullWidth && s.full, className)} style={style}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange?.(opt.value)}
            className={cx(s.seg, selected && s.selected)}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
