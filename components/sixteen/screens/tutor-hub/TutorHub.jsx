'use client';
import React from 'react';
import { Page, PageHeader, Tabs } from '@/components/sixteen';
import { useNav } from '@/components/sixteen/session/Navigation';
import TutorMessages from './TutorMessages';
import TutorManage from './TutorManage';
import s from './TutorHub.module.css';

// Tutor — the student's tutoring home: chat with your tutor (Messages) and
// manage who can follow your practice (Tutors). `params.tab` picks the tab
// ('chat' | 'tutors'); without one we open Messages, or Tutors when nobody is
// connected yet.
//
// `chat` (optional) is the app-owned live thread — the same object SixteenApp
// hands the tutor pane: { messages, onSend, peerTyping, peerOnline, onTyping }.
// Without it, Messages shows the history read-only and points to the pane.

async function fetchInvite() {
  const j = await fetch('/api/tutor/invite').then((r) => r.json());
  if (!j?.success) throw new Error(j?.error || 'Could not load your tutors.');
  return { token: j.data.link?.token ?? null, tutors: j.data.tutors || [] };
}

export default function TutorHub({ params = {}, chat = null }) {
  const nav = useNav();
  const [state, setState] = React.useState({ status: 'loading', token: null, tutors: [] });

  const apply = React.useCallback((promise) => {
    promise
      .then((d) => setState({ status: 'ready', ...d }))
      .catch(() => setState((prev) => ({ ...prev, status: 'error' })));
  }, []);

  React.useEffect(() => { apply(fetchInvite()); }, [apply]);

  const retry = () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    apply(fetchInvite());
  };

  const { status, token, tutors } = state;
  const tab = params.tab === 'chat' || params.tab === 'tutors'
    ? params.tab
    : (status === 'ready' && tutors.length === 0 ? 'tutors' : 'chat');
  const setTab = (t) => nav.replace('tutor', { ...params, tab: t });

  return (
    <Page width="narrow">
      <PageHeader
        title="Tutor"
        subtitle="Chat with your tutor and choose who can follow your practice."
      />
      <Tabs
        className={s.tabs}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'chat', label: 'Messages' },
          { value: 'tutors', label: 'Tutors', count: status === 'ready' && tutors.length ? tutors.length : undefined },
        ]}
      />
      {tab === 'chat' ? (
        <TutorMessages
          chat={chat}
          status={status}
          tutors={tutors}
          onRetry={retry}
          onInvite={() => setTab('tutors')}
        />
      ) : (
        <TutorManage
          status={status}
          token={token}
          tutors={tutors}
          onRetry={retry}
          onToken={(t) => setState((prev) => ({ ...prev, token: t }))}
        />
      )}
    </Page>
  );
}
