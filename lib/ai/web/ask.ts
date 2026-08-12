import "server-only";
import { PROVIDERS, type Provider, type Tokens } from "./providers";
import { getActiveSession } from "./session";

// One-shot (non-streaming) completion through the user's connected subscription.
// The tutor UI runs its own history-lookup loop client-side and just needs the
// final text, so we return a single string — matching the desktop ai.cjs bridge.

const TIMEOUT_MS = 90_000;
const USER_AGENT = "grok-cli/1.0";

const CODEX_RESPONSES_URL = "https://chatgpt.com/backend-api/codex/responses";
const GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions";

type Message = { role: "user" | "assistant"; content: string };

function normalizeMessages(messages: unknown): Message[] {
  return (Array.isArray(messages) ? messages : [])
    .filter((m): m is { role?: unknown; content: string } =>
      Boolean(m) && typeof (m as { content?: unknown }).content === "string",
    )
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    }));
}

// Collect text out of the ChatGPT backend "responses" SSE stream.
function parseCodexResponsesStream(text: string): string {
  let out = "";
  for (const block of String(text || "").split(/\n\n+/)) {
    for (const line of block.split(/\n/)) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      let event: {
        type?: string;
        delta?: unknown;
        text?: unknown;
        error?: { message?: string };
        response?: { error?: { message?: string } };
      };
      try {
        event = JSON.parse(data);
      } catch {
        continue;
      }
      if (typeof event.delta === "string") out += event.delta;
      if (event.type === "response.output_text.done" && typeof event.text === "string") {
        out = event.text;
      }
      const errorMessage = event.error?.message || event.response?.error?.message;
      if (errorMessage) throw new Error(errorMessage);
    }
  }
  return out;
}

async function askCodex(
  tokens: Tokens,
  system: string,
  messages: Message[],
  model: string,
): Promise<string> {
  const body = {
    model: model || PROVIDERS.codex.defaultModel,
    instructions: String(system || ""),
    input: messages.map((m) => ({
      role: m.role,
      content: [{ type: m.role === "assistant" ? "output_text" : "input_text", text: m.content }],
    })),
    reasoning: { effort: "low" },
    store: false,
    stream: true,
  };
  const headers: Record<string, string> = {
    Authorization: `Bearer ${tokens.accessToken}`,
    "Content-Type": "application/json",
    Accept: "text/event-stream, application/json",
    originator: "codex_cli_rs",
    "OpenAI-Beta": "responses=v1",
  };
  if (tokens.accountId) headers["chatgpt-account-id"] = tokens.accountId;

  const res = await fetch(CODEX_RESPONSES_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      msg = JSON.parse(text)?.error?.message || msg;
    } catch {
      /* keep status */
    }
    throw new Error(msg);
  }
  return parseCodexResponsesStream(text);
}

async function askGrok(
  tokens: Tokens,
  system: string,
  messages: Message[],
  model: string,
): Promise<string> {
  const chosen = model || PROVIDERS.grok.defaultModel;
  const body: Record<string, unknown> = {
    model: chosen,
    messages: system ? [{ role: "system", content: String(system) }, ...messages] : messages,
    temperature: 0.4,
  };
  if (chosen === "grok-4.6" || chosen === "grok-4.5" || chosen === "grok-4.3") body.reasoning = { effort: "high" };

  const res = await fetch(GROK_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let json: { error?: { message?: string }; detail?: string; choices?: { message?: { content?: string } }[] } = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) throw new Error(json?.error?.message || json?.detail || `HTTP ${res.status}`);
  return json?.choices?.[0]?.message?.content || "";
}

export async function runAsk(params: {
  provider: Provider;
  system?: string;
  messages?: unknown;
  model?: string;
}): Promise<string> {
  const tokens = await getActiveSession(params.provider);
  if (!tokens) {
    throw new Error(`Connect ${params.provider === "codex" ? "ChatGPT" : "Grok"} first.`);
  }
  const messages = normalizeMessages(params.messages);
  const system = String(params.system || "");
  const model = String(params.model || "");
  return params.provider === "codex"
    ? askCodex(tokens, system, messages, model)
    : askGrok(tokens, system, messages, model);
}
