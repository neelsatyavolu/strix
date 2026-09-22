import { NextResponse } from "next/server";
import { aiModels } from "@/lib/ai/web/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await aiModels());
}
