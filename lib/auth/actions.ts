"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role?: "student" | "tutor";
  targetScore?: number | null;
  testDate?: string | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

// Create a confirmed account (no email round-trip) and establish a session.
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  const { email, password, fullName, role = "student", targetScore, testDate } = input;
  try {
    const admin = createAdminClient();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created?.user) {
      return { ok: false, error: createErr?.message || "Could not create account." };
    }

    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) return { ok: false, error: signInErr.message };

    // The auth trigger creates the profile row; enrich it with onboarding data.
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        role,
        target_score: targetScore ?? null,
        test_date: testDate ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", created.user.id);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sign up failed." };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sign in failed." };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Sign out failed." };
  }
}

// Update the signed-in user's target score. Pass null to clear it.
export async function updateTargetScore(score: number | null): Promise<AuthResult> {
  try {
    if (score !== null && (!Number.isInteger(score) || score < 400 || score > 1600)) {
      return { ok: false, error: "Target score must be a whole number between 400 and 1600." };
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const { error } = await supabase
      .from("profiles")
      .update({ target_score: score, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save target score." };
  }
}

export interface SessionProfile {
  user: { id: string; email: string | null };
  profile: {
    full_name: string | null;
    email: string | null;
    role: string;
    target_score: number | null;
    test_date: string | null;
    avatar_url: string | null;
    defaults: Record<string, unknown>;
  } | null;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role, target_score, test_date, avatar_url, defaults")
      .eq("id", user.id)
      .single();
    return { user: { id: user.id, email: user.email ?? null }, profile: profile ?? null };
  } catch {
    return null;
  }
}
