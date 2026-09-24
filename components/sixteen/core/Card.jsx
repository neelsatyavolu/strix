'use client';
import s from './Card.module.css';
import { cx } from './cx';

/**
 * Card — white surface with a hairline border. Groups related content; don't
 * nest cards. `elevation` adds a shadow (floating things only); `interactive`
 * gives hover/focus affordances for clickable cards.
 */
export function Card({
  padding = 'md',
  elevation = 'none',
  interactive = false,
  selected = false,
  as: Tag = 'div',
  onClick,
  className,
  style,
  children,
  ...rest
}) {
  return (
    <Tag
      onClick={onClick}
      className={cx(
        s.card,
        s[`pad-${padding}`],
        s[`elev-${elevation}`],
        interactive && s.interactive,
        selected && s.selected,
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
