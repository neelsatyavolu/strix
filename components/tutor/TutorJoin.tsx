"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionProfile, signIn } from "@/lib/auth/actions";
import s from "./TutorJoin.module.css";

type Phase = "loading" | "signin" | "joining" | "error";

// Accepting a tutor invite link: sign in if needed, register the tutor↔student
// membership, then drop into the real app. Watching happens there (Tutor view),
// not on this page — so the tutor lands on Home, not a "waiting" screen.
export default function TutorJoin({ token }: { token: string }) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const join = React.useCallback(async () => {
    setPhase("joining");
    const res = await fetch("/api/tutor/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((r) => r.json()).catch(() => null);
    if (!res?.success) { setError(res?.error || "Could not join."); setPhase("error"); return; }
    // Land in Tutor view watching the student you just accepted.
    const sid = res.data?.studentId;
    router.replace(sid ? `/app?watch=${encodeURIComponent(sid)}` : "/app");
  }, [token, router]);

  React.useEffect(() => {
    getSessionProfile().then((sp) => {
      if (sp?.user) join();
      else setPhase("signin");
    });
  }, [join]);

  const doSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    setError(""); setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Wrong email or password."); return; }
    const sp = await getSessionProfile();
    if (sp?.user) join();
    else setError("Signed in, but couldn't load your account.");
  };

  if (phase === "loading" || phase === "joining") {
    return (
      <Shell>
        <div className={s.status} role="status" aria-live="polite">
          <span className={s.spinner} aria-hidden="true" />
          <p className={s.statusText}>{phase === "loading" ? "Checking your invite…" : "Connecting you to your student…"}</p>
        </div>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <div className={s.head}>
          <h1 className={s.title}>Can&rsquo;t join</h1>
          <p className={s.sub}>{error}</p>
        </div>
        <Link href="/app" className={s.secondaryBtn}>Open Strix</Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={s.head}>
        <h1 className={s.title}>Join as a tutor</h1>
        <p className={s.sub}>Sign in to connect with your student. You&rsquo;ll follow their practice and can chat with them.</p>
      </div>
      <form className={s.form} onSubmit={doSignIn} noValidate>
        {error && <div className={s.alert} role="alert">{error}</div>}
        <label className={s.field}>
          <span className={s.label}>Email</span>
          <input
            className={s.input}
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className={s.field}>
          <span className={s.label}>Password</span>
          <input
            className={s.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy} className={s.primaryBtn}>
          {busy ? "Signing in…" : "Sign in & join"}
        </button>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.page}>
      <main className={s.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/app-icon.svg" width={48} height={48} alt="Strix" className={s.icon} />
        {children}
      </main>
    </div>
  );
}
