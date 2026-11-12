'use client';

// Client helpers for Xanom sign-in. The whole OIDC flow runs server-side under
// /api/xanom; the browser (or the desktop app's window) just navigates there.

const MESSAGES = {
  cancelled: 'Xanom sign-in was cancelled.',
  bad_state: 'That Xanom sign-in link expired. Please try again.',
  signed_out: 'Sign in to Strix first, then link your Xanom account.',
  sub_taken: 'That Xanom account is already linked to a different Strix account.',
  already_linked: 'This Strix account is already linked to a Xanom account.',
  email_mismatch: 'To convert, use a Xanom account with the same email as this Strix account, or choose "Link an existing Xanom account".',
  email_linked_elsewhere: 'A Strix account with this email is linked to a different Xanom account. Sign in with your password or Google instead.',
  no_email: 'This Strix account has no email address to convert.',
  unavailable: 'Xanom sign-in is not available right now.',
};

export function startXanom(intent, returnTo) {
  const q = new URLSearchParams({ intent, return: returnTo });
  // A full navigation to a server route (not a Next page): it redirects on to
  // accounts.xanom.co and back. Works the same in the desktop app's window.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- server route, not a page
  window.location.href = `/api/xanom/start?${q}`;
}

// The message for ?xanom_error=… on the current URL, or null. Pure read.
export function readXanomError() {
  if (typeof window === 'undefined') return null;
  const code = new URLSearchParams(window.location.search).get('xanom_error');
  return code ? (MESSAGES[code] || 'Xanom sign-in failed. Please try again.') : null;
}

// Drop ?xanom_error / ?xanom from the address bar (keeps the #/view hash).
export function clearXanomParams() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('xanom_error') && !url.searchParams.has('xanom')) return;
  url.searchParams.delete('xanom_error');
  url.searchParams.delete('xanom');
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}
