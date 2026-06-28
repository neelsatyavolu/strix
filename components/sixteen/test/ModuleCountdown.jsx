'use client';
import React from 'react';
import { moduleTimerSeconds } from '@/lib/practice/sessionLogic.mjs';

export function ModuleCountdown({
  Timer,
  section,
  timerRunning,
  hidden,
  onToggleHide,
  onSecondsChange,
  onExpire,
}) {
  const [seconds, setSeconds] = React.useState(moduleTimerSeconds(section));
  const expiredRef = React.useRef(false);

  React.useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  React.useEffect(() => {
    onSecondsChange?.(seconds);
  }, [seconds, onSecondsChange]);

  React.useEffect(() => {
    if (!timerRunning) return;
    if (seconds === 0 && !expiredRef.current) {
      expiredRef.current = true;
      onExpire();
    }
  }, [seconds, timerRunning, onExpire]);

  return <Timer seconds={seconds} hidden={hidden} onToggleHide={onToggleHide} />;
}

export default ModuleCountdown;
