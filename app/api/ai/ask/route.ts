import { NextResponse } from "next/server";
import { isProvider } from "@/lib/ai/web/providers";
import { runAsk } from "@/lib/ai/web/ask";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reasoning answers can run past the default serverless cap.
export const maxDuration = 120;

// POST /api/ai/ask — one-shot completion through the connected subscription.
// Returns { ok, text } / { ok:false, error } to match the desktop ai bridge.
export async function POST(req: Request) {
  let body: { provider?: unknown; system?: unknown; messages?: unknown; model?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const provider = String(body.provider || "");
  if (!isProvider(provider)) {
    return NextResponse.json({ ok: false, error: "Unknown provider." }, { status: 400 });
  }

  try {
    const text = await runAsk({
      provider,
      system: typeof body.system === "string" ? body.system : undefined,
      messages: body.messages,
      model: typeof body.model === "string" ? body.model : undefined,
    });
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
