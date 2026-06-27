import { NextResponse } from "next/server";
import { hasSession } from "@/lib/ai/web/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai/status — which providers this browser is connected to.
export async function GET() {
  const [codex, grok] = await Promise.all([hasSession("codex"), hasSession("grok")]);
  return NextResponse.json({ codex, grok });
}
