'use client';
import React from 'react';
import { Avatar, Button, EmptyState, Skeleton, Icon } from '@/components/sixteen';
import { ChatThread } from '@/components/sixteen/chat/ChatThread';
import { ChatComposer } from '@/components/sixteen/chat/ChatComposer';
import { TutorPresence } from '@/components/sixteen/chat/TutorPresence';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { loadMessages } from '@/lib/tutor/realtime';
import { useTypingEmitter } from '@/lib/tutor/useTyping';
import { tutorProfile } from './profile';
import s from './TutorHub.module.css';

// Messages — full-page view of the student ↔ tutor thread. Sends go through the
// app-owned `chat` (the same realtime channel as the tutor pane), so the two
// views never open competing channels.

export default function TutorMessages({ chat, status, tutors, onRetry, onInvite }) {
  if (status === 'loading') return <ChatSkeleton />;
  if (status === 'error' && tutors.length === 0) {
    return (
      <EmptyState
        icon="wifi-off"
        title="Couldn't load your tutors"
        body="Check your connection and try again."
        action={<Button variant="secondary" onClick={onRetry}>Try again</Button>}
      />
    );
  }
  if (tutors.length === 0) {
    return (
      <EmptyState
        icon="message-circle"
        title="No tutor yet"
        body="Invite a tutor to chat here and follow your practice live."
        action={<Button variant="primary" onClick={onInvite}>Invite a tutor</Button>}
      />
    );
  }
  return <ChatCard chat={chat} tutors={tutors} />;
}

function ChatCard({ chat, tutors }) {
  const { user } = useProfile();
  const selfId = user?.id;
  const first = tutorProfile(tutors[0]);
  const title = tutors.length > 1 ? `${first.name} + ${tutors.length - 1} more` : first.name;
  const firstName = first.name.split(' ')[0];

  // Without the app-owned thread, show saved history read-only.
  const [history, setHistory] = React.useState([]);
  React.useEffect(() => {
    if (chat || !selfId) return undefined;
    let alive = true;
    loadMessages(selfId).then((rows) => { if (alive) setHistory(rows); }).catch(() => {});
    return () => { alive = false; };
  }, [chat, selfId]);

  const hasChat = !!chat;
  const live = chat?.messages;
  // Prefer clientKey for React keys so optimistic→saved id swaps don't remount.
  const messages = React.useMemo(() => (hasChat ? live || [] : history).map((m) => ({
    id: m.clientKey || m.id,
    side: m.sender_id === selfId ? 'mine' : 'theirs',
    text: m.body,
  })), [hasChat, live, history, selfId]);

  const [draft, setDraft] = React.useState('');
  const threadRef = React.useRef(null);
  const typing = useTypingEmitter(chat?.onTyping);
  const onDraftChange = (v) => {
    setDraft(v);
    if (v.trim()) typing.bump(); else typing.stop();
  };
  const send = (text) => {
    threadRef.current?.pin();
    setDraft('');
    typing.stop();
    chat?.onSend?.(text);
  };

  const online = !!chat?.peerOnline;

  return (
    <div className={s.chat}>
      <div className={s.chatHead}>
        <Avatar name={first.name} presence={chat ? (online ? 'online' : 'offline') : undefined} />
        <div className={s.chatHeadText}>
          <span className={s.chatName}>{title}</span>
          {chat
            ? <TutorPresence name="" status={online ? 'online' : 'offline'} />
            : <span className={s.chatSub}>{first.email}</span>}
        </div>
      </div>
      <ChatThread
        ref={threadRef}
        messages={messages}
        typing={!!chat?.peerTyping}
        empty={{ title: 'No messages yet', body: `Say hi to ${firstName}. They'll see it right away, even mid-practice.` }}
        className={s.chatThread}
      />
      {chat?.onSend ? (
        <ChatComposer value={draft} onChange={onDraftChange} onSend={send} placeholder={`Message ${firstName}`} />
      ) : (
        <div className={s.chatNote}>
          <Icon name="panel-right" size={14} />
          <span>To reply, open the tutor pane from the toolbar.</span>
        </div>
      )}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className={s.chat} aria-busy="true">
      <div className={s.chatHead}>
        <Skeleton width={32} height={32} radius={16} />
        <div className={s.chatHeadText}>
          <Skeleton width={120} height={12} />
          <Skeleton width={64} height={10} />
        </div>
      </div>
      <div className={s.skelThread}>
        <Skeleton width="46%" height={30} radius={16} />
        <Skeleton width="34%" height={30} radius={16} style={{ alignSelf: 'flex-end' }} />
        <Skeleton width="52%" height={30} radius={16} />
      </div>
    </div>
  );
}
