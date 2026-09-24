'use client';
import s from './Badge.module.css';
import { cx } from './cx';

/** Badge — small status pill. Variants: neutral, brand, success, warning, error, info, rw, math, solid, outline. */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon = null,
  children,
  className,
  style,
  ...rest
}) {
  return (
    <span className={cx(s.badge, s[size], s[variant], className)} style={style} {...rest}>
      {dot && <span className={s.dot} />}
      {icon}
      {children}
    </span>
  );
}
