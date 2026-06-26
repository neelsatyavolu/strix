'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import { Icon } from '@/components/sixteen';
import { SixteenData } from '@/lib/mockData';

// TutorChat — full-screen tutor chat (when not in a module).

function TutorChat({ go }) {
  const { Card, Avatar, Badge, MessageBubble, ChatComposer, TutorPresence } = SixteenNS;
  const d = SixteenData;
  const [messages, setMessages] = React.useState(d.chat);
  const [draft, setDraft] = React.useState('');
  const streamRef = React.useRef(null);

  React.useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [messages]);

  const send = (text) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, side: 'mine', text, time: 'now' }]);
    setDraft('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: id + 1, side: 'theirs', text: "Got it — want me to look at Module 1 with you?", time: 'now' }]);
    }, 1100);
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
          <Avatar name="Rachel Hsu" presence="online" />
          <div style={{display:'flex', flexDirection:'column'}}>
            <span style={{font:'var(--role-title-sm)'}}>Rachel Hsu</span>
            <TutorPresence name="" status="online" watching={false} />
          </div>
        </div>
        <button onClick={() => go('tutor-invite')} style={{font:'var(--role-label)', background:'transparent', border:0, color:'var(--text-link)', cursor:'pointer'}}>Tutor settings →</button>
      </div>

      <div ref={streamRef} style={{ flex:1, overflow:'auto', padding: '20px 24px', display:'flex', flexDirection:'column', gap: 10, background:'var(--paper)' }}>
        <DateChip text="Today" />
        {messages.map(m => <MessageBubble key={m.id} side={m.side} text={m.text} time={m.time} />)}
      </div>
      <div style={{padding: 0}}>
        <ChatComposer value={draft} onChange={setDraft} onSend={send} placeholder="Message Rachel" />
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
