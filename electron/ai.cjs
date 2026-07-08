"use strict";

// Self-contained "connect your own subscription" AI module for Strix.
// Ports the ChatGPT (Codex CLI) + Grok (Grok CLI) OAuth + API logic.
// The OAuth client_ids / URLs / scopes below impersonate the official CLI
// clients and MUST be kept exactly as-is.

const http = require("node:http");
const { createHash, randomBytes } = require("node:crypto");
const { execFile } = require("node:child_process");

// --- OAuth + endpoint constants (verbatim from the Codex/Grok CLI clients) ---
const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const CODEX_REDIRECT_URI = "http://localhost:1455/auth/callback";
const CODEX_AUTHORIZE_URL = "https://auth.openai.com/oauth/authorize";
const CODEX_TOKEN_URL = "https://auth.openai.com/oauth/token";
const CODEX_BACKEND_RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";
const CODEX_SCOPE = "openid profile email offline_access";
const GROK_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
const GROK_REDIRECT_URI = "http://127.0.0.1:56121/callback";
const GROK_AUTHORIZE_URL = "https://auth.x.ai/oauth2/authorize";
const GROK_TOKEN_URL = "https://auth.x.ai/oauth2/token";
const GROK_CHAT_COMPLETIONS_URL = "https://api.x.ai/v1/chat/completions";
const GROK_SCOPE = "openid profile email offline_access grok-cli:access api:access";

const DEFAULT_CODEX_MODEL = "gpt-5.5";
const DEFAULT_GROK_MODEL = "grok-4.5";

const KEYCHAIN_SERVICE = "Strix";
const KEY_PROVIDERS = new Set(["codex", "grok"]);
const USER_AGENT = "Strix/1.0";
const AI_PROVIDER_TIMEOUT_MS = 90000;
const TOKEN_TIMEOUT_MS = 20000;

// In-flight OAuth attempts, keyed by provider. Holds the PKCE verifier so a
// manually pasted authorization code can be exchanged, plus a `cancel` that
// gracefully resolves the loopback wait once the flow completes another way.
const pendingOAuth = new Map(); // provider -> { verifier, state, cancel }

function assertProvider(provider) {
  if (!KEY_PROVIDERS.has(provider)) throw new Error("Unsupported AI provider");
}

// --- macOS Keychain helpers (via the `security` CLI). No-op off darwin. ---
function runSecurity(args) {
  return new Promise((resolve, reject) => {
    execFile("/usr/bin/security", args, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) { error.stderr = stderr; reject(error); return; }
      resolve(stdout);
    });
  });
}

async function getSecret(provider) {
  assertProvider(provider);
  if (process.platform !== "darwin") return "";
  try {
    return (await runSecurity(["find-generic-password", "-s", KEYCHAIN_SERVICE, "-a", provider, "-w"])).trim();
  } catch (error) {
    if (error.code === 44) return ""; // 44 == item not found
    throw error;
  }
}

async function setSecret(provider, value) {
  assertProvider(provider);
  if (process.platform !== "darwin") return false;
  const password = String(value || "").trim();
  if (!password) return deleteSecret(provider);
  await runSecurity(["add-generic-password", "-U", "-s", KEYCHAIN_SERVICE, "-a", provider, "-w", password]);
  return true;
}

async function deleteSecret(provider) {
  assertProvider(provider);
  if (process.platform !== "darwin") return false;
  try {
    await runSecurity(["delete-generic-password", "-s", KEYCHAIN_SERVICE, "-a", provider]);
  } catch (error) {
    if (error.code !== 44) throw error;
  }
  return true;
}

// Token bundles are stored as JSON in the keychain.
async function readSession(provider) {
  const raw = await getSecret(provider);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.accessToken === "string" && typeof parsed.refreshToken === "string") return parsed;
  } catch {}
  return null;
}

async function writeSession(provider, tokens) {
  await setSecret(provider, JSON.stringify(tokens));
  return tokens;
}

