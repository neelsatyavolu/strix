import { NextResponse } from "next/server";
import { isProvider } from "@/lib/ai/web/providers";
import { clearPkce, clearSession } from "@/lib/ai/web/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/ai/:provider/logout — disconnect (drop the stored tokens).
export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider)) {
    return NextResponse.json({ ok: false, error: "Unknown provider." }, { status: 404 });
  }
  await clearSession(provider);
  await clearPkce(provider);
  return NextResponse.json({ ok: true });
}
