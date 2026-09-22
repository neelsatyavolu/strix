import "server-only";
import {
  authorizeUrl, exchangeCode as exchange, generatePkce, parseCallback,
  providers, refreshTokens as refresh,
} from "@neelsatyavolu/shared-ai-auth";
import type { Provider, Tokens } from "@neelsatyavolu/shared-ai-auth";

export type { Provider, Tokens };
export const PROVIDERS = {
  codex: { ...providers.codex, defaultModel: process.env.CODEX_MODEL ?? "gpt-6-astra" },
  grok: { ...providers.grok, defaultModel: process.env.GROK_MODEL ?? "grok-4.7" },
};

export function isProvider(value: string): value is Provider {
  return value === "codex" || value === "grok";
}
export { generatePkce };
export function buildAuthorizeUrl(provider: Provider, challenge: string, state: string): string {
  return authorizeUrl(provider, { challenge, state });
}
export function extractCodeAndState(input: string): { code: string | null; state: string | null } {
  const { code, state } = parseCallback(input);
  return { code, state };
}
export function exchangeCode(provider: Provider, code: string, verifier: string): Promise<Tokens> {
  return exchange(provider, code, verifier);
}
export function refreshTokens(provider: Provider, refreshToken: string): Promise<Tokens> {
  return refresh(provider, refreshToken);
}
