'use client';

// Thin client wrapper over the Electron auto-update bridge (window.strix.updates).
// In a plain browser there's no desktop shell, so everything is inert.

function api() {
  if (typeof window === 'undefined') return null;
  return window.strix?.updates || null;
}

export function isDesktop() {
  return typeof window !== 'undefined' && !!window.strix?.isDesktop;
}

export async function getState() {
  const u = api();
  if (!u) return null;
  try {
    return await u.state();
  } catch {
    return null;
  }
}

export async function checkForUpdates() {
  const u = api();
  if (!u) return null;
  try {
    return await u.check();
  } catch {
    return null;
  }
}

export async function installUpdate() {
  const u = api();
  if (!u) return;
  try {
    await u.install();
  } catch {
    /* ignore */
  }
}

export async function openDownload() {
  const u = api();
  if (!u) return;
  try {
    await u.openDownload();
  } catch {
    /* ignore */
  }
}

// Subscribe to update lifecycle events. Returns an unsubscribe fn.
export function subscribe(cb) {
  const u = api();
  if (!u) return () => {};
  try {
    return u.subscribe(cb) || (() => {});
  } catch {
    return () => {};
  }
}
