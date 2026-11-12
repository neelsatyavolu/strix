// Xanom sign-in: the security-critical pieces as pure functions, so the node
// tests in test/xanom.test.mjs can exercise them without Next or Supabase.
// Contract: xanom-accounts docs/SPEC.md (sections 2-4).
import { SignJWT, jwtVerify, base64url } from 'jose';

export const FLOW_TTL_SECONDS = 600;
export const TICKET_TTL_SECONDS = 300;
const INTENTS = new Set(['signin', 'link', 'convert']);
const enc = new TextEncoder();

function randomToken(bytes = 32) {
  return base64url.encode(crypto.getRandomValues(new Uint8Array(bytes)));
}

export function normalizeIntent(raw) {
  return INTENTS.has(raw) ? raw : 'signin';
}

// Same-origin path only: "/app#/settings" yes, "//evil.com" or "https://..." no.
export function safeReturnPath(raw, fallback = '/app') {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return fallback;
  if (raw.startsWith('//') || raw.startsWith('/\\') || /[\r\n]/.test(raw)) return fallback;
  return raw;
}

export async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(verifier));
  return base64url.encode(new Uint8Array(digest));
}

// The flow cookie key is derived from the client secret, so no extra env var.
async function flowKey(clientSecret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode('strix-xanom-flow-cookie')));
}

// Fresh state + nonce + PKCE verifier for one authorize round trip.
/** @param {{ intent: string | null, returnTo: string, userId?: string | null }} args */
export function newFlow({ intent, returnTo, userId = null }) {
  return {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(48),
    intent: normalizeIntent(intent),
    returnTo: safeReturnPath(returnTo),
    userId,
  };
}

/** @param {object} flow @param {string} clientSecret @param {number} [now] */
export async function sealFlow(flow, clientSecret, now = Math.floor(Date.now() / 1000)) {
  return new SignJWT({ ...flow })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience('strix-xanom-flow')
    .setIssuedAt(now)
    .setExpirationTime(now + FLOW_TTL_SECONDS)
    .sign(await flowKey(clientSecret));
}

// Returns the flow, or null if the cookie is missing, forged, expired, or its
// state doesn't match the one Xanom sent back.
/** @param {string | undefined} cookieValue @param {string | null} returnedState @param {string} clientSecret @param {number} [now] */
export async function openFlow(cookieValue, returnedState, clientSecret, now) {
  if (!cookieValue || !returnedState) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, await flowKey(clientSecret), {
      algorithms: ['HS256'],
      audience: 'strix-xanom-flow',
      ...(now ? { currentDate: new Date(now * 1000) } : {}),
    });
    if (typeof payload.state !== 'string' || !timingSafeEqual(payload.state, returnedState)) return null;
    return {
      state: payload.state,
      nonce: String(payload.nonce),
      verifier: String(payload.verifier),
      intent: normalizeIntent(payload.intent),
      returnTo: safeReturnPath(payload.returnTo),
      userId: typeof payload.userId === 'string' ? payload.userId : null,
    };
  } catch {
    return null;
  }
}

export function timingSafeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

/** @param {{ issuer: string, clientId: string, redirectUri: string, flow: { state: string, nonce: string, verifier: string }, convert?: string, loginHint?: string }} args */
export async function authorizeUrl({ issuer, clientId, redirectUri, flow, convert, loginHint }) {
  const u = new URL('/oauth/authorize', issuer);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', flow.state);
  u.searchParams.set('nonce', flow.nonce);
  u.searchParams.set('code_challenge', await pkceChallenge(flow.verifier));
  u.searchParams.set('code_challenge_method', 'S256');
  if (convert) u.searchParams.set('convert', convert);
  if (loginHint) u.searchParams.set('login_hint', loginHint);
  return u.toString();
}

