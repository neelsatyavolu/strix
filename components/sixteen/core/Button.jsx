'use client';
import s from './Button.module.css';
import { cx } from './cx';

/**
 * Button — primary CTA. Variants: primary (filled brand blue), secondary
 * (filled gray), ghost (transparent), outline (bordered), destructive.
 * Sizes: sm (26), md (32), lg (40).
 */
export function Button({
  variant = 'primary',
  size = 'md',
  icon = null,
  iconRight = null,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  className,
  style,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cx(s.btn, s[size], s[variant], fullWidth && s.full, className)}
      style={style}
      {...rest}
    >
      {loading ? <Spinner size={size} /> : icon}
      {children != null && children !== false && <span>{children}</span>}
      {iconRight}
    </button>
  );
}

function Spinner({ size }) {
  const d = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  return (
    <svg width={d} height={d} viewBox="0 0 16 16" className={s.spinner} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" fill="none" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
