import React from 'react';

/**
 * Sidebar — left nav for the Sixteen app. Pass `items` with optional groups.
 * Items: { id, label, icon, badge?, group? }
 */
export function Sidebar({
  items,
  activeId,
  onSelect,
  header,                    // ReactNode (logo + app name)
  footer,                    // ReactNode (user / settings shortcut)
  compact = false,           // collapsed icon-only mode
  style: styleProp,
}) {
  // Group items
  const groups = [];
  const seen = new Map();
  for (const it of items) {
    const g = it.group ?? '';
    if (!seen.has(g)) { seen.set(g, groups.length); groups.push({ group: g, items: [] }); }
    groups[seen.get(g)].items.push(it);
  }
  return (
    <aside style={{
      width: compact ? 'var(--sidebar-width-compact)' : 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--surface-sidebar)',
      borderRight: '1px solid var(--border-1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      ...styleProp,
    }}>
      {header && (
        <div style={{ padding: compact ? '14px 8px' : '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {header}
        </div>
      )}
      <nav style={{ flex: 1, padding: '4px 8px', overflow: 'auto', display:'flex', flexDirection:'column', gap: 14 }}>
        {groups.map(({ group, items }, gi) => (
          <div key={gi} style={{ display:'flex', flexDirection:'column', gap: 2 }}>
            {group && !compact && (
              <div style={{
                padding: '6px 10px 4px',
                font: 'var(--role-eyebrow)',
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)',
                color: 'var(--text-tertiary)',
              }}>{group}</div>
            )}
            {items.map(it => (
              <SidebarItem
                key={it.id}
                item={it}
                active={it.id === activeId}
                compact={compact}
                onClick={() => onSelect?.(it.id)}
              />
            ))}
          </div>
        ))}
      </nav>
      {footer && (
        <div style={{ padding: compact ? '8px 6px' : '8px 10px', borderTop: '1px solid var(--border-1)' }}>
          {footer}
        </div>
      )}
    </aside>
  );
}

function SidebarItem({ item, active, compact, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={compact ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0 : 10,
        justifyContent: compact ? 'center' : 'flex-start',
        padding: compact ? '8px 0' : '6px 10px',
        background: active ? 'var(--brand-blue)' : (hover ? 'rgba(0,0,0,0.04)' : 'transparent'),
        color: active ? '#fff' : 'var(--text-primary)',
        border: 0,
        borderRadius: 'var(--radius-md)',
        font: 'var(--role-body)',
        fontWeight: active ? 590 : 500,
        cursor: 'pointer',
        transition: 'var(--xn-color)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <span style={{ display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        {item.icon}
      </span>
      {!compact && (
        <>
          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>
          {item.badge != null && (
            <span style={{
              font: 'var(--role-caption)',
              fontFamily: 'var(--font-mono)',
              color: active ? 'rgba(255,255,255,0.85)' : 'var(--text-tertiary)',
            }}>{item.badge}</span>
          )}
        </>
      )}
    </button>
  );
}
