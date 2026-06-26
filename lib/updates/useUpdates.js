'use client';

import React from 'react';
import {
  isDesktop,
  getState,
  subscribe,
  checkForUpdates,
  installUpdate,
  openDownload,
} from './bridge';

// One source of truth for update state, shared by the popup and Settings.
// Seeds from the main process, then live-updates as events stream in.
export function useUpdates() {
  const desktop = isDesktop();
  const [state, setState] = React.useState(null);

  React.useEffect(() => {
    if (!desktop) return undefined;
    let alive = true;
    getState().then((s) => {
      if (alive && s) setState(s);
    });
    const unsub = subscribe((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [desktop]);

  return {
    desktop,
    status: state?.status || (desktop ? 'idle' : 'web'),
    progress: state?.progress || 0,
    version: state?.version || null,
    currentVersion: state?.currentVersion || null,
    error: state?.error || null,
    canInstall: !!state?.canInstall,
    check: checkForUpdates,
    install: installUpdate,
    openDownload,
  };
}
