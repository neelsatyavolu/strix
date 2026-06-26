// Centralized Supabase env access. Returns null when unset so the app can run
// (against the live question API) before credentials are configured.
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function supabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

export function requireSupabaseEnv() {
  const env = supabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see SETUP.md).",
    );
  }
  return env;
}
