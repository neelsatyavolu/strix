// Offline-durable queue for completed practice sessions. When the submit POST
// to /api/sessions fails (network drop, server hiccup), the payload is queued
// in localStorage and re-sent on the next app load / reconnect, so a finished
// test is never silently lost. Core functions take storage/post as arguments
// so they're testable under node.

const KEY = 'strix-pending-sessions';
const MAX_ENTRIES = 8;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function parseEntries(raw) {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function readPending(storage) {
  try {
    return parseEntries(storage.getItem(KEY));
  } catch {
    return [];
  }
}

function writePending(storage, entries) {
  try {
    if (entries.length) storage.setItem(KEY, JSON.stringify(entries));
    else storage.removeItem(KEY);
  } catch {
    /* quota / unavailable — the queue degrades to best-effort */
  }
}

/** Queue a failed session payload. Oldest entries are dropped past the cap. */
export function enqueuePending(storage, body, now = Date.now()) {
  const entries = [...readPending(storage), { body, queuedAt: now }].slice(-MAX_ENTRIES);
  writePending(storage, entries);
  return entries;
}

/**
 * Re-send queued payloads. `post(body)` resolves to:
 *  { ok: true }                  — delivered, drop from the queue
 *  { ok: false, permanent: true }  — rejected for good (e.g. 400), drop
 *  { ok: false, permanent: false } — transient, keep for the next flush
 */
export async function flushPending(storage, post, now = Date.now()) {
  const entries = readPending(storage);
  if (!entries.length) return { sent: 0, kept: 0 };
  const kept = [];
  let sent = 0;
  for (const entry of entries) {
    if (now - (entry.queuedAt || 0) > MAX_AGE_MS) continue;
    const res = await post(entry.body).catch(() => ({ ok: false, permanent: false }));
    if (res?.ok) sent += 1;
    else if (!res?.permanent) kept.push(entry);
  }
  writePending(storage, kept);
  return { sent, kept: kept.length };
}

// ---- browser bindings -------------------------------------------------------

let flushing = false;

export function enqueuePendingSession(body) {
  if (typeof window === 'undefined') return;
  enqueuePending(window.localStorage, body);
}

export async function flushPendingSessions() {
  if (typeof window === 'undefined' || flushing) return { sent: 0, kept: 0 };
  flushing = true;
  try {
    return await flushPending(window.localStorage, async (body) => {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // 400 = the payload itself is invalid; retrying can never succeed.
      return { ok: res.ok, permanent: res.status === 400 };
    });
  } finally {
    flushing = false;
  }
}
