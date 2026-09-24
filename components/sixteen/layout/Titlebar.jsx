'use client';
import { Icon } from '../Icon';
import { IconButton } from '../core/IconButton';
import s from './Shell.module.css';
import { cx } from '../core/cx';

/**
 * Titlebar — unified toolbar over the content pane. Drag handle for the desktop
 * window. Leading: optional back button + title (with an optional `crumb` before
 * it). `inset` reserves room for the traffic lights when there's no sidebar.
 */
export function Titlebar({
  title = '',
  crumb = null,
  onBack = null,
  inset = false,
  trailing = null,
  style,
}) {
  return (
    <div className={cx(s.titlebar, inset && s.inset)} style={style}>
      <div className={s.leading}>
        {onBack && (
          <IconButton size="sm" label="Back" onClick={onBack}>
            <Icon name="chevron-left" size={16} />
          </IconButton>
        )}
        <span className={s.title}>
          {crumb && <span className={s.crumb}>{crumb} <span aria-hidden>›</span> </span>}
          {title}
        </span>
      </div>
      <div className={s.trailing}>{trailing}</div>
    </div>
  );
}
