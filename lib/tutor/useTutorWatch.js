'use client';

import React from 'react';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';
import { usePeerTyping } from '@/lib/tutor/useTyping';

// How long a student must look idle (session `active:false` or presence gone)
// before we treat them as not-live. Short Realtime flaps — common under math
// when Desmos floods the channel — used to bounce the tutor off Live Session.
const IDLE_DEBOUNCE_MS = 2500;

// The tutor side: subscribe to every student's channel so we know who is live
// (for the banner) and, for the currently-watched student, relay their live
// question + chat.
//
//   students          [{ id, name }]
//   watchedStudentId  the student whose live view / chat is open (or null)
//   selfId            the tutor's own user id
//
// Returns { liveStudents, watchedLive, messages, sendChat }.
//   liveStudents  { [studentId]: { active, section, domainLabel, index, total } }
//   watchedLive   the watched student's current question payload (or null)
export function useTutorWatch(students, watchedStudentId, selfId) {
  const [liveStudents, setLiveStudents] = React.useState({});
  const [onlineStudents, setOnlineStudents] = React.useState({});
  const [watchedLive, setWatchedLive] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [peerTyping, setPeerTyping] = usePeerTyping();
  const channelsRef = React.useRef(new Map());
  const watchedRef = React.useRef(watchedStudentId);
  React.useEffect(() => { watchedRef.current = watchedStudentId; }, [watchedStudentId]);

  // Per-student timers: only commit "idle" after a quiet stretch so brief
  // presence/session flaps don't unmount Live Session.
  const idleTimersRef = React.useRef(new Map());

  const clearIdleTimer = React.useCallback((sid) => {
    const t = idleTimersRef.current.get(sid);
    if (t) {
      clearTimeout(t);
      idleTimersRef.current.delete(sid);
    }
  }, []);

  const markLive = React.useCallback((sid, meta) => {
    clearIdleTimer(sid);
    setLiveStudents((prev) => ({ ...prev, [sid]: meta }));
  }, [clearIdleTimer]);

  const scheduleIdle = React.useCallback((sid, { clearWatched = false } = {}) => {
    if (idleTimersRef.current.has(sid)) return;
    const timer = setTimeout(() => {
      idleTimersRef.current.delete(sid);
      setLiveStudents((prev) => ({ ...prev, [sid]: { active: false } }));
      if (clearWatched && sid === watchedRef.current) setWatchedLive(null);
    }, IDLE_DEBOUNCE_MS);
    idleTimersRef.current.set(sid, timer);
  }, []);

  const ids = React.useMemo(() => (students || []).map((s) => s.id).filter(Boolean), [students]);
  const idsKey = ids.join(',');

  React.useEffect(() => {
    if (!selfId) return undefined;
    const map = channelsRef.current;
    const wanted = idsKey ? idsKey.split(',') : [];

    for (const sid of wanted) {
      if (map.has(sid)) continue;
      const ch = openTutorChannel({
        studentId: sid,
        userId: selfId,
        role: 'tutor',
        onPresence: (state) => {
          const entry = (state?.[sid] || []).find((e) => e.role === 'student');
          // Present on the channel at all = "online". Do NOT treat a missing
          // presence entry as session-idle immediately — under load (esp. math
          // Desmos broadcasts) presence can briefly desync while the student is
          // still practicing.
          setOnlineStudents((prev) => ({ ...prev, [sid]: !!entry }));
          if (entry?.active) {
            markLive(sid, {
              active: true,
              section: entry.section,
              domainLabel: entry.domainLabel,
              index: entry.index,
              total: entry.total,
            });
          } else if (entry && entry.active === false) {
            // Student tracked idle while still online.
            scheduleIdle(sid, { clearWatched: true });
          } else if (!entry) {
            // Fully left the channel — debounce before clearing live.
            scheduleIdle(sid, { clearWatched: true });
          }
        },
        onSession: (s) => {
          const idle = !s || s.active === false;
          if (idle) {
            // Keep the last question painted until the idle debounce fires so
            // the tutor mirror doesn't flash empty on a dropped packet.
            scheduleIdle(sid, { clearWatched: true });
            return;
          }
          clearIdleTimer(sid);
          if (sid === watchedRef.current) setWatchedLive(s);
          markLive(sid, {
            active: true,
            section: s.section,
            domainLabel: s.domainLabel,
            index: s.index,
            total: s.total,
          });
        },
        onChat: (m) => {
          if (sid === watchedRef.current) {
            setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          }
        },
        onTyping: (p) => {
          if (sid === watchedRef.current && p?.role !== 'tutor') setPeerTyping(!!p?.typing);
        },
      });
      map.set(sid, ch);
    }

    for (const [sid, ch] of map) {
      if (!wanted.includes(sid)) {
        ch.close();
        map.delete(sid);
        clearIdleTimer(sid);
      }
    }
    return undefined;
  }, [idsKey, selfId, setPeerTyping, markLive, scheduleIdle, clearIdleTimer]);

  React.useEffect(() => () => {
    for (const [, ch] of channelsRef.current) ch.close();
    channelsRef.current.clear();
    for (const t of idleTimersRef.current.values()) clearTimeout(t);
    idleTimersRef.current.clear();
  }, []);

  // Reset and load chat history when the watched student changes.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWatchedLive(null);
    setMessages([]);
    setPeerTyping(false);
    if (!watchedStudentId) return undefined;
    let alive = true;
    loadMessages(watchedStudentId).then((msgs) => { if (alive) setMessages(msgs); });
    return () => { alive = false; };
  }, [watchedStudentId, setPeerTyping]);

  const sendChat = React.useCallback(async (body) => {
    const text = String(body || '').trim();
    const sid = watchedStudentId;
    if (!text || !sid || !selfId) return;
    const optimistic = { id: `tmp-${Date.now()}`, sender_id: selfId, role: 'tutor', body: text };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await saveMessage({ studentId: sid, senderId: selfId, role: 'tutor', body: text });
    if (saved) setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    channelsRef.current.get(sid)?.sendChat(saved || optimistic);
  }, [watchedStudentId, selfId]);

  const notifyTyping = React.useCallback((on) => {
    const sid = watchedStudentId;
    if (sid) channelsRef.current.get(sid)?.sendTyping({ role: 'tutor', typing: !!on });
  }, [watchedStudentId]);

  return { liveStudents, onlineStudents, watchedLive, messages, sendChat, peerTyping, notifyTyping };
}
