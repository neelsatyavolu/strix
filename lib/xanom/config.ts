import "server-only";
import { createRemoteJWKSet } from "jose";

export interface XanomConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
}

export function xanomConfig(): XanomConfig | null {
  const issuer = process.env.XANOM_ISSUER?.replace(/\/+$/, "");
  const clientId = process.env.XANOM_CLIENT_ID;
  const clientSecret = process.env.XANOM_CLIENT_SECRET;
  if (!issuer || !clientId || !clientSecret) return null;
  return { issuer, clientId, clientSecret };
}

// One JWKS fetcher per issuer, keys cached for 10 minutes (spec §4).
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export function xanomJwks(issuer: string) {
  const hit = jwksCache.get(issuer);
  if (hit) return hit;
  const jwks = createRemoteJWKSet(new URL("/oauth/jwks", issuer), {
    cacheMaxAge: 10 * 60 * 1000,
    timeoutDuration: 3000,
  });
  jwksCache.set(issuer, jwks);
  return jwks;
}

export const FLOW_COOKIE = "strix_xanom_flow";
