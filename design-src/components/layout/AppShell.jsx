import React from 'react';

/**
 * AppShell — the macOS window frame. Composes Titlebar + Sidebar + main pane.
 * Pass `titlebar`, `sidebar`, optional `tutorPane` (right-side), and the main
 * content as children.
 */
export function AppShell({
  titlebar,
  sidebar,
  tutorPane = null,
  children,
  variant = 'app',          // 'app' (light canvas) or 'test' (canvas swap)
  style: styleProp,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: variant === 'test' ? 'var(--test-canvas)' : 'var(--surface-app)',
      borderRadius: 'var(--radius-window)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-window)',
      ...styleProp,
    }}>
      {titlebar}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {sidebar}
        <main style={{ flex: 1, overflow: 'auto', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        {tutorPane && (
          <aside style={{
            width: 'var(--tutor-sidebar-width)',
            borderLeft: '1px solid var(--border-1)',
            background: 'var(--surface-sidebar)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}>{tutorPane}</aside>
        )}
      </div>
    </div>
  );
}
