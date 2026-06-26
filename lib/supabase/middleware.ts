import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

// Refreshes the Supabase auth session on each request. No-ops when Supabase
// isn't configured yet, so the app runs against the question API regardless.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const env = supabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching getUser() refreshes the token cookie when needed.
  await supabase.auth.getUser();
  return response;
}
