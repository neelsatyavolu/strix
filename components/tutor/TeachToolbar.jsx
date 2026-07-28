'use client';

import { Icon } from '@/components/sixteen';
import { TEACH_COLORS } from '@/lib/tutor/useTeachMode';
import { useTeach } from '@/components/tutor/TeachContext';

// Tutor-only control for teaching mode: a compact pill that expands into the
// tool palette once it's on. Rendered once at the app shell so it works on both
// the live mirror and a completed session the tutor is reviewing with a student.

const TOOLS = [
  { id: 'laser', icon: 'mouse-pointer-2', label: 'Laser' },
  { id: 'pen', icon: 'pencil-line', label: 'Draw' },
  { id: 'highlighter', icon: 'highlighter', label: 'Highlight' },
  { id: 'text', icon: 'type', label: 'Label' },
];

export default function TeachToolbar() {
  const teach = useTeach();
  if (!teach || teach.role !== 'tutor' || !teach.canTeach) return null;

  const { on, setOn, tool, setTool, color, setColor, undo, clear, strokes } = teach;

  return (
    <div style={{
      position: 'fixed', right: 18, bottom: 'calc(var(--test-footer-height, 0px) + 18px)', zIndex: 70,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
    }}>
      {on && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
          background: 'var(--paper)', border: '1px solid var(--border-1)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {TOOLS.map((t) => (
              <IconToggle
                key={t.id}
                icon={t.icon}
                label={t.label}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
              />
            ))}
          </div>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-1)' }} />
          <div style={{ display: 'flex', gap: 5 }}>
            {TEACH_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title="Ink colour"
                onClick={() => setColor(c)}
                style={{
                  width: 18, height: 18, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                  outline: '1px solid var(--border-1)',
                }}
              />
            ))}
          </div>
          <span style={{ width: 1, alignSelf: 'stretch', background: 'var(--border-1)' }} />
          <IconToggle icon="undo-2" label="Undo" onClick={undo} disabled={!strokes.length} />
          <IconToggle icon="eraser" label="Clear" onClick={clear} disabled={!strokes.length} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOn(!on)}
        title={on ? 'Stop teaching' : 'Point and draw on your student’s screen'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
          background: on ? 'var(--brand-blue)' : 'var(--paper)',
          color: on ? '#fff' : 'var(--text-primary)',
          border: `1px solid ${on ? 'var(--brand-blue)' : 'var(--border-1)'}`,
          borderRadius: 999, cursor: 'pointer', boxShadow: 'var(--shadow-md)',
          font: 'var(--role-label)', fontWeight: 600,
        }}
      >
        <Icon name={on ? 'presentation' : 'mouse-pointer-2'} size={15} />
        {on ? 'Teaching' : 'Teach'}
      </button>
    </div>
  );
}

function IconToggle({ icon, label, active = false, disabled = false, onClick }) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7,
        background: active ? 'var(--brand-blue)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: 0, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1,
      }}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}
