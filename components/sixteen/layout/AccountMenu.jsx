'use client';
import { Icon } from '../Icon';
import { Avatar } from '../core/Avatar';
import { SegmentedControl } from '../core/SegmentedControl';
import { usePopover } from './usePopover';
import s from './Shell.module.css';
import { cx } from '../core/cx';

/**
 * AccountMenu — sidebar footer: who's signed in, and a menu with Settings, the
 * student/tutor view switch (when the account tutors someone), and appearance.
 */
export function AccountMenu({
  name,
  email,
  avatarUrl,
  role,
  canTutor,
  onSwitchRole,
  theme,
  onTheme,
  onSettings,
  extraItems = [],
}) {
  const { open, setOpen, toggle, ref } = usePopover();
  const run = (fn) => () => { setOpen(false); fn(); };

  return (
    <div ref={ref}>
      {open && (
        <div className={cx(s.menu, s.menuUp)} role="menu">
          <div className={s.menuLabel}>Appearance</div>
          <div className={s.menuSeg}>
            <SegmentedControl
              size="sm"
              fullWidth
              label="Appearance"
              value={theme}
              onChange={onTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'Auto' },
              ]}
            />
          </div>
          <div className={s.menuSep} />
          {canTutor && (
            <button type="button" role="menuitem" className={s.menuItem} onClick={run(() => onSwitchRole(role === 'tutor' ? 'student' : 'tutor'))}>
              <span className={s.menuIcon}><Icon name={role === 'tutor' ? 'user' : 'users'} size={15} /></span>
              {role === 'tutor' ? 'Switch to my practice' : 'Switch to tutor view'}
            </button>
          )}
          {extraItems.map((it) => (
            <button key={it.label} type="button" role="menuitem" className={s.menuItem} onClick={run(it.onClick)}>
              <span className={s.menuIcon}><Icon name={it.icon} size={15} /></span>
              {it.label}
            </button>
          ))}
          <button type="button" role="menuitem" className={s.menuItem} onClick={run(onSettings)}>
            <span className={s.menuIcon}><Icon name="settings" size={15} /></span>
            Settings
          </button>
        </div>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx(s.account, open && s.accountOpen)}
        onClick={toggle}
      >
        <Avatar name={name} src={avatarUrl} size="sm" />
        <span className={s.accountText}>
          <span className={s.accountName}>{name}</span>
          <span className={s.accountSub}>{role === 'tutor' ? 'Tutor view' : email}</span>
        </span>
        <Icon name="chevrons-up-down" size={14} className={s.chev} />
      </button>
    </div>
  );
}
