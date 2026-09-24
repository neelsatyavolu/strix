'use client';
import { Icon } from '../Icon';
import { Avatar } from '../core/Avatar';
import { usePopover } from './usePopover';
import s from './Shell.module.css';
import { cx } from '../core/cx';

/**
 * StudentSwitcher — tutor mode: which student you're viewing, at the top of the
 * sidebar. students: [{ id, name }]; live: { [id]: { active } }.
 */
export function StudentSwitcher({ students, value, onChange, live = {} }) {
  const { open, setOpen, toggle, ref } = usePopover();
  const current = students.find((st) => st.id === value) || null;

  return (
    <div className={s.switcherWrap} ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className={s.switcher}
        onClick={toggle}
      >
        {current ? <Avatar name={current.name} size="sm" /> : (
          <span className={s.menuIcon}><Icon name="users" size={16} /></span>
        )}
        <span className={s.accountText}>
          <span className={s.switcherEyebrow}>Viewing</span>
          <span className={s.accountName}>{current ? current.name : 'Choose a student'}</span>
        </span>
        {current && live[current.id]?.active && <span className={s.liveDot} aria-label="Live now" />}
        <Icon name="chevrons-up-down" size={14} className={s.chev} />
      </button>
      {open && (
        <div className={cx(s.menu, s.menuDown)} role="menu">
          <div className={s.menuLabel}>Your students</div>
          {students.map((st) => (
            <button
              key={st.id}
              type="button"
              role="menuitemradio"
              aria-checked={st.id === value}
              className={s.menuItem}
              onClick={() => { setOpen(false); onChange(st.id); }}
            >
              <Avatar name={st.name} size="sm" />
              <span className={s.itemLabel}>{st.name}</span>
              {live[st.id]?.active && <span className={s.liveDot} aria-label="Live now" />}
              {st.id === value && <Icon name="check" size={14} className={s.menuCheck} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
