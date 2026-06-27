'use client';

import React from 'react';

// Outgoing side: debounced "I'm typing" pings. Call bump() on each keystroke —
// it fires notify(true) once, then notify(false) after a short pause. stop()
// forces an immediate notify(false) (e.g. on send / blur / unmount).
export function useTypingEmitter(notify) {
  const sentRef = React.useRef(false);
  const timerRef = React.useRef(null);
  const notifyRef = React.useRef(notify);
  React.useEffect(() => { notifyRef.current = notify; }, [notify]);

  const stop = React.useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (sentRef.current) { sentRef.current = false; notifyRef.current?.(false); }
  }, []);

  const bump = React.useCallback(() => {
    if (!sentRef.current) { sentRef.current = true; notifyRef.current?.(true); }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(stop, 2500);
  }, [stop]);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { bump, stop };
}

// Incoming side: tracks whether the peer is typing, auto-clearing after 4s in
// case the matching stop ping is dropped. Returns [isTyping, setTyping].
export function usePeerTyping() {
  const [typing, setTyping] = React.useState(false);
  const timerRef = React.useRef(null);

  const set = React.useCallback((on) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setTyping(on);
    if (on) timerRef.current = setTimeout(() => setTyping(false), 4000);
  }, []);

  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return [typing, set];
}
