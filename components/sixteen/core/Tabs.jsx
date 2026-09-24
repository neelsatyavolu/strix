'use client';
import s from './Tabs.module.css';
import { cx } from './cx';

/** Tabs — page-level tab bar. tabs: [{ value, label, count? }]. variant: 'underline' | 'pill'. */
export function Tabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  className,
  style,
}) {
  const pill = variant === 'pill';
  return (
    <div role="tablist" className={cx(pill ? s.pills : s.bar, className)} style={style}>
      {tabs.map((t) => {
        const sel = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={sel}
            onClick={() => onChange?.(t.value)}
            className={cx(pill ? s.pill : s.tab, sel && s.sel)}
          >
            {t.label}
            {t.count != null && <span className={s.count}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
