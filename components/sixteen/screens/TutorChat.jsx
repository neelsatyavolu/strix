'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { useProfile } from '@/components/sixteen/session/ProfileContext';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';

// TutorChat — the student's full-screen view of their human-tutor chat (when
// not inside a module). Wired to the same Supabase Realtime + tutor_messages
// system the TutorPanel uses.

function TutorChat({ go }) {
  const { Avatar, MessageBubble, ChatComposer, TutorPresence } = SixteenNS;
  const { user } = useProfile();
  const [messages, setMessages] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const [tutorName, setTutorName] = React.useState('Your tutor');
  const streamRef = React.useRef(null);
  const channelRef = React.useRef(null);

  const append = (m) => setMessages((prev) => [...prev, m]);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  // Open the realtime channel, load chat history, and relay incoming messages.
  React.useEffect(() => {
    if (!user?.id) return;
    loadMessages(user.id).then((msgs) =>
      setMessages(msgs.map((m) => ({ id: m.id, side: m.sender_id === user.id ? 'mine' : 'theirs', text: m.body }))),
    );
    const ch = openTutorChannel({
      studentId: user.id,
      userId: user.id,
      role: 'student',
      onChat: (m) => append({ id: m.id, side: m.sender_id === user.id ? 'mine' : 'theirs', text: m.body }),
    });
    channelRef.current = ch;
    return () => { ch.close(); channelRef.current = null; };
  }, [user?.id]);

  // Resolve the connected tutor's name for the header + composer placeholder.
  React.useEffect(() => {
    let active = true;
    fetch('/api/tutor/invite')
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const t = json?.data?.tutors?.[0];
        const p = Array.isArray(t?.profiles) ? t.profiles[0] : t?.profiles;
        if (p?.full_name) setTutorName(p.full_name);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const send = async (text) => {
    if (!text || !user?.id) return;
    const id = Date.now();
    append({ id, side: 'mine', text });
    setDraft('');
    const saved = await saveMessage({ studentId: user.id, senderId: user.id, role: 'student', body: text });
    channelRef.current?.sendChat(saved || { id: String(id), sender_id: user.id, role: 'student', body: text });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{
        padding: '14px 22px', borderBottom: '1px solid var(--border-1)',
        background: 'var(--surface-titlebar)',
        backdropFilter: 'blur(20px) saturate(180%)',
        display: 'flex', alignItems:'center', justifyContent: 'space-between',
      }}>
        <div style={{display:'flex', alignItems:'center', gap: 12}}>
          <Avatar name={tutorName} presence="online" />
          <div style={{display:'flex', flexDirection:'column'}}>
            <span style={{font:'var(--role-title-sm)'}}>{tutorName}</span>
            <TutorPresence name="" status="online" watching={false} />
          </div>
        </div>
        <button onClick={() => go('tutor-invite')} style={{font:'var(--role-label)', background:'transparent', border:0, color:'var(--text-link)', cursor:'pointer'}}>Tutor settings →</button>
      </div>

      <div ref={streamRef} style={{ flex:1, overflow:'auto', padding: '20px 24px', display:'flex', flexDirection:'column', gap: 10, background:'var(--paper)' }}>
        {messages.length === 0 ? (
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', font:'var(--role-body)', color:'var(--text-tertiary)'}}>
            No messages yet — say hi to your tutor.
          </div>
        ) : (
          <>
            <DateChip text="Today" />
            {messages.map(m => <MessageBubble key={m.id} side={m.side} text={m.text} time={m.time} />)}
          </>
        )}
      </div>
      <div style={{padding: 0}}>
        <ChatComposer value={draft} onChange={setDraft} onSend={send} placeholder={`Message ${tutorName.split(' ')[0]}`} />
      </div>
    </div>
  );
}

function DateChip({ text }) {
  return (
    <div style={{display:'flex', justifyContent:'center', margin: '0 0 8px'}}>
      <span style={{font:'var(--role-caption)', color:'var(--text-tertiary)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', background:'var(--sunken)'}}>{text}</span>
    </div>
  );
}

export default TutorChat;
