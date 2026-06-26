import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

// Privileged, service-role client for trusted server-side writes (bypasses RLS).
// Never import this into client code.
export function createAdminClient() {
  const { url } = requireSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (see SETUP.md).");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
