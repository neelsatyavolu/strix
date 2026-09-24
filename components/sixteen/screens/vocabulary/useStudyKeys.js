'use client';
import React from 'react';

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ACTIVATING_KEYS = new Set([' ', 'Enter']);

/**
 * Window-level keyboard shortcuts for the study session. `onKey(key)` returns true
 * when it handled the key (the default is then prevented). Ignores typing in fields,
 * modifier combos, and Space/Enter on a focused button (native click wins there).
 */
export function useStudyKeys(onKey) {
  const ref = React.useRef(onKey);
  React.useEffect(() => {
    ref.current = onKey;
  });

  React.useEffect(() => {
    const handle = (e) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const tag = t?.tagName;
      if (TYPING_TAGS.has(tag) || t?.isContentEditable) return;
      if (ACTIVATING_KEYS.has(e.key) && (tag === 'BUTTON' || tag === 'A')) return;
      if (ref.current(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
}
