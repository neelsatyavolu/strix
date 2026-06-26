'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';

// TutorInvite — generate a real invite link a tutor can open in their browser.

function TutorInvite({ go }) {
  const { Card, Button, Input, Badge, Toggle, Avatar } = SixteenNS;
  const [token, setToken] = React.useState(null);
  const [copied, setCopied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [canChat, setCanChat] = React.useState(true);
  const [canSeeStats, setCanSeeStats] = React.useState(true);
  const [tutors, setTutors] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/tutor/invite').then((r) => r.json()).then((j) => {
      if (j?.success) {
        if (j.data.link) setToken(j.data.link.token);
        setTutors(j.data.tutors || []);
      }
    }).catch(() => {});
  }, []);

  // Prefer the public site URL so links open for remote tutors (the desktop app
  // runs on localhost, but invites must point at the hosted Vercel server).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const link = token ? `${origin}/join/${token}` : '';

  const generate = async () => {
    setBusy(true);
    const res = await fetch('/api/tutor/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canWatch: true, canChat }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    if (res?.success) setToken(res.data.token);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 760 }}>
      <button onClick={() => go('dashboard')} style={{ font: 'var(--role-label)', color: 'var(--text-secondary)', background: 'transparent', border: 0, cursor: 'pointer', marginBottom: 6 }}>← Home</button>
      <h1 style={{ margin: '0 0 4px', font: 'var(--role-title-lg)' }}>Invite a tutor</h1>
      <p style={{ margin: '0 0 24px', font: 'var(--role-body-lg)', color: 'var(--text-secondary)' }}>
        Anyone with this link can watch your practice and chat with you. They can never answer for you.
      </p>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>Share link</span>
        {link ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Input value={link} readOnly variant="sunken" />
            <Button variant={copied ? 'secondary' : 'primary'} onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <Button variant="primary" loading={busy} disabled={busy} onClick={generate}>Generate invite link</Button>
          </div>
        )}
      </Card>

      <Card padding="lg" style={{ marginBottom: 16 }}>
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>What they can do</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          <Toggle checked={true} label="See the question you're on" description="Always on — this is the point of tutor mode." disabled />
          <Toggle checked={canChat} onChange={setCanChat} label="Chat with you" description="Send messages while you practice." />
          <Toggle checked={canSeeStats} onChange={setCanSeeStats} label="See your live session stats" description="Accuracy, time per question, and the breakdown panel." />
          <Toggle checked={false} label="Answer questions for you" description="Tutors can never answer. This is permanent." disabled />
        </div>
      </Card>

      <Card padding="lg">
        <span style={{ font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)' }}>Connected tutors</span>
        {tutors.length === 0 ? (
          <p style={{ margin: '10px 0 0', font: 'var(--role-body)', color: 'var(--text-tertiary)' }}>No tutors yet. Share your link to connect one.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {tutors.map((t, i) => {
              const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={p?.full_name || 'Tutor'} presence="online" />
                  <div style={{ flex: 1 }}>
                    <div style={{ font: 'var(--role-body)', color: 'var(--text-primary)' }}>{p?.full_name || 'Tutor'}</div>
                    <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>{p?.email || ''}</div>
                  </div>
                  <Badge variant="success" dot>Connected</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default TutorInvite;