// --- PKCE + authorize URLs ---
function base64url(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generatePkce() {
  const verifier = base64url(randomBytes(64));
  return {
    verifier,
    challenge: base64url(createHash("sha256").update(verifier).digest()),
    state: base64url(randomBytes(32)),
  };
}

function buildCodexAuthorizeUrl(challenge, state) {
  const params = new URLSearchParams({
    response_type: "code", client_id: CODEX_CLIENT_ID, redirect_uri: CODEX_REDIRECT_URI,
    scope: CODEX_SCOPE, code_challenge: challenge, code_challenge_method: "S256", state,
    id_token_add_organizations: "true", codex_cli_simplified_flow: "true", originator: "codex_cli_rs",
  });
  return `${CODEX_AUTHORIZE_URL}?${params.toString()}`;
}

function buildGrokAuthorizeUrl(challenge, state) {
  const params = new URLSearchParams({
    response_type: "code", client_id: GROK_CLIENT_ID, redirect_uri: GROK_REDIRECT_URI,
    scope: GROK_SCOPE, code_challenge: challenge, code_challenge_method: "S256", state,
  });
  return `${GROK_AUTHORIZE_URL}?${params.toString()}`;
}

// Pull the ChatGPT account id out of the OpenAI id_token JWT.
function decodeCodexAccountId(idToken) {
  if (!idToken) return "";
  const parts = String(idToken).split(".");
  if (parts.length < 2) return "";
  try {
    const payload = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const claims = JSON.parse(payload);
    const orgs = claims?.["https://api.openai.com/auth"]?.organizations;
    if (Array.isArray(orgs) && orgs.length) {
      const account = orgs.find((org) => org?.is_default) || orgs[0];
      return String(account?.id || "");
    }
    return String(claims?.sub || "");
  } catch {
    return "";
  }
}

function tokenExpiry(expiresIn, skewSeconds = 90) {
  return Date.now() + Math.max(30, Number(expiresIn || 3600) - skewSeconds) * 1000;
}

// --- Token exchange + refresh (global fetch) ---
async function postForm(url, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: params.toString(),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`Invalid JSON from ${new URL(url).hostname}`); }
  if (!res.ok) throw new Error(json?.error_description || json?.error || `HTTP ${res.status}`);
  return json;
}

async function exchangeCodexCode(code, verifier) {
  const json = await postForm(CODEX_TOKEN_URL, new URLSearchParams({
    grant_type: "authorization_code", code, redirect_uri: CODEX_REDIRECT_URI,
    client_id: CODEX_CLIENT_ID, code_verifier: verifier,
  }));
  return {
    accessToken: json.access_token, refreshToken: json.refresh_token, idToken: json.id_token,
    accountId: decodeCodexAccountId(json.id_token), expiresAt: tokenExpiry(json.expires_in, 60),
  };
}

async function refreshCodexTokens(refreshToken, accountId = "") {
  const json = await postForm(CODEX_TOKEN_URL, new URLSearchParams({
    grant_type: "refresh_token", refresh_token: refreshToken, client_id: CODEX_CLIENT_ID, scope: CODEX_SCOPE,
  }));
  return {
    accessToken: json.access_token, refreshToken: json.refresh_token || refreshToken, idToken: json.id_token,
    accountId: decodeCodexAccountId(json.id_token) || accountId, expiresAt: tokenExpiry(json.expires_in, 60),
  };
}

async function exchangeGrokCode(code, verifier) {
  const json = await postForm(GROK_TOKEN_URL, new URLSearchParams({
    grant_type: "authorization_code", code, redirect_uri: GROK_REDIRECT_URI,
    client_id: GROK_CLIENT_ID, code_verifier: verifier,
  }));
  return { accessToken: json.access_token, refreshToken: json.refresh_token, expiresAt: tokenExpiry(json.expires_in, 120) };
}

async function refreshGrokTokens(refreshToken) {
  const json = await postForm(GROK_TOKEN_URL, new URLSearchParams({
    grant_type: "refresh_token", refresh_token: refreshToken, client_id: GROK_CLIENT_ID, scope: GROK_SCOPE,
  }));
  return { accessToken: json.access_token, refreshToken: json.refresh_token || refreshToken, expiresAt: tokenExpiry(json.expires_in, 120) };
}

// --- Loopback callback server + full OAuth flow ---
function waitForOAuthCallback(redirectUri, expectedState, registerCancel) {
  return new Promise((resolve, reject) => {
    const redirect = new URL(redirectUri);
    let settled = false;
    const finish = (error, code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close(() => {});
      if (error) reject(error);
      else resolve(code);
    };
    // Let the manual-paste path stop waiting and free the port once the code
    // has been collected another way. Resolving with no code is the signal.
    if (typeof registerCancel === "function") registerCancel(() => finish(null, null));
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", redirect.origin);
      if (url.pathname !== redirect.pathname) { res.writeHead(404); res.end("Not found"); return; }
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (error) {
        res.end("<h1>Strix sign-in failed</h1><p>You can close this tab.</p>");
        finish(new Error(`OAuth failed: ${error}`));
        return;
      }
      if (!code || state !== expectedState) {
        res.end("<h1>Strix sign-in failed</h1><p>State mismatch. You can close this tab.</p>");
        finish(new Error("OAuth state mismatch."));
        return;
      }
      res.end("<h1>Strix sign-in complete</h1><p>You can close this tab and return to Strix.</p>");
      finish(null, code);
    });
    const timer = setTimeout(() => finish(new Error("OAuth sign-in timed out.")), 5 * 60 * 1000);
    server.once("error", finish);
    server.listen(Number(redirect.port), redirect.hostname);
  });
}

