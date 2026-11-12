import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet, jwtVerify, decodeProtectedHeader } from 'jose';
import {
  decideLink, newFlow, sealFlow, openFlow, authorizeUrl, pkceChallenge, safeReturnPath,
  verifyIdToken, signConvertTicket, verifySummaryToken,
} from '../lib/xanom/core.mjs';

const ISSUER = 'https://accounts.xanom.co';
const CLIENT = 'strix';
const SECRET = 'test-client-secret-not-real';

// Local fake issuer: an RS256 key and the JWKS the app would fetch.
const issuerKeys = await generateKeyPair('RS256');
const otherKeys = await generateKeyPair('RS256');
const jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(issuerKeys.publicKey)), kid: 'k1', alg: 'RS256' }] });

async function issue(claims, { key = issuerKeys.privateKey, aud = CLIENT, iss = ISSUER, exp = '10m', iat } = {}) {
  const jwt = new SignJWT(claims).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(iss).setAudience(aud).setSubject('xa_01TEST');
  if (iat) jwt.setIssuedAt(iat); else jwt.setIssuedAt();
  return jwt.setExpirationTime(exp).sign(key);
}

// ---- linking rules ----------------------------------------------------------
const base = { sub: 'xa_1', email: 'a@x.com', linkedUserId: null, currentUser: null, emailUser: null };

test('rule 1: existing link signs in as that user', () => {
  assert.deepEqual(decideLink({ ...base, intent: 'signin', linkedUserId: 'u1' }), { action: 'signin', userId: 'u1' });
});

test('rule 2: link attaches to the signed-in user even with a different email', () => {
  const d = decideLink({ ...base, intent: 'link', currentUser: { id: 'u2', email: 'other@x.com', linkedSub: null } });
  assert.deepEqual(d, { action: 'attach', userId: 'u2', guard: false, signin: false });
});

test('rule 2: refuses a sub already on another user', () => {
  const d = decideLink({ ...base, intent: 'link', linkedUserId: 'u9', currentUser: { id: 'u2', email: 'a@x.com', linkedSub: null } });
  assert.deepEqual(d, { action: 'error', code: 'sub_taken' });
});

test('rule 2: convert requires the same email', () => {
  const cur = { id: 'u2', email: 'other@x.com', linkedSub: null };
  assert.equal(decideLink({ ...base, intent: 'convert', currentUser: cur }).code, 'email_mismatch');
  const ok = decideLink({ ...base, intent: 'convert', currentUser: { ...cur, email: 'A@X.com' } });
  assert.equal(ok.action, 'attach');
});

test('rule 2: refuses when the current user is linked to a different sub', () => {
  const d = decideLink({ ...base, intent: 'link', currentUser: { id: 'u2', email: 'a@x.com', linkedSub: 'xa_other' } });
  assert.equal(d.code, 'already_linked');
});

test('rule 3: same email attaches and signs in; verified email skips the guard', () => {
  const d = decideLink({ ...base, intent: 'signin', emailUser: { id: 'u3', linkedSub: null, hasPassword: true, emailVerified: true } });
  assert.deepEqual(d, { action: 'attach', userId: 'u3', guard: false, signin: true });
});

test('rule 3 guard: unverified email with a password revokes password and sessions', () => {
  const d = decideLink({ ...base, intent: 'signin', emailUser: { id: 'u3', linkedSub: null, hasPassword: true, emailVerified: false } });
  assert.equal(d.guard, true);
  const noPw = decideLink({ ...base, intent: 'signin', emailUser: { id: 'u3', linkedSub: null, hasPassword: false, emailVerified: false } });
  assert.equal(noPw.guard, false);
});

test('rule 3: link/convert with nobody signed in falls through to email match', () => {
  const d = decideLink({ ...base, intent: 'link', emailUser: { id: 'u3', linkedSub: null, hasPassword: true, emailVerified: false } });
  assert.equal(d.action, 'attach');
  assert.equal(d.guard, true);
});

test('rule 3: email user linked to a different sub is refused', () => {
  const d = decideLink({ ...base, intent: 'signin', emailUser: { id: 'u3', linkedSub: 'xa_old', hasPassword: false, emailVerified: true } });
  assert.equal(d.code, 'email_linked_elsewhere');
});

test('rule 4: nobody matches, create a user', () => {
  assert.deepEqual(decideLink({ ...base, intent: 'signin' }), { action: 'create' });
});

