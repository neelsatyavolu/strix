'use client';
import s from './Shell.module.css';
import { cx } from '../core/cx';

/**
 * Sidebar — full-height left nav. Its top strip is the window drag zone (the
 * desktop traffic lights sit there). Items: { id, label, icon, badge?, dot?, live?, group? }
 */
export function Sidebar({
  items,
  activeId,
  onSelect,
  header,
  footer,
  style,
}) {
  const groups = items.reduce((acc, it) => {
    const g = it.group ?? '';
    const last = acc[acc.length - 1];
    if (last && last.group === g) {
      return [...acc.slice(0, -1), { group: g, items: [...last.items, it] }];
    }
    return [...acc, { group: g, items: [it] }];
  }, []);

  return (
    <aside className={s.sidebar} style={style}>
      <div className={s.dragZone} />
      {header && <div className={s.sideHeader}>{header}</div>}
      <nav className={s.nav} aria-label="Main">
        {groups.map(({ group, items: groupItems }, gi) => (
          <div key={gi} className={s.group}>
            {group && <div className={s.groupLabel}>{group}</div>}
            {groupItems.map((it) => (
              <SidebarItem
                key={it.id}
                item={it}
                active={it.id === activeId}
                onClick={() => onSelect?.(it.id)}
              />
            ))}
          </div>
        ))}
      </nav>
      {footer && <div className={s.sideFooter}>{footer}</div>}
    </aside>
  );
}

function SidebarItem({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cx(s.item, active && s.active)}
    >
      <span className={s.itemIcon}>
        {item.icon}
        {item.dot && <span className={s.dot} />}
      </span>
      <span className={s.itemLabel}>{item.label}</span>
      {item.live && <span className={s.liveDot} aria-label="Live" />}
      {item.badge != null && <span className={s.itemBadge}>{item.badge}</span>}
    </button>
  );
}
