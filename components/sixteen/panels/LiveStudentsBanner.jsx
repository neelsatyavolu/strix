'use client';

import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';

// Slim top-center banner shown when one of the tutor's students starts a
// practice section and isn't already being watched. Clicking Join opens that
// student's live view — it never switches the tutor automatically.
const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

export default function LiveStudentsBanner({ students, liveStudents, watchedStudentId, onJoin }) {
  const { Button } = SixteenNS;

  const alerts = (students || []).filter((s) => {
    const live = liveStudents?.[s.id];
    return live && live.active && s.id !== watchedStudentId;
  });
  if (alerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 'calc(var(--titlebar-height, 40px) + 10px)', left: '50%', transform: 'translateX(-50%)',
      zIndex: 9990, display: 'flex', flexDirection: 'column', gap: 8, width: 'min(420px, calc(100vw - 32px))',
    }}>
      {alerts.map((s) => {
        const live = liveStudents[s.id];
        const detail = live.domainLabel || SECTION_LABEL[live.section] || 'a practice section';
        return (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 14px',
            background: 'var(--paper)', border: '1px solid var(--border-1)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: 'var(--role-label)', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name} started a practice
              </div>
              <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{detail}</div>
            </div>
            <Button variant="primary" size="sm" onClick={() => onJoin(s.id)} icon={<Icon name="eye" style={{ width: 13, height: 13 }} />}>
              Join
            </Button>
          </div>
        );
      })}
    </div>
  );
}