// ---- state / PKCE / nonce ----------------------------------------------------
test('flow cookie round-trips and checks state', async () => {
  const flow = newFlow({ intent: 'link', returnTo: '/app#/settings', userId: 'u1' });
  const sealed = await sealFlow(flow, SECRET);
  assert.deepEqual(await openFlow(sealed, flow.state, SECRET), flow);
  assert.equal(await openFlow(sealed, 'wrong-state', SECRET), null);
  assert.equal(await openFlow(sealed, flow.state, 'other-secret'), null);
  assert.equal(await openFlow(undefined, flow.state, SECRET), null);
  const tampered = sealed.slice(0, -4) + (sealed.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.equal(await openFlow(tampered, flow.state, SECRET), null);
});

test('flow cookie expires after 10 minutes', async () => {
  const flow = newFlow({ intent: 'signin', returnTo: '/app' });
  const t0 = 1_800_000_000;
  const sealed = await sealFlow(flow, SECRET, t0);
  assert.ok(await openFlow(sealed, flow.state, SECRET, t0 + 599));
  assert.equal(await openFlow(sealed, flow.state, SECRET, t0 + 601), null);
});

test('return paths stay on this origin', () => {
  assert.equal(safeReturnPath('/app#/settings'), '/app#/settings');
  for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', '/\t/evil.com', decodeURIComponent('/%09/evil.com'), '/\n/evil.com', '', null, 'app']) assert.equal(safeReturnPath(bad), '/app');
});

test('authorize URL carries state, nonce, S256 PKCE and convert', async () => {
  const flow = newFlow({ intent: 'convert', returnTo: '/app' });
  const u = new URL(await authorizeUrl({ issuer: ISSUER, clientId: CLIENT, redirectUri: 'https://strixprep.com/api/xanom/callback', flow, convert: 'T', loginHint: 'a@x.com' }));
  assert.equal(u.origin + u.pathname, `${ISSUER}/oauth/authorize`);
  assert.equal(u.searchParams.get('response_type'), 'code');
  assert.equal(u.searchParams.get('client_id'), CLIENT);
  assert.equal(u.searchParams.get('state'), flow.state);
  assert.equal(u.searchParams.get('nonce'), flow.nonce);
  assert.equal(u.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(u.searchParams.get('code_challenge'), await pkceChallenge(flow.verifier));
  assert.equal(u.searchParams.get('convert'), 'T');
  assert.ok(u.searchParams.get('scope').split(' ').includes('openid'));
});

test('PKCE challenge matches the RFC 7636 example', async () => {
  assert.equal(await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'), 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
});

// ---- id_token -----------------------------------------------------------------
const idOpts = { jwks, issuer: ISSUER, clientId: CLIENT, nonce: 'n1' };
const idClaims = { email: 'A@X.com', email_verified: true, name: 'A', nonce: 'n1' };

test('id_token: good token verifies and lowercases email', async () => {
  const c = await verifyIdToken(await issue(idClaims), idOpts);
  assert.deepEqual(c, { sub: 'xa_01TEST', email: 'a@x.com', name: 'A' });
});

test('id_token: wrong nonce, aud, iss, signature, or expiry fail', async () => {
  await assert.rejects(verifyIdToken(await issue({ ...idClaims, nonce: 'n2' }), idOpts));
  await assert.rejects(verifyIdToken(await issue(idClaims, { aud: 'mullwell' }), idOpts));
  await assert.rejects(verifyIdToken(await issue(idClaims, { iss: 'https://evil.example' }), idOpts));
  await assert.rejects(verifyIdToken(await issue(idClaims, { key: otherKeys.privateKey }), idOpts));
  await assert.rejects(verifyIdToken(await issue(idClaims, { iat: 1_000_000, exp: 1_000_600 }), idOpts));
  await assert.rejects(verifyIdToken(await issue({ ...idClaims, email_verified: false }), idOpts));
});

// ---- convert ticket ------------------------------------------------------------
test('convert ticket: HS256 with client secret, correct claims, 300 s life', async () => {
  const now = Math.floor(Date.now() / 1000);
  const t = await signConvertTicket({ clientId: CLIENT, clientSecret: SECRET, issuer: ISSUER, email: 'a@x.com', name: 'A', emailVerified: true, now });
  assert.deepEqual(decodeProtectedHeader(t), { alg: 'HS256', typ: 'JWT' });
  const { payload } = await jwtVerify(t, new TextEncoder().encode(SECRET), { issuer: CLIENT, audience: ISSUER });
  assert.equal(payload.email, 'a@x.com');
  assert.equal(payload.email_verified, true);
  assert.equal(payload.exp - payload.iat, 300);
  assert.ok(typeof payload.jti === 'string' && payload.jti.length >= 16);
  await assert.rejects(jwtVerify(t, new TextEncoder().encode('wrong'), { audience: ISSUER }));
  const unverified = await signConvertTicket({ clientId: CLIENT, clientSecret: SECRET, issuer: ISSUER, email: 'a@x.com', name: '', emailVerified: undefined });
  assert.equal((await jwtVerify(unverified, new TextEncoder().encode(SECRET))).payload.email_verified, false);
});

// ---- summary JWT ---------------------------------------------------------------
const sumOpts = { jwks, issuer: ISSUER, clientId: CLIENT };

test('summary token: good one verifies', async () => {
  assert.deepEqual(await verifySummaryToken(await issue({ scope: 'summary' }, { exp: '60s' }), sumOpts), { sub: 'xa_01TEST' });
});

test('summary token: wrong aud, expired, bad signature, wrong scope are rejected', async () => {
  await assert.rejects(verifySummaryToken(await issue({ scope: 'summary' }, { aud: 'tare' }), sumOpts));
  await assert.rejects(verifySummaryToken(await issue({ scope: 'summary' }, { iat: 1_000_000, exp: 1_000_060 }), sumOpts));
  await assert.rejects(verifySummaryToken(await issue({ scope: 'summary' }, { key: otherKeys.privateKey }), sumOpts));
  await assert.rejects(verifySummaryToken(await issue({ scope: 'openid' }), sumOpts));
  await assert.rejects(verifySummaryToken('not.a.jwt', sumOpts));
});
