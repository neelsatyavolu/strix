import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Web OAuth config for the user's OWN ChatGPT (Codex) / Grok subscription.
// These impersonate the official CLI clients, so the redirect URIs are the
// CLIs' fixed loopback addresses. On the web there is no loopback listening, so
// the user signs in, copies the callback link (ChatGPT) or the code (Grok) the
// browser shows, and pastes it back to us — we do the PKCE token exchange.

export type Provider = "codex" | "grok";

type ProviderConfig = {
  clientId: string;
  redirectUri: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  defaultModel: string;
  // Buffer (seconds) subtracted from expires_in so we refresh before expiry.
  expiryBufferSec: number;
  extraAuthorizeParams?: Record<string, string>;
};

export const PROVIDERS: Record<Provider, ProviderConfig> = {
  codex: {
    clientId: "app_EMoamEEZ73f0CkXaXp7hrann",
    redirectUri: "http://localhost:1455/auth/callback",
    authorizeUrl: "https://auth.openai.com/oauth/authorize",
    tokenUrl: "https://auth.openai.com/oauth/token",
    scope: "openid profile email offline_access",
    defaultModel: process.env.CODEX_MODEL ?? "gpt-5.5",
    expiryBufferSec: 60,
    extraAuthorizeParams: {
      id_token_add_organizations: "true",
      codex_cli_simplified_flow: "true",
      originator: "codex_cli_rs",
    },
  },
  grok: {
    clientId: "b1a00492-073a-47ea-816f-4c329264a828",
    redirectUri: "http://127.0.0.1:56121/callback",
    authorizeUrl: "https://auth.x.ai/oauth2/authorize",
    tokenUrl: "https://auth.x.ai/oauth2/token",
    scope: "openid profile email offline_access grok-cli:access api:access",
    defaultModel: process.env.GROK_MODEL ?? "grok-4.5",
    expiryBufferSec: 120,
  },
};

export function isProvider(p: string): p is Provider {
  return p === "codex" || p === "grok";
}

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  accountId?: string; // codex only — sent as chatgpt-account-id
};

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generatePkce(): { verifier: string; challenge: string; state: string } {
  const verifier = base64url(randomBytes(64));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const state = base64url(randomBytes(32));
  return { verifier, challenge, state };
}

export function buildAuthorizeUrl(provider: Provider, challenge: string, state: string): string {
  const cfg = PROVIDERS[provider];
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: cfg.scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    ...(cfg.extraAuthorizeParams ?? {}),
  });
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

// Pull the authorization code (and state, if present) from whatever the user
// pasted: a full callback URL, a bare query string, or just the code itself.
export function extractCodeAndState(input: string): { code: string | null; state: string | null } {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { code: null, state: null };
  try {
    if (trimmed.includes("://")) {
      const url = new URL(trimmed);
      return { code: url.searchParams.get("code"), state: url.searchParams.get("state") };
    }
    if (trimmed.startsWith("?") || /(?:^|[?&])(?:code|state)=/.test(trimmed)) {
      const params = new URLSearchParams(trimmed.replace(/^\?/, ""));
      return { code: params.get("code"), state: params.get("state") };
    }
  } catch {
    return { code: null, state: null };
  }
  // Bare code (Grok's flow shows just a code).
  return { code: trimmed, state: null };
}

function decodeAccountId(idToken: string | undefined): string | undefined {
  if (!idToken) return undefined;
  const parts = idToken.split(".");
  if (parts.length < 2) return undefined;
  try {
    const payload = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const claims = JSON.parse(payload);
    const orgs = claims?.["https://api.openai.com/auth"]?.organizations;
    if (Array.isArray(orgs) && orgs.length > 0) {
      const personal = orgs.find((o: { is_default?: boolean }) => o?.is_default) ?? orgs[0];
      return personal?.id;
    }
    return claims?.sub;
  } catch {
    return undefined;
  }
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
};

async function postToken(
  provider: Provider,
  body: URLSearchParams,
  fallbackRefreshToken?: string,
): Promise<Tokens> {
  const cfg = PROVIDERS[provider];
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${provider} token exchange failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as TokenResponse;
  const refreshToken = json.refresh_token ?? fallbackRefreshToken;
  if (!refreshToken) throw new Error(`${provider} token response did not include a refresh token.`);
  return {
    accessToken: json.access_token,
    refreshToken,
    expiresAt: Date.now() + (json.expires_in - cfg.expiryBufferSec) * 1000,
    accountId: decodeAccountId(json.id_token),
  };
}

export function exchangeCode(provider: Provider, code: string, verifier: string): Promise<Tokens> {
  const cfg = PROVIDERS[provider];
  return postToken(
    provider,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: cfg.redirectUri,
      client_id: cfg.clientId,
      code_verifier: verifier,
    }),
  );
}

export function refreshTokens(provider: Provider, refreshToken: string): Promise<Tokens> {
  const cfg = PROVIDERS[provider];
  return postToken(
    provider,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: cfg.clientId,
      scope: cfg.scope,
    }),
    refreshToken,
  );
}
