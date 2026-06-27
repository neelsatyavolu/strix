import "server-only";
import { cookies } from "next/headers";
import { type Provider, type Tokens, refreshTokens } from "./providers";

// Per-browser token storage in httpOnly cookies. Tokens can exceed a single
// cookie's size, so we chunk them. Mirrors the desktop keychain: the user's own
// provider credentials live with the user, never in our database.

const SESSION_TTL_DAYS = 30;
const PKCE_TTL_SECONDS = 10 * 60;
const CHUNK_SIZE = 3500;
const MAX_CHUNKS = 6;

const sessionPrefix = (p: Provider) => `${p}_session`;
const pkceCookie = (p: Provider) => `${p}_pkce`;

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge,
});

type PkceCookie = { verifier: string; state: string };

export async function writePkce(provider: Provider, value: PkceCookie): Promise<void> {
  const jar = await cookies();
  jar.set(pkceCookie(provider), JSON.stringify(value), cookieOptions(PKCE_TTL_SECONDS));
}

export async function readPkce(provider: Provider): Promise<PkceCookie | null> {
  const jar = await cookies();
  const raw = jar.get(pkceCookie(provider))?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.verifier === "string" && typeof parsed.state === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export async function clearPkce(provider: Provider): Promise<void> {
  const jar = await cookies();
  jar.delete(pkceCookie(provider));
}

function chunkString(s: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

export async function writeSession(provider: Provider, tokens: Tokens): Promise<void> {
  const json = JSON.stringify(tokens);
  const chunks = chunkString(json, CHUNK_SIZE);
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(`${provider} session too large to fit in ${MAX_CHUNKS} cookies.`);
  }
  const jar = await cookies();
  const opts = cookieOptions(SESSION_TTL_DAYS * 24 * 60 * 60);
  const prefix = sessionPrefix(provider);
  chunks.forEach((chunk, i) => jar.set(`${prefix}_${i}`, chunk, opts));
  for (let i = chunks.length; i < MAX_CHUNKS; i++) jar.delete(`${prefix}_${i}`);
}

export async function clearSession(provider: Provider): Promise<void> {
  const jar = await cookies();
  const prefix = sessionPrefix(provider);
  for (let i = 0; i < MAX_CHUNKS; i++) jar.delete(`${prefix}_${i}`);
}

async function readSessionRaw(provider: Provider): Promise<Tokens | null> {
  const jar = await cookies();
  const prefix = sessionPrefix(provider);
  let joined = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const v = jar.get(`${prefix}_${i}`)?.value;
    if (!v) break;
    joined += v;
  }
  if (!joined) return null;
  try {
    const parsed = JSON.parse(joined);
    if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") {
      return null;
    }
    return parsed as Tokens;
  } catch {
    return null;
  }
}

// Presence check only (no refresh) — used by the status endpoint.
export async function hasSession(provider: Provider): Promise<boolean> {
  return (await readSessionRaw(provider)) !== null;
}

// Returns a valid token, refreshing (and re-persisting) when near expiry.
export async function getActiveSession(provider: Provider): Promise<Tokens | null> {
  const session = await readSessionRaw(provider);
  if (!session) return null;
  if (session.expiresAt > Date.now() + 30_000) return session;
  try {
    const refreshed = await refreshTokens(provider, session.refreshToken);
    const merged: Tokens = { ...refreshed, accountId: refreshed.accountId ?? session.accountId };
    await writeSession(provider, merged);
    return merged;
  } catch (err) {
    console.error(`[ai-session] ${provider} refresh failed:`, err);
    await clearSession(provider);
    return null;
  }
}
