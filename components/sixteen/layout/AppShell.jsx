'use client';
import s from './Shell.module.css';
import { cx } from '../core/cx';

/**
 * AppShell — window frame: full-height sidebar on the left, then a column with
 * the unified toolbar (`titlebar`) over the main pane and optional right-hand
 * `tutorPane`. variant 'test' swaps the background to the test paper.
 */
export function AppShell({
  titlebar,
  sidebar,
  tutorPane = null,
  children,
  variant = 'app',
  style,
}) {
  return (
    <div className={cx(s.shell, variant === 'test' && s.test)} style={style}>
      {sidebar}
      <div className={s.column}>
        {titlebar}
        <div className={s.body}>
          <main className={s.main}>{children}</main>
          {tutorPane && <aside className={s.pane}>{tutorPane}</aside>}
        </div>
      </div>
    </div>
  );
}
