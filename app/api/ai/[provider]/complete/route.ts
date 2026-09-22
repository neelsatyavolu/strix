import { NextResponse } from "next/server";
import { exchangeCode, extractCodeAndState, isProvider } from "@/lib/ai/web/providers";
import { clearPkce, readPkce, writeSession } from "@/lib/ai/web/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai/:provider/complete — finish OAuth with the callback link (ChatGPT)
// or authorization code (Grok) the user pasted, exchanging it for tokens.
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) {
    return NextResponse.json({ ok: false, error: "Unknown provider." }, { status: 404 });
  }

  let body: { callback?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const callback = typeof body.callback === "string" ? body.callback : "";
  if (!callback) {
    return NextResponse.json({ ok: false, error: "Paste the callback link or code." }, { status: 400 });
  }

  const { code, state } = extractCodeAndState(callback);
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Could not find an authorization code in what you pasted." },
      { status: 400 },
    );
  }

  const pkce = await readPkce(provider);
  if (!pkce) {
    return NextResponse.json(
      { ok: false, error: "This sign-in expired. Click Connect again." },
      { status: 400 },
    );
  }
  if ((provider === "codex" && pkce.state !== state) || (state && pkce.state !== state)) {
    return NextResponse.json({ ok: false, error: "Sign-in state mismatch. Try again." }, { status: 400 });
  }

  try {
    const tokens = await exchangeCode(provider, code, pkce.verifier);
    await writeSession(provider, tokens);
    await clearPkce(provider);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