// Exchange an authorization code for tokens and persist the session.
async function exchangeAndStore(provider, code, verifier) {
  const tokens = provider === "codex"
    ? await exchangeCodexCode(code, verifier)
    : await exchangeGrokCode(code, verifier);
  return writeSession(provider, tokens);
}

// Run the loopback OAuth flow for a provider, then store the resulting tokens.
// The browser may either redirect back to the loopback (handled here) or — as
// x.ai's Grok flow does — display a code for the user to paste, which arrives
// via completeAiOAuthWithCode and cancels this wait.
async function startAiOAuth(provider, shell) {
  assertProvider(provider);
  const pkce = generatePkce();
  const redirectUri = provider === "codex" ? CODEX_REDIRECT_URI : GROK_REDIRECT_URI;
  const authorizeUrl = provider === "codex"
    ? buildCodexAuthorizeUrl(pkce.challenge, pkce.state)
    : buildGrokAuthorizeUrl(pkce.challenge, pkce.state);
  const pending = { verifier: pkce.verifier, state: pkce.state, cancel: null };
  pendingOAuth.set(provider, pending);
  const codePromise = waitForOAuthCallback(redirectUri, pkce.state, (cancel) => { pending.cancel = cancel; });
  await shell.openExternal(authorizeUrl);
  const code = await codePromise;
  if (!code) {
    // The wait was cancelled. If a pasted code already completed the flow, the
    // session exists; otherwise the user cancelled or it timed out.
    if (pendingOAuth.get(provider) === pending) pendingOAuth.delete(provider);
    const existing = await readSession(provider);
    if (existing) return existing;
    throw new Error("Connection was cancelled.");
  }
  pendingOAuth.delete(provider);
  return exchangeAndStore(provider, code, pkce.verifier);
}

// Pull the authorization code out of whatever the user pasted: a bare code, or
// the full redirect URL x.ai shows. Validates state when a URL carries it.
function extractAuthCode(value, expectedState) {
  const raw = String(value || "").trim();
  if (!raw) throw new Error("Paste the authorization code from your browser.");
  if (/^https?:\/\//i.test(raw) || /[?&]code=/.test(raw)) {
    try {
      const url = new URL(raw.includes("://") ? raw : `http://x/?${raw.replace(/^[?]/, "")}`);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (code) {
        if (state && expectedState && state !== expectedState) {
          throw new Error("That code is from a different sign-in. Connect again, then paste the new code.");
        }
        return code;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("different sign-in")) throw error;
      // Not a parseable URL — fall through and treat it as a bare code.
    }
  }
  return raw;
}

// Complete a connection with a code the user copied from the browser.
async function completeAiOAuthWithCode(provider, pastedValue) {
  assertProvider(provider);
  const pending = pendingOAuth.get(provider);
  if (!pending) {
    const existing = await readSession(provider);
    if (existing) return existing; // loopback already finished it
    throw new Error("Start the connection again, then paste the code.");
  }
  const code = extractAuthCode(pastedValue, pending.state);
  const stored = await exchangeAndStore(provider, code, pending.verifier);
  pendingOAuth.delete(provider);
  if (pending.cancel) pending.cancel(); // release the still-waiting loopback
  return stored;
}

// Abandon an in-flight connection (user dismissed the paste field).
function cancelAiOAuth(provider) {
  const pending = pendingOAuth.get(String(provider || "").toLowerCase());
  if (!pending) return;
  pendingOAuth.delete(String(provider || "").toLowerCase());
  if (pending.cancel) pending.cancel();
}

// Return a valid (refreshed-if-needed) session, or null.
async function getActiveSession(provider) {
  const tokens = await readSession(provider);
  if (!tokens) return null;
  if (Number(tokens.expiresAt || 0) > Date.now() + 30_000) return tokens;
  try {
    const refreshed = provider === "codex"
      ? await refreshCodexTokens(tokens.refreshToken, tokens.accountId)
      : await refreshGrokTokens(tokens.refreshToken);
    return writeSession(provider, refreshed);
  } catch (error) {
    console.error(`[${provider}-oauth] token refresh failed:`, error);
    await deleteSecret(provider);
    return null;
  }
}

