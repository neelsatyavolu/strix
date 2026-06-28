import { NextResponse } from "next/server";
import { hasSession } from "@/lib/ai/web/session";
import { runAsk } from "@/lib/ai/web/ask";
import { buildExplainPrompt, type ExplainQuestion } from "@/lib/ai/explain";
import type { Provider } from "@/lib/ai/web/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reasoning answers can run past the default serverless cap.
export const maxDuration = 120;

// POST /api/ai/explain — a personalized explanation of a missed question through
// the user's connected subscription. Body: { question, choice }.
export async function POST(req: Request) {
  let body: { question?: unknown; choice?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.question || typeof body.question !== "object") {
    return NextResponse.json({ ok: false, error: "Missing question." }, { status: 400 });
  }
  const choice = typeof body.choice === "string" ? body.choice : null;

  // Use whichever subscription this browser has connected (Codex preferred).
  const [codex, grok] = await Promise.all([hasSession("codex"), hasSession("grok")]);
  const provider: Provider | null = codex ? "codex" : grok ? "grok" : null;
  if (!provider) {
    return NextResponse.json(
      { ok: false, error: "Connect ChatGPT or Grok in Settings to get AI explanations." },
      { status: 400 },
    );
  }

  try {
    const { system, messages } = buildExplainPrompt(body.question as ExplainQuestion, choice);
    const text = await runAsk({ provider, system, messages });
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
