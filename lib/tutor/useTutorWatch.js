'use client';

import React from 'react';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';
import { usePeerTyping } from '@/lib/tutor/useTyping';

// Only session broadcasts can idle the live mirror. Presence is flaky under
// load (math Desmos / large questions) and must never clear the painted view.
const SESSION_IDLE_MS = 4000;

function mergeSession(prev, s) {
  if (!s || s.active === false) return null;
  // Reviewing a completed session carries no question HTML — both sides load it
  // from the database. Replace wholesale; there is nothing to merge.
  if (s.mode === 'review') {
    return { active: true, mode: 'review', sessionId: s.sessionId };
  }
  // Lightweight tick: only merge onto an existing full snapshot for the same
  // question. If the question changed and the full HTML packet was dropped,
  // keep painting the previous frame rather than flashing empty.
  if (s.patch) {
    if (!prev || (s.id && prev.id && s.id !== prev.id)) return prev || null;
    return {
      ...prev,
      active: true,
      id: s.id ?? prev.id,
      index: s.index ?? prev.index,
      total: s.total ?? prev.total,
      section: s.section ?? prev.section,
      domainLabel: s.domainLabel ?? prev.domainLabel,
      sectionLabel: s.sectionLabel ?? prev.sectionLabel,
      selected: s.selected,
      flagged: s.flagged,
      type: s.type ?? prev.type,
      palette: s.palette ?? prev.palette,
      marks: s.marks,
      eliminated: s.eliminated,
      annotateActive: s.annotateActive,
      seconds: s.seconds,
      timerRunning: s.timerRunning,
      calc: s.calc,
      // stemHtml / stimulusHtml / choices stay from the full snapshot
    };
  }
  // Full snapshot (or legacy untagged payload) — drop control flags.
  return {
    active: true,
    mode: 'practice',
    id: s.id,
    index: s.index,
    total: s.total,
    section: s.section,
    domainLabel: s.domainLabel,
    sectionLabel: s.sectionLabel,
    stemHtml: s.stemHtml,
    stimulusHtml: s.stimulusHtml,
    choices: s.choices,
    selected: s.selected,
    flagged: s.flagged,
    type: s.type,
    palette: s.palette,
    marks: s.marks,
    eliminated: s.eliminated,
    annotateActive: s.annotateActive,
    seconds: s.seconds,
    timerRunning: s.timerRunning,
    calc: s.calc,
  };
}

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

  // Sticky last good snapshot per student — survives brief nulls so Live Session
  // never flashes "isn't in a section" while the student is still practicing.
  const stickyLiveRef = React.useRef(new Map());

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

  // Only called on explicit session active:false (never presence).
  const scheduleSessionIdle = React.useCallback((sid) => {
    if (idleTimersRef.current.has(sid)) return;
    const timer = setTimeout(() => {
      idleTimersRef.current.delete(sid);
      setLiveStudents((prev) => ({ ...prev, [sid]: { active: false } }));
      stickyLiveRef.current.delete(sid);
      if (sid === watchedRef.current) setWatchedLive(null);
    }, SESSION_IDLE_MS);
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
          // Presence = online only. Never clear live session from presence —
          // channel flaps under math load were the main "disappears then back"
          // / "not in a section" bug.
          setOnlineStudents((prev) => ({ ...prev, [sid]: !!entry }));
          if (entry?.active) {
            markLive(sid, {
              active: true,
              mode: entry.mode || 'practice',
              sessionId: entry.sessionId,
              section: entry.section,
              domainLabel: entry.domainLabel,
              index: entry.index,
              total: entry.total,
            });
            // If we lost the painted snapshot but presence still says active,
            // re-surface the sticky last frame instead of the empty state.
            if (sid === watchedRef.current) {
              const sticky = stickyLiveRef.current.get(sid);
              if (sticky) {
                setWatchedLive((cur) => cur || sticky);
              }
            }
          }
        },
        onSession: (s) => {
          const idle = !s || s.active === false;
          if (idle) {
            // Keep last frame painted until the session-idle debounce commits.
            // Do not null watchedLive here — that caused the empty flash.
            scheduleSessionIdle(sid);
            return;
          }
          clearIdleTimer(sid);
          markLive(sid, {
            active: true,
            mode: s.mode || 'practice',
            sessionId: s.sessionId,
            section: s.section,
            domainLabel: s.domainLabel,
            index: s.index,
            total: s.total,
          });
          if (sid === watchedRef.current) {
            setWatchedLive((prev) => {
              const next = mergeSession(prev || stickyLiveRef.current.get(sid) || null, s);
              if (next) stickyLiveRef.current.set(sid, next);
              return next;
            });
          } else {
            // Still keep sticky for when the tutor switches to this student.
            const prev = stickyLiveRef.current.get(sid) || null;
            const next = mergeSession(prev, s);
            if (next) stickyLiveRef.current.set(sid, next);
          }
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
        stickyLiveRef.current.delete(sid);
      }
    }
    return undefined;
  }, [idsKey, selfId, setPeerTyping, markLive, scheduleSessionIdle, clearIdleTimer]);

  React.useEffect(() => () => {
    for (const [, ch] of channelsRef.current) ch.close();
    channelsRef.current.clear();
    for (const t of idleTimersRef.current.values()) clearTimeout(t);
    idleTimersRef.current.clear();
  }, []);

  // Reset and load chat history when the watched student changes. Prefer the
  // sticky snapshot so Live Session isn't blank while the next full arrives.
  React.useEffect(() => {
    const sticky = watchedStudentId ? stickyLiveRef.current.get(watchedStudentId) : null;
    setWatchedLive(sticky || null);
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
    // clientKey stays stable across the optimistic→saved swap so the bubble
    // doesn't remount (that remount was a big source of send-time chat jitter).
    const clientKey = `tmp-${Date.now()}`;
    const optimistic = { id: clientKey, clientKey, sender_id: selfId, role: 'tutor', body: text };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await saveMessage({ studentId: sid, senderId: selfId, role: 'tutor', body: text });
    if (saved) {
      setMessages((prev) => prev.map((m) => (
        m.id === clientKey ? { ...saved, clientKey } : m
      )));
    }
    channelsRef.current.get(sid)?.sendChat(saved || optimistic);
  }, [watchedStudentId, selfId]);

  const notifyTyping = React.useCallback((on) => {
    const sid = watchedStudentId;
    if (sid) channelsRef.current.get(sid)?.sendTyping({ role: 'tutor', typing: !!on });
  }, [watchedStudentId]);

  // Teaching-mode senders for the watched student. Memoized on the id so the
  // teach hook doesn't re-announce its state on every render.
  const sendTeach = React.useCallback((p) => {
    const sid = watchedStudentId;
    if (sid) channelsRef.current.get(sid)?.sendTeach(p);
  }, [watchedStudentId]);
  const sendPoint = React.useCallback((p) => {
    const sid = watchedStudentId;
    if (sid) channelsRef.current.get(sid)?.sendPoint(p);
  }, [watchedStudentId]);
  const sendInk = React.useCallback((p) => {
    const sid = watchedStudentId;
    if (sid) channelsRef.current.get(sid)?.sendInk(p);
  }, [watchedStudentId]);
  const teachSend = React.useMemo(
    () => (watchedStudentId ? { sendTeach, sendPoint, sendInk } : null),
    [watchedStudentId, sendTeach, sendPoint, sendInk],
  );

  return { liveStudents, onlineStudents, watchedLive, messages, sendChat, peerTyping, notifyTyping, teachSend };
}
