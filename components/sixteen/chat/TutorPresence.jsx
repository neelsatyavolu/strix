'use client';
import React from 'react';
import s from './Chat.module.css';
import { cx } from '../core/cx';

const STATUS_TEXT = { online: 'Online', idle: 'Idle', offline: 'Offline' };

/**
 * TutorPresence — status dot + name + "Online/Offline" (or "Watching"). Sits in
 * chat headers. Pass an empty `name` to show only the dot and status.
 */
export function TutorPresence({
  name,
  status = 'online',         // 'online' | 'idle' | 'offline'
  watching = false,          // true while the tutor is actively watching the screen
  className,
  style: styleProp,
}) {
  return (
    <span className={cx(s.presence, className)} style={styleProp}>
      <span className={cx(s.presenceDot, status === 'online' && s.online, status === 'idle' && s.idle)}>
        {watching && <span className={s.ring} />}
      </span>
      {name && <span className={s.presenceName}>{name}</span>}
      <span className={s.presenceStatus}>{watching ? 'Watching' : (STATUS_TEXT[status] || 'Offline')}</span>
    </span>
  );
}
