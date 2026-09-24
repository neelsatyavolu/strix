'use client';
import s from './Input.module.css';
import { cx } from './cx';

/** Input — text field. Variants: default (bordered), sunken (filled well), flat (underline). */
export function Input({
  size = 'md',
  variant = 'default',
  icon = null,
  trailing = null,
  invalid = false,
  disabled = false,
  fullWidth = true,
  type = 'text',
  className,
  style,
  inputStyle,
  ...rest
}) {
  return (
    <div
      className={cx(
        s.wrap, s[size], s[variant],
        fullWidth && s.full,
        disabled && s.disabled,
        invalid && s.invalid,
        icon && s.hasIcon,
        trailing && s.hasTrailing,
        className,
      )}
      style={style}
    >
      {icon && <span className={s.icon}>{icon}</span>}
      <input
        type={type}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={s.input}
        style={inputStyle}
        {...rest}
      />
      {trailing && <span className={s.trailing}>{trailing}</span>}
    </div>
  );
}
