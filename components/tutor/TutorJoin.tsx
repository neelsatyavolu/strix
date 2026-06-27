"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getSessionProfile, signIn } from "@/lib/auth/actions";

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
    router.replace("/app");
  }, [token, router]);

  React.useEffect(() => {
    getSessionProfile().then((sp) => {
      if (sp?.user) join();
      else setPhase("signin");
    });
  }, [join]);

  const doSignIn = async () => {
    setError(""); setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Wrong email or password."); return; }
    const sp = await getSessionProfile();
    if (sp?.user) join();
    else setError("Signed in, but couldn't load your account.");
  };

  const card: React.CSSProperties = { background: "var(--paper)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 20 };

  if (phase === "loading" || phase === "joining") {
    return <Centered>{phase === "loading" ? "Loading…" : "Joining session…"}</Centered>;
  }
  if (phase === "error") {
    return <Centered><div style={{ textAlign: "center" }}><h2 style={{ font: "var(--role-title-md)" }}>Can&rsquo;t join</h2><p style={{ color: "var(--text-secondary)" }}>{error}</p></div></Centered>;
  }
  // signin
  return (
    <Centered>
      <div style={{ ...card, width: "min(380px, 92%)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, font: "var(--role-title-md)" }}>Join as tutor</h1>
          <p style={{ margin: "4px 0 0", font: "var(--role-body)", color: "var(--text-secondary)" }}>Sign in to connect with your student.</p>
        </div>
        {error && <div style={{ padding: "8px 10px", background: "#FDECEC", color: "var(--error)", borderRadius: 8, font: "var(--role-caption)" }}>{error}</div>}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => { if (e.key === "Enter") doSignIn(); }} style={inp} />
        <button onClick={doSignIn} disabled={busy} style={primaryBtn}>{busy ? "Signing in…" : "Sign in & join"}</button>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--surface-app)", padding: 24 }}>{children}</div>;
}

const inp: React.CSSProperties = { padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-2)", font: "var(--role-body)", background: "var(--paper)", color: "var(--text-primary)", outline: "none" };
const primaryBtn: React.CSSProperties = { padding: "10px 14px", borderRadius: "var(--radius-md)", border: 0, background: "var(--brand-blue)", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
