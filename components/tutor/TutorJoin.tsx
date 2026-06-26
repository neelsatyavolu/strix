"use client";

import React from "react";
import { getSessionProfile, signIn } from "@/lib/auth/actions";
import { openTutorChannel, loadMessages, saveMessage } from "@/lib/tutor/realtime";

type Phase = "loading" | "signin" | "joining" | "watching" | "error";
interface Msg { id: string; sender_id: string; role: string; body: string; created_at?: string }
interface LiveQ {
  index: number; total: number; section: string; domainLabel?: string;
  stemHtml?: string; stimulusHtml?: string;
  choices?: { letter: string; html: string }[]; selected?: string | null;
}

export default function TutorJoin({ token }: { token: string }) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [error, setError] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [userId, setUserId] = React.useState<string>("");
  const [studentId, setStudentId] = React.useState<string>("");
  const [studentName, setStudentName] = React.useState("your student");
  const [live, setLive] = React.useState<LiveQ | null>(null);
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [draft, setDraft] = React.useState("");
  const chanRef = React.useRef<ReturnType<typeof openTutorChannel> | null>(null);
  const streamRef = React.useRef<HTMLDivElement | null>(null);

  const join = React.useCallback(async (uid: string) => {
    setPhase("joining");
    const res = await fetch("/api/tutor/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((r) => r.json()).catch(() => null);
    if (!res?.success) { setError(res?.error || "Could not join."); setPhase("error"); return; }
    setStudentId(res.data.studentId);
    setStudentName(res.data.studentName);
    setMessages(await loadMessages(res.data.studentId));
    chanRef.current = openTutorChannel({
      studentId: res.data.studentId,
      userId: uid,
      role: "tutor",
      onSession: (s: LiveQ) => setLive(s),
      onChat: (m: Msg) => setMessages((prev) => [...prev, m]),
    });
    setPhase("watching");
  }, [token]);

  React.useEffect(() => {
    getSessionProfile().then((sp) => {
      if (sp?.user) { setUserId(sp.user.id); join(sp.user.id); }
      else setPhase("signin");
    });
    return () => { chanRef.current?.close(); };
  }, [join]);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  const doSignIn = async () => {
    setError(""); setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) { setError(res.error || "Wrong email or password."); return; }
    const sp = await getSessionProfile();
    if (sp?.user) { setUserId(sp.user.id); join(sp.user.id); }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, sender_id: userId, role: "tutor", body };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await saveMessage({ studentId, senderId: userId, role: "tutor", body });
    chanRef.current?.sendChat(saved || optimistic);
  };

  const card: React.CSSProperties = { background: "var(--paper)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", padding: 20 };

  if (phase === "loading" || phase === "joining") {
    return <Centered>{phase === "loading" ? "Loading…" : "Joining session…"}</Centered>;
  }
  if (phase === "error") {
    return <Centered><div style={{ textAlign: "center" }}><h2 style={{ font: "var(--role-title-md)" }}>Can&rsquo;t join</h2><p style={{ color: "var(--text-secondary)" }}>{error}</p></div></Centered>;
  }
  if (phase === "signin") {
    return (
      <Centered>
        <div style={{ ...card, width: "min(380px, 92%)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h1 style={{ margin: 0, font: "var(--role-title-md)" }}>Join as tutor</h1>
            <p style={{ margin: "4px 0 0", font: "var(--role-body)", color: "var(--text-secondary)" }}>Sign in to watch and chat with your student.</p>
          </div>
          {error && <div style={{ padding: "8px 10px", background: "#FDECEC", color: "var(--error)", borderRadius: 8, font: "var(--role-caption)" }}>{error}</div>}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={inp} />
          <button onClick={doSignIn} disabled={busy} style={primaryBtn}>{busy ? "Signing in…" : "Sign in & join"}</button>
        </div>
      </Centered>
    );
  }

  // watching
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 340px", background: "var(--surface-app)" }}>
      <div style={{ overflow: "auto", padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
          <span style={{ font: "var(--role-label)", color: "var(--text-secondary)" }}>Watching {studentName}</span>
        </div>
        {!live ? (
          <div style={{ ...card, color: "var(--text-secondary)" }}>Waiting for {studentName} to start a question…</div>
        ) : (
          <div style={{ ...card }}>
            <div style={{ font: "var(--role-caption)", color: "var(--text-tertiary)", marginBottom: 8 }}>
              Question {live.index + 1} of {live.total} · {live.domainLabel || (live.section === "math" ? "Math" : "Reading & Writing")}
            </div>
            {live.stimulusHtml && <div className="cb-passage" style={{ marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: live.stimulusHtml }} />}
            {live.stemHtml && <div className="cb-stem" dangerouslySetInnerHTML={{ __html: live.stemHtml }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {(live.choices || []).map((c) => (
                <div key={c.letter} style={{
                  display: "flex", gap: 10, padding: "10px 12px", borderRadius: "var(--radius-md)",
                  border: `1px solid ${live.selected === c.letter ? "var(--brand-blue)" : "var(--border-2)"}`,
                  background: live.selected === c.letter ? "var(--brand-blue-soft)" : "transparent",
                }}>
                  <span style={{ fontWeight: 700 }}>{c.letter}</span>
                  <span className="cb-choice" dangerouslySetInnerHTML={{ __html: c.html }} />
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14, font: "var(--role-caption)", color: "var(--text-tertiary)" }}>
              You can guide {studentName.split(" ")[0]} but can&rsquo;t answer for them.
            </p>
          </div>
        )}
      </div>

      <div style={{ borderLeft: "1px solid var(--border-1)", background: "var(--surface-sidebar)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-1)", font: "var(--role-label)", fontWeight: 600 }}>Chat</div>
        <div ref={streamRef} style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", padding: "8px 11px", borderRadius: 12, background: mine ? "var(--brand-blue)" : "var(--sunken)", color: mine ? "#fff" : "var(--text-primary)", font: "var(--role-body)" }}>
                {m.body}
              </div>
            );
          })}
        </div>
        <div style={{ padding: 10, borderTop: "1px solid var(--border-1)", display: "flex", gap: 8 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={`Message ${studentName.split(" ")[0]}`} style={{ ...inp, flex: 1 }} />
          <button onClick={send} style={primaryBtn}>Send</button>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100%", display: "grid", placeItems: "center", background: "var(--surface-app)", padding: 24 }}>{children}</div>;
}

const inp: React.CSSProperties = { padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-2)", font: "var(--role-body)", background: "var(--paper)", color: "var(--text-primary)", outline: "none" };
const primaryBtn: React.CSSProperties = { padding: "10px 14px", borderRadius: "var(--radius-md)", border: 0, background: "var(--brand-blue)", color: "#fff", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
