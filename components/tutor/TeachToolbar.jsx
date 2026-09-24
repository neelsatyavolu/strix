'use client';

import { Icon, IconButton } from '@/components/sixteen';
import { cx } from '@/components/sixteen/core/cx';
import { TEACH_COLORS } from '@/lib/tutor/useTeachMode';
import { useTeach } from '@/components/tutor/TeachContext';
import s from './TeachToolbar.module.css';

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
    <div className={s.dock}>
      {on && (
        <div className={s.bar} role="toolbar" aria-label="Teaching tools">
          <div className={s.group}>
            {TOOLS.map((t) => (
              <IconButton
                key={t.id}
                label={t.label}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
                className={cx(tool === t.id && s.toolOn)}
              >
                <Icon name={t.icon} size={15} />
              </IconButton>
            ))}
          </div>
          <span className={s.divider} />
          <div className={s.swatches}>
            {TEACH_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title="Ink colour"
                aria-label={`Ink colour ${c}`}
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={cx(s.swatch, color === c && s.swatchOn)}
                style={{ '--swatch': c }}
              />
            ))}
          </div>
          <span className={s.divider} />
          <div className={s.group}>
            <IconButton label="Undo" onClick={undo} disabled={!strokes.length}>
              <Icon name="undo-2" size={15} />
            </IconButton>
            <IconButton label="Clear" onClick={clear} disabled={!strokes.length}>
              <Icon name="eraser" size={15} />
            </IconButton>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOn(!on)}
        title={on ? 'Stop teaching' : 'Point and draw on your student’s screen'}
        aria-pressed={on}
        className={cx(s.pill, on && s.pillOn)}
      >
        <Icon name={on ? 'presentation' : 'mouse-pointer-2'} size={15} />
        {on ? 'Teaching' : 'Teach'}
      </button>
    </div>
  );
}
