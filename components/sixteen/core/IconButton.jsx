'use client';
import s from './IconButton.module.css';
import { cx } from './cx';

/** IconButton — square button for icon-only actions. Always pass `label` (tooltip + aria-label). */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  active = false,
  disabled = false,
  label,
  onClick,
  children,
  className,
  style,
  ...rest
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cx(s.btn, s[size], s[variant], active && s.active, className)}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
