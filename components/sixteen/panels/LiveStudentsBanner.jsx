'use client';

import { Button, Avatar } from '@/components/sixteen';
import s from './LiveStudentsBanner.module.css';

// Top-center toast shown when one of the tutor's students starts a practice
// section and isn't already being watched. Clicking Join opens that student's
// live view — it never switches the tutor automatically.
const SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };

export default function LiveStudentsBanner({ students, liveStudents, watchedStudentId, onJoin }) {
  const alerts = (students || []).filter((st) => {
    const live = liveStudents?.[st.id];
    return live && live.active && st.id !== watchedStudentId;
  });
  if (alerts.length === 0) return null;

  return (
    <div className={s.stack} role="status" aria-live="polite">
      {alerts.map((st) => {
        const live = liveStudents[st.id];
        const reviewing = live.mode === 'review';
        const title = reviewing ? `${st.name} is reviewing a session` : `${st.name} started practicing`;
        const detail = reviewing
          ? 'Join to go through it together'
          : (live.domainLabel || SECTION_LABEL[live.section] || 'A practice section');
        return (
          <div key={st.id} className={s.toast}>
            <Avatar name={st.name} size="sm" presence="online" />
            <div className={s.text}>
              <span className={s.title}>{title}</span>
              <span className={s.detail}>{detail}</span>
            </div>
            <Button variant="primary" size="sm" onClick={() => onJoin(st.id)}>Join</Button>
          </div>
        );
      })}
    </div>
  );
}
