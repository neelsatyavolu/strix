import { NextResponse } from "next/server";
import { buildAuthorizeUrl, generatePkce, isProvider } from "@/lib/ai/web/providers";
import { writePkce } from "@/lib/ai/web/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai/:provider/start — begin the OAuth flow; the client opens the
// returned authorizeUrl, then pastes back the callback link / code.
export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 404 });
  }
  const { verifier, challenge, state } = generatePkce();
  await writePkce(provider, { verifier, state });
  return NextResponse.json({ authorizeUrl: buildAuthorizeUrl(provider, challenge, state), state });
}
