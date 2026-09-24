'use client';
import React from 'react';
import { Avatar, Badge, Button, EmptyState, Icon, Input, List, ListRow, Section, Skeleton, Toggle } from '@/components/sixteen';
import { tutorProfile } from './profile';
import s from './TutorHub.module.css';

// Tutors — invite link, what a tutor can see/do, and who's connected.

// Prefer the public site URL so links open for remote tutors (the desktop app
// runs on localhost, but invites must point at the hosted Vercel server).
function inviteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}

export default function TutorManage({ status, token, tutors, onRetry, onToken }) {
  const [canChat, setCanChat] = React.useState(true);
  const [canSeeStats, setCanSeeStats] = React.useState(true);

  return (
    <>
      <InviteLink token={token} loading={status === 'loading'} canChat={canChat} onToken={onToken} />

      <Section title="What your tutor can see" description="Tutors follow along. They can never answer or change anything for you.">
        <List>
          <Capability icon="eye" title="The question you're on" subtitle="Live as you practice, with your highlights and timer" trailing={<Badge size="sm">Always</Badge>} />
          <Capability icon="chart-line" title="Your progress" subtitle="Scores, skills, history, and review queue, view-only" trailing={<Badge size="sm">Always</Badge>} />
          <Capability icon="calendar-check" title="Your plan" subtitle="They can add practice to it for you" trailing={<Badge size="sm">Always</Badge>} />
          <Capability
            icon="message-circle"
            title="Chat with you"
            subtitle="Applies to new invite links"
            trailing={<Toggle checked={canChat} onChange={setCanChat} />}
          />
          <Capability
            icon="activity"
            title="Live session stats"
            subtitle="Accuracy and time per question"
            trailing={<Toggle checked={canSeeStats} onChange={setCanSeeStats} />}
          />
          <Capability icon="ban" title="Answer for you" subtitle="Never. Only you can answer questions." trailing={<Badge size="sm" variant="outline">Never</Badge>} />
        </List>
      </Section>

      <Section title="Your tutors">
        <TutorList status={status} tutors={tutors} onRetry={onRetry} />
      </Section>
    </>
  );
}

function Capability({ icon, title, subtitle, trailing }) {
  return (
    <ListRow
      leading={<span className={s.capIcon}><Icon name={icon} size={15} /></span>}
      title={title}
      subtitle={subtitle}
      trailing={trailing}
    />
  );
}

function InviteLink({ token, loading, canChat, onToken }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const link = token ? `${inviteOrigin()}/join/${token}` : '';

  const generate = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/tutor/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canWatch: true, canChat }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(false);
    if (res?.success) onToken(res.data.token);
    else setError(res?.error || "Couldn't create a link. Try again.");
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Section title="Invite a tutor" description="Share this link. Whoever opens it and signs in becomes your tutor.">
      {loading ? (
        <Skeleton height={34} radius={8} />
      ) : link ? (
        <div className={s.linkRow}>
          <Input value={link} readOnly variant="sunken" aria-label="Invite link" onFocus={(e) => e.target.select()} />
          <Button
            variant="primary"
            onClick={copy}
            icon={<Icon name={copied ? 'check' : 'copy'} size={14} />}
            className={s.copyBtn}
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      ) : (
        <div className={s.linkEmpty}>
          <Button variant="primary" loading={busy} onClick={generate} icon={<Icon name="link" size={14} />}>
            Create invite link
          </Button>
          {error && <p className={s.inlineError} role="alert">{error}</p>}
        </div>
      )}
    </Section>
  );
}

function TutorList({ status, tutors, onRetry }) {
  if (status === 'loading') {
    return (
      <List>
        {[0, 1].map((i) => (
          <ListRow
            key={i}
            leading={<Skeleton width={32} height={32} radius={16} />}
            title={<Skeleton width={140} height={12} />}
            subtitle={<Skeleton width={180} height={10} style={{ marginTop: 4 }} />}
          />
        ))}
      </List>
    );
  }
  if (status === 'error') {
    return (
      <div className={s.errorRow} role="alert">
        <span>Couldn&apos;t load your tutors.</span>
        <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
      </div>
    );
  }
  if (tutors.length === 0) {
    return (
      <List>
        <EmptyState compact icon="users" title="No tutors yet" body="Share your invite link to connect one." />
      </List>
    );
  }
  return (
    <List>
      {tutors.map((t, i) => {
        const p = tutorProfile(t);
        return (
          <ListRow
            key={t.tutor_id || i}
            leading={<Avatar name={p.name} />}
            title={p.name}
            subtitle={p.email}
            trailing={<Badge size="sm" variant="success" dot>Connected</Badge>}
          />
        );
      })}
    </List>
  );
}