// --- Provider API calls (generic: system prompt + [{role, content}] + model) ---
function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m && typeof m.content === "string")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
}

// Collect the text out of the ChatGPT backend "responses" SSE stream.
function parseCodexResponsesStream(text) {
  let outputText = "";
  for (const block of String(text || "").split(/\n\n+/)) {
    for (const line of block.split(/\n/)) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      let event;
      try { event = JSON.parse(data); } catch { continue; }
      if (typeof event.delta === "string") outputText += event.delta;
      if (event.type === "response.output_text.done" && typeof event.text === "string") outputText = event.text;
      const errorMessage = event.error?.message || event.response?.error?.message;
      if (errorMessage) throw new Error(errorMessage);
    }
  }
  return outputText;
}

async function askCodex(tokens, system, messages, model) {
  const body = {
    model: model || DEFAULT_CODEX_MODEL,
    instructions: String(system || ""),
    input: normalizeMessages(messages).map((m) => ({
      role: m.role,
      content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
    })),
    reasoning: { effort: "low" },
    store: false,
    stream: true,
  };
  const headers = {
    Authorization: `Bearer ${tokens.accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream, application/json",
    originator: "codex_cli_rs",
    "OpenAI-Beta": "responses=v1",
  };
  if (tokens.accountId) headers["chatgpt-account-id"] = tokens.accountId;
  const res = await fetch(CODEX_BACKEND_RESPONSES_URL, {
    method: "POST", headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text)?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  return parseCodexResponsesStream(text);
}

async function askGrok(tokens, system, messages, model) {
  const chosen = model || DEFAULT_GROK_MODEL;
  const chat = normalizeMessages(messages);
  const body = {
    model: chosen,
    messages: system ? [{ role: "system", content: String(system) }, ...chat] : chat,
    temperature: 0.4,
  };
  if (chosen === "grok-4.5" || chosen === "grok-4.3") body.reasoning = { effort: "high" };
  const res = await fetch(GROK_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json", Accept: "application/json", "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(AI_PROVIDER_TIMEOUT_MS),
  });
  const text = await res.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch {}
  if (!res.ok) throw new Error(json?.error?.message || json?.detail || `HTTP ${res.status}`);
  return json?.choices?.[0]?.message?.content || "";
}

async function askAi({ provider, system, messages, model }) {
  const target = String(provider || "").toLowerCase();
  assertProvider(target);
  const tokens = await getActiveSession(target);
  if (!tokens) throw new Error(`Connect ${target === "codex" ? "ChatGPT (Codex)" : "Grok"} first.`);
  return target === "codex"
    ? askCodex(tokens, system, messages, model)
    : askGrok(tokens, system, messages, model);
}

// --- IPC registration: the single public export ---
function registerAiIpc(ipcMain, shell) {
  // Whether a stored token exists for each provider (presence only, no refresh).
  ipcMain.handle("ai:status", async () => {
    const [codex, grok] = await Promise.all([readSession("codex"), readSession("grok")]);
    return { codex: Boolean(codex), grok: Boolean(grok) };
  });

  // Run the OAuth loopback flow and persist the token.
  ipcMain.handle("ai:connect", async (_event, provider) => {
    try {
      await startAiOAuth(String(provider || "").toLowerCase(), shell);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  });

  // Finish a connection with a code the user copied from the browser.
  ipcMain.handle("ai:submitCode", async (_event, payload = {}) => {
    try {
      await completeAiOAuthWithCode(String(payload?.provider || "").toLowerCase(), payload?.code);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  });

  // Abandon an in-flight connection attempt.
  ipcMain.handle("ai:cancelConnect", async (_event, provider) => {
    cancelAiOAuth(provider);
    return { ok: true };
  });

  // Remove the stored token for a provider.
  ipcMain.handle("ai:disconnect", async (_event, provider) => {
    try {
      await deleteSecret(String(provider || "").toLowerCase());
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  });

  // One-shot (non-streaming) completion through the connected subscription.
  ipcMain.handle("ai:ask", async (_event, payload = {}) => {
    try {
      return { ok: true, text: await askAi(payload || {}) };
    } catch (error) {
      return { ok: false, error: error?.message || String(error) };
    }
  });
}

module.exports = { registerAiIpc };