// id_token: RS256 against the issuer JWKS; iss, aud, exp, nonce all checked.
/** @param {string} idToken @param {{ jwks: any, issuer: string, clientId: string, nonce: string, now?: number }} opts */
export async function verifyIdToken(idToken, { jwks, issuer, clientId, nonce, now }) {
  const { payload } = await jwtVerify(idToken, jwks, {
    algorithms: ['RS256'],
    issuer,
    audience: clientId,
    requiredClaims: ['sub', 'exp', 'iat'],
    ...(now ? { currentDate: new Date(now * 1000) } : {}),
  });
  if (typeof payload.nonce !== 'string' || !timingSafeEqual(payload.nonce, nonce)) {
    throw new Error('id_token nonce mismatch');
  }
  if (typeof payload.email !== 'string' || payload.email_verified !== true) {
    throw new Error('id_token has no verified email');
  }
  return {
    sub: String(payload.sub),
    email: payload.email.toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}

// Convert ticket (§3): HS256, key = client secret bytes, 5 minute life.
/** @param {{ clientId: string, clientSecret: string, issuer: string, email: string, name?: string, emailVerified?: boolean, now?: number }} args */
export async function signConvertTicket({ clientId, clientSecret, issuer, email, name, emailVerified, now = Math.floor(Date.now() / 1000) }) {
  return new SignJWT({ email, name: name || '', email_verified: emailVerified === true })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(clientId)
    .setAudience(issuer)
    .setJti(randomToken(16))
    .setIssuedAt(now)
    .setExpirationTime(now + TICKET_TTL_SECONDS)
    .sign(enc.encode(clientSecret));
}

// Summary bearer (§4): RS256 from the account service, aud = our client_id.
/** @param {string} token @param {{ jwks: any, issuer: string, clientId: string, now?: number }} opts */
export async function verifySummaryToken(token, { jwks, issuer, clientId, now }) {
  const { payload } = await jwtVerify(token, jwks, {
    algorithms: ['RS256'],
    issuer,
    audience: clientId,
    requiredClaims: ['sub', 'exp', 'iat'],
    ...(now ? { currentDate: new Date(now * 1000) } : {}),
  });
  if (payload.scope !== 'summary') throw new Error('wrong scope');
  return { sub: String(payload.sub) };
}

// Linking rules (§2), in order. Inputs are plain facts looked up by the caller:
//   linkedUserId  user that already has this xanom_sub (or null)
//   currentUser   { id, email, linkedSub } signed-in Strix user (or null)
//   emailUser     { id, linkedSub, hasPassword, emailVerified } with the same email (or null)
// Returns { action: 'signin' | 'attach' | 'create' | 'error', ... }.
/**
 * @typedef {{ action: 'signin', userId: string }
 *   | { action: 'attach', userId: string, guard: boolean, signin: boolean }
 *   | { action: 'create' }
 *   | { action: 'error', code: string }} LinkDecision
 * @param {{ intent: string, sub: string, email: string, linkedUserId: string | null,
 *   currentUser: { id: string, email: string, linkedSub: string | null } | null,
 *   emailUser: { id: string, linkedSub: string | null, hasPassword: boolean, emailVerified: boolean } | null }} facts
 * @returns {LinkDecision}
 */
export function decideLink({ intent, sub, email, linkedUserId, currentUser, emailUser }) {
  const linking = intent === 'link' || intent === 'convert';

  // Rule 2's refusal comes first for link/convert: never switch accounts on
  // someone who asked to link, and never move a sub between users.
  if (linking && currentUser) {
    if (linkedUserId && linkedUserId !== currentUser.id) return { action: 'error', code: 'sub_taken' };
    if (linkedUserId === currentUser.id) return { action: 'signin', userId: currentUser.id };
    if (currentUser.linkedSub && currentUser.linkedSub !== sub) return { action: 'error', code: 'already_linked' };
    if (intent === 'convert' && (currentUser.email || '').toLowerCase() !== email.toLowerCase()) {
      return { action: 'error', code: 'email_mismatch' };
    }
    return { action: 'attach', userId: currentUser.id, guard: false, signin: false };
  }

  // Rule 1.
  if (linkedUserId) return { action: 'signin', userId: linkedUserId };

  // Rule 3 (+ pre-hijacking guard).
  if (emailUser) {
    if (emailUser.linkedSub && emailUser.linkedSub !== sub) return { action: 'error', code: 'email_linked_elsewhere' };
    const guard = !emailUser.emailVerified && emailUser.hasPassword;
    return { action: 'attach', userId: emailUser.id, guard, signin: true };
  }

  // Rule 4.
  return { action: 'create' };
}
