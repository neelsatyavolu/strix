'use client';

import React from 'react';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';
import { usePeerTyping } from '@/lib/tutor/useTyping';

// The logged-in user's OWN student channel: always open while signed in. It
// receives chat from a connected tutor and broadcasts the current practice
// state (so a watching tutor sees the live question + knows the student is
// active). `live` is the current broadcast payload ({ active, ...question }) or
// null/{active:false} when idle — memoize it in the caller.
export function useStudentLive(userId, live) {
  const [messages, setMessages] = React.useState([]);
  const [peerTyping, setPeerTyping] = usePeerTyping();
  const chanRef = React.useRef(null);

  React.useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    loadMessages(userId).then((msgs) => { if (alive) setMessages(msgs); });
    const ch = openTutorChannel({
      studentId: userId,
      userId,
      role: 'student',
      onChat: (m) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m])),
      onTyping: (p) => { if (p?.role !== 'student') setPeerTyping(!!p?.typing); },
    });
    chanRef.current = ch;
    return () => { alive = false; ch.close(); chanRef.current = null; };
  }, [userId, setPeerTyping]);

  React.useEffect(() => {
    const ch = chanRef.current;
    if (!ch) return;
    if (live && live.active) {
      ch.sendSession(live);
      ch.track({ active: true, section: live.section, domainLabel: live.domainLabel, index: live.index, total: live.total });
    } else {
      ch.sendSession({ active: false });
      ch.track({ active: false });
    }
  }, [live]);

  const sendChat = React.useCallback(async (body) => {
    const text = String(body || '').trim();
    if (!text || !userId) return;
    const optimistic = { id: `tmp-${Date.now()}`, sender_id: userId, role: 'student', body: text };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await saveMessage({ studentId: userId, senderId: userId, role: 'student', body: text });
    if (saved) setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    chanRef.current?.sendChat(saved || optimistic);
  }, [userId]);

  const notifyTyping = React.useCallback((on) => {
    chanRef.current?.sendTyping({ role: 'student', typing: !!on });
  }, []);

  return { messages, sendChat, peerTyping, notifyTyping };
}
