'use client';
import { Icon } from '../Icon';
import s from './Layout.module.css';
import { cx } from './cx';

/** Page — centered content column with standard page padding. width: default | narrow | wide | full */
export function Page({ width = 'default', className, style, children }) {
  return (
    <div className={cx(s.page, width !== 'default' && s[width], className)} style={style}>
      {children}
    </div>
  );
}

/**
 * PageHeader — the page title block. `back` = { label, onClick } renders a small
 * back link above the title (drill-in pages). `actions` sit on the right.
 */
export function PageHeader({ title, subtitle, actions, back, className, style }) {
  return (
    <header className={cx(s.header, className)} style={style}>
      <div className={s.headerText}>
        {back && (
          <button type="button" className={s.back} onClick={back.onClick}>
            <Icon name="chevron-left" size={14} />
            {back.label || 'Back'}
          </button>
        )}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={s.actions}>{actions}</div>}
    </header>
  );
}

/** Section — a titled block of a page. `action` sits right of the heading. */
export function Section({ title, description, action, className, style, children }) {
  return (
    <section className={cx(s.section, className)} style={style}>
      {(title || action) && (
        <div className={s.sectionHead}>
          <div>
            {title && <h2 className={s.sectionTitle}>{title}</h2>}
            {description && <p className={s.sectionDesc}>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** List — grouped rows in one hairline card (Mac settings style). `plain` drops the card. */
export function List({ plain = false, className, style, children }) {
  return (
    <div className={cx(s.list, plain && s.plain, className)} style={style}>
      {children}
    </div>
  );
}

/**
 * ListRow — one row: leading visual, title/subtitle, meta (right-aligned figure),
 * trailing (actions). Clickable when `onClick` is set (shows a chevron unless
 * `chevron={false}`).
 */
export function ListRow({ leading, title, subtitle, meta, trailing, onClick, chevron = true, className, style }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(s.row, onClick && s.rowButton, className)}
      style={style}
    >
      {leading && <span className={s.rowLead}>{leading}</span>}
      <span className={s.rowMain}>
        <span className={s.rowTitle}>{title}</span>
        {subtitle && <span className={s.rowSub}>{subtitle}</span>}
      </span>
      {meta != null && <span className={s.rowMeta}>{meta}</span>}
      {(trailing || (onClick && chevron)) && (
        <span className={s.rowTrail}>
          {trailing}
          {onClick && chevron && <Icon name="chevron-right" size={15} />}
        </span>
      )}
    </Tag>
  );
}

/** Metric — label over a big tabular figure, with optional unit, delta (+/-), and hint. size: sm | md | lg */
export function Metric({ label, value, unit, delta, hint, size = 'md', color, className, style }) {
  const d = delta == null || delta === 0 || delta === '' ? null : String(delta);
  const down = d?.startsWith('-');
  return (
    <div className={cx(s.metric, size === 'sm' && s.metricSm, size === 'lg' && s.metricLg, className)} style={style}>
      {label && <span className={s.metricLabel}>{label}</span>}
      <span className={s.metricValueRow}>
        <span className={s.metricValue} style={color ? { color } : undefined}>{value}</span>
        {unit && <span className={s.metricUnit}>{unit}</span>}
        {d && <span className={cx(s.delta, down ? s.down : s.up)}>{down || d.startsWith('+') ? d : `+${d}`}</span>}
      </span>
      {hint && <span className={s.metricHint}>{hint}</span>}
    </div>
  );
}

/** EmptyState — icon, title, one line of help, and the next action. */
export function EmptyState({ icon = 'inbox', title, body, action, compact = false, className, style }) {
  return (
    <div className={cx(s.empty, compact && s.emptyCompact, className)} style={style}>
      {icon && <span className={s.emptyIcon}><Icon name={icon} size={18} /></span>}
      {title && <p className={s.emptyTitle}>{title}</p>}
      {body && <p className={s.emptyBody}>{body}</p>}
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  );
}

/** Skeleton — pulsing placeholder block for loading states. */
export function Skeleton({ width = '100%', height = 14, radius, className, style }) {
  return (
    <span
      aria-hidden="true"
      className={cx(s.skeleton, className)}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/** Select — styled native select. options: [{ value, label }] */
export function Select({ value, onChange, options, size = 'md', fullWidth = false, label, className, style, ...rest }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label={label}
      className={cx(s.select, size === 'sm' && s.selectSm, fullWidth && s.selectFull, className)}
      style={style}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
      ))}
    </select>
  );
}
