'use client';

import React from 'react';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';
import { usePeerTyping } from '@/lib/tutor/useTyping';

// The logged-in user's OWN student channel: always open while signed in. It
// receives chat from a connected tutor and broadcasts the current practice
// state (so a watching tutor sees the live question + knows the student is
// active). `live` is the current broadcast payload ({ active, ...question }) or
// null/{active:false} when idle — memoize it in the caller.
export function useStudentLive(userId, live, chatOpen = false) {
  const [messages, setMessages] = React.useState([]);
  const [unread, setUnread] = React.useState(false);
  const [peerOnline, setPeerOnline] = React.useState(false);
  const [peerTyping, setPeerTyping] = usePeerTyping();
  const chanRef = React.useRef(null);
  // Mirror `chatOpen` into a ref so the (stable) onChat handler can read the
  // latest value without re-subscribing on every toggle.
  const chatOpenRef = React.useRef(chatOpen);
  React.useEffect(() => {
    chatOpenRef.current = chatOpen;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (chatOpen) setUnread(false);  // opening the chat clears the unread marker
  }, [chatOpen]);

  React.useEffect(() => {
    if (!userId) return undefined;
    let alive = true;
    // Initial history load — never marks unread (only live arrivals below do).
    loadMessages(userId).then((msgs) => { if (alive) setMessages(msgs); });
    const ch = openTutorChannel({
      studentId: userId,
      userId,
      role: 'student',
      onChat: (m) => {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        // A live message from the tutor while the chat is collapsed is unread.
        if (m.sender_id !== userId && !chatOpenRef.current) setUnread(true);
      },
      onTyping: (p) => { if (p?.role !== 'student') setPeerTyping(!!p?.typing); },
      // A tutor is "online" iff one is currently subscribed to our channel.
      onPresence: (state) => setPeerOnline(
        Object.values(state || {}).some((metas) => metas.some((e) => e.role === 'tutor')),
      ),
    });
    chanRef.current = ch;
    return () => { alive = false; ch.close(); chanRef.current = null; };
  }, [userId, setPeerTyping]);

  // The live broadcast carries the per-second timer, so `live` changes every
  // second while practicing. Broadcast that every tick (it drives the tutor's
  // mirror), but only re-`track` presence when the coarse "where are they"
  // fields change — re-tracking every second makes Realtime presence flap and
  // can leave the tutor seeing the student as offline.
  const lastTrackRef = React.useRef(null);
  React.useEffect(() => {
    const ch = chanRef.current;
    if (!ch) return;
    const active = !!(live && live.active);
    ch.sendSession(active ? live : { active: false });
    const key = active ? `${live.section}|${live.domainLabel}|${live.index}|${live.total}` : '';
    if (key === lastTrackRef.current) return;
    lastTrackRef.current = key;
    ch.track(active
      ? { active: true, section: live.section, domainLabel: live.domainLabel, index: live.index, total: live.total }
      : { active: false });
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

  return { messages, sendChat, peerTyping, notifyTyping, unread, peerOnline };
}
