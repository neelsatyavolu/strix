import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Supabase-side facts and writes for Xanom linking. Supabase owns auth.users,
// so the Xanom sub lives in public.xanom_links (see 0015_xanom_links.sql).

export interface AuthUserFacts {
  id: string;
  email: string;
  hasPassword: boolean;
  // Strix creates password accounts with email_confirm: true and never mails
  // them, so email_confirmed_at proves nothing. Only a Google identity (Google
  // verified the address) counts as the app having verified the email.
  emailVerified: boolean;
  linkedSub: string | null;
}

type Admin = ReturnType<typeof createAdminClient>;

interface AuthUserRow {
  id: string;
  email: string | null;
  has_password: boolean;
  has_google: boolean;
}

async function linkedSubFor(admin: Admin, userId: string): Promise<string | null> {
  const { data, error } = await admin.from("xanom_links").select("xanom_sub").eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`xanom_links lookup failed: ${error.message}`);
  return data?.xanom_sub ?? null;
}

export async function authUserFacts(admin: Admin, by: { id?: string; email?: string }): Promise<AuthUserFacts | null> {
  const { data, error } = await admin.rpc("xanom_auth_user", { p_id: by.id ?? null, p_email: by.email ?? null });
  if (error) throw new Error(`auth user lookup failed: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) as AuthUserRow | undefined;
  if (!row?.id) return null;
  return {
    id: row.id,
    email: (row.email || "").toLowerCase(),
    hasPassword: row.has_password,
    emailVerified: row.has_google,
    linkedSub: await linkedSubFor(admin, row.id),
  };
}

export async function userIdForSub(admin: Admin, sub: string): Promise<string | null> {
  const { data, error } = await admin.from("xanom_links").select("user_id").eq("xanom_sub", sub).maybeSingle();
  if (error) throw new Error(`xanom_links lookup failed: ${error.message}`);
  return data?.user_id ?? null;
}

export async function attachSub(admin: Admin, userId: string, sub: string, email: string) {
  const { error } = await admin.from("xanom_links").insert({ user_id: userId, xanom_sub: sub, xanom_email: email });
  // 23505: someone raced us to the same sub or user; the unique keys hold.
  if (error && error.code !== "23505") throw new Error(`could not link: ${error.message}`);
  if (error) {
    const owner = await userIdForSub(admin, sub);
    if (owner !== userId) throw new Error("This Xanom account is already linked to another Strix account.");
  }
}

// Pre-hijacking guard (rule 3): drop the password and every session.
export async function revokePasswordAndSessions(admin: Admin, userId: string) {
  const { error } = await admin.rpc("xanom_revoke_password_and_sessions", { p_id: userId });
  if (error) throw new Error(`guard failed: ${error.message}`);
}

export async function createXanomUser(admin: Admin, email: string, name: string | null): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // Xanom verified it (id_token email_verified: true)
    user_metadata: name ? { full_name: name } : {},
  });
  if (error || !data?.user) throw new Error(error?.message || "Could not create account.");
  return data.user.id;
}

// Start a normal Supabase session (cookies) for a user we have decided to sign
// in: mint a magic-link token server-side and redeem it on the cookie client.
export async function startSupabaseSession(admin: Admin, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) throw new Error(error?.message || "Could not start a session.");
  const supabase = await createClient();
  const { error: otpErr } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (otpErr) throw new Error(otpErr.message);
}

export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
