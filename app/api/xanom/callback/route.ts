import { NextRequest, NextResponse } from "next/server";
import { xanomConfig, xanomJwks, FLOW_COOKIE } from "@/lib/xanom/config";
import { decideLink, openFlow, verifyIdToken } from "@/lib/xanom/core.mjs";
import {
  attachSub,
  authUserFacts,
  createXanomUser,
  currentUserId,
  revokePasswordAndSessions,
  startSupabaseSession,
  userIdForSub,
} from "@/lib/xanom/accounts";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectTo(req: NextRequest, returnTo: string, extra: Record<string, string> = {}) {
  const [path, hash] = returnTo.split("#");
  const url = new URL(path, req.nextUrl.origin);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  if (hash) url.hash = hash;
  const res = NextResponse.redirect(url);
  res.cookies.set(FLOW_COOKIE, "", { path: "/api/xanom", maxAge: 0 });
  return res;
}

async function exchangeCode(cfg: { issuer: string; clientId: string; clientSecret: string }, code: string, redirectUri: string, verifier: string) {
  const res = await fetch(new URL("/oauth/token", cfg.issuer), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token endpoint ${res.status}`);
  const body = (await res.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") throw new Error("no id_token");
  return body.id_token;
}

// GET /api/xanom/callback?code=...&state=...
export async function GET(req: NextRequest) {
  const cfg = xanomConfig();
  const params = req.nextUrl.searchParams;
  const flow = cfg ? await openFlow(req.cookies.get(FLOW_COOKIE)?.value, params.get("state"), cfg.clientSecret) : null;
  if (!cfg || !flow) return redirectTo(req, "/app", { xanom_error: "bad_state" });

  const oauthError = params.get("error");
  const code = params.get("code");
  if (oauthError || !code) {
    return redirectTo(req, flow.returnTo, { xanom_error: oauthError === "access_denied" ? "cancelled" : "failed" });
  }

  try {
    const idToken = await exchangeCode(cfg, code, `${req.nextUrl.origin}/api/xanom/callback`, flow.verifier);
    const claims = await verifyIdToken(idToken, {
      jwks: xanomJwks(cfg.issuer),
      issuer: cfg.issuer,
      clientId: cfg.clientId,
      nonce: flow.nonce,
    });

    const admin = createAdminClient();
    const linking = flow.intent !== "signin";
    const signedInId = linking ? await currentUserId() : null;
    // Link/convert must finish as the same Strix user who started it.
    if (linking && (!signedInId || signedInId !== flow.userId)) {
      return redirectTo(req, flow.returnTo, { xanom_error: "signed_out" });
    }
    const currentUser = signedInId ? await authUserFacts(admin, { id: signedInId }) : null;
    const linkedUserId = await userIdForSub(admin, claims.sub);
    const emailUser = await authUserFacts(admin, { email: claims.email });

    const decision = decideLink({
      intent: flow.intent,
      sub: claims.sub,
      email: claims.email,
      linkedUserId,
      currentUser,
      emailUser,
    });

    switch (decision.action) {
      case "error":
        return redirectTo(req, flow.returnTo, { xanom_error: decision.code });
      case "signin": {
        if (decision.userId !== signedInId) {
          const target = await authUserFacts(admin, { id: decision.userId });
          if (!target?.email) throw new Error("linked user has no email");
          await startSupabaseSession(admin, target.email);
        }
        break;
      }
      case "attach": {
        if (decision.guard) await revokePasswordAndSessions(admin, decision.userId);
        await attachSub(admin, decision.userId, claims.sub, claims.email);
        if (decision.signin) {
          const target = await authUserFacts(admin, { id: decision.userId });
          if (!target?.email) throw new Error("user has no email");
          await startSupabaseSession(admin, target.email);
        }
        break;
      }
      case "create": {
        const userId = await createXanomUser(admin, claims.email, claims.name);
        await attachSub(admin, userId, claims.sub, claims.email);
        await startSupabaseSession(admin, claims.email);
        break;
      }
    }
    return redirectTo(req, flow.returnTo, linking ? { xanom: "linked" } : {});
  } catch (e) {
    console.error("xanom callback failed:", e instanceof Error ? e.message : "unknown");
    return redirectTo(req, flow.returnTo, { xanom_error: "failed" });
  }
}
