import { NextRequest, NextResponse } from "next/server";
import { xanomConfig, FLOW_COOKIE } from "@/lib/xanom/config";
import { authorizeUrl, newFlow, normalizeIntent, safeReturnPath, sealFlow, signConvertTicket, FLOW_TTL_SECONDS } from "@/lib/xanom/core.mjs";
import { authUserFacts, currentUserId } from "@/lib/xanom/accounts";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(req: NextRequest, returnTo: string, code: string) {
  const [path, hash] = returnTo.split("#");
  const url = new URL(path, req.nextUrl.origin);
  url.searchParams.set("xanom_error", code);
  if (hash) url.hash = hash;
  return NextResponse.redirect(url);
}

// GET /api/xanom/start?intent=signin|link|convert&return=<path>
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const intent = normalizeIntent(params.get("intent"));
  const returnTo = safeReturnPath(params.get("return"), intent === "signin" ? "/app" : "/app#/settings");
  const cfg = xanomConfig();
  if (!cfg) return fail(req, returnTo, "unavailable");
  if (params.get("platform") && params.get("platform") !== "web") return fail(req, returnTo, "unsupported_platform");

  try {
    let userId: string | null = null;
    let convert: string | undefined;
    let loginHint: string | undefined;

    if (intent !== "signin") {
      userId = await currentUserId();
      if (!userId) return fail(req, returnTo, "signed_out");
    }
    if (intent === "convert" && userId) {
      const admin = createAdminClient();
      const facts = await authUserFacts(admin, { id: userId });
      if (!facts?.email) return fail(req, returnTo, "no_email");
      if (facts.linkedSub) return fail(req, returnTo, "already_linked");
      const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      convert = await signConvertTicket({
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        issuer: cfg.issuer,
        email: facts.email,
        name: profile?.full_name || "",
        emailVerified: facts.emailVerified,
      });
      loginHint = facts.email;
    }

    const flow = newFlow({ intent, returnTo, userId });
    const location = await authorizeUrl({
      issuer: cfg.issuer,
      clientId: cfg.clientId,
      redirectUri: `${req.nextUrl.origin}/api/xanom/callback`,
      flow,
      convert,
      loginHint,
    });
    const res = NextResponse.redirect(location);
    res.cookies.set(FLOW_COOKIE, await sealFlow(flow, cfg.clientSecret), {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/xanom",
      maxAge: FLOW_TTL_SECONDS,
    });
    return res;
  } catch (e) {
    console.error("xanom start failed:", e instanceof Error ? e.message : "unknown");
    return fail(req, returnTo, "start_failed");
  }
}
