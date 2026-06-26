import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OAuth callback — exchanges the Google auth code for a session (the PKCE
// verifier travels in a cookie set by the browser client), then redirects in.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") || "/app";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/app?auth_error=${encodeURIComponent(error.message)}`, req.nextUrl.origin));
    }
  }
  return NextResponse.redirect(new URL(next, req.nextUrl.origin));
}
