'use client';

import React from 'react';
import { openTutorChannel, loadMessages, saveMessage } from '@/lib/tutor/realtime';
import { usePeerTyping } from '@/lib/tutor/useTyping';
import { useTeachStudent } from '@/lib/tutor/useTeachMode';

// Desmos getState() can blow past Realtime's practical payload size and drop
// the whole session message (math-only symptom). Keep open/pos/size; drop huge graphs.
const MAX_CALC_STATE_CHARS = 24_000;
// Don't announce idle on a single-frame status blip (module swap, re-render).
const IDLE_ANNOUNCE_MS = 900;

function sanitizeCalc(calc) {
  if (!calc) return calc;
  if (!calc.state) return calc;
  try {
    const raw = typeof calc.state === 'string' ? calc.state : JSON.stringify(calc.state);
    if (raw.length <= MAX_CALC_STATE_CHARS) return calc;
  } catch {
    /* strip */
  }
  return { open: !!calc.open, pos: calc.pos, size: calc.size };
}

// Soft cap so full snapshots don't get silently dropped by Realtime (math
// stems + Desmos were the usual offenders). Prefer a slightly truncated
// question over a vanished live session.
const MAX_FULL_CHARS = 90_000;

function fullPayload(live) {
  const payload = {
    active: true,
    full: true,
    mode: 'practice',
    id: live.id,
    index: live.index,
    total: live.total,
    section: live.section,
    domainLabel: live.domainLabel,
    sectionLabel: live.sectionLabel,
    stemHtml: live.stemHtml,
    stimulusHtml: live.stimulusHtml,
    choices: live.choices,
    selected: live.selected,
    flagged: live.flagged,
    type: live.type,
    palette: live.palette,
    marks: live.marks,
    eliminated: live.eliminated,
    annotateActive: live.annotateActive,
    seconds: live.seconds,
    timerRunning: live.timerRunning,
    calc: sanitizeCalc(live.calc),
  };
  try {
    if (JSON.stringify(payload).length <= MAX_FULL_CHARS) return payload;
    // Drop passage/stimulus first (RW), then calc state, then trim stem.
    payload.stimulusHtml = undefined;
    payload.calc = sanitizeCalc(payload.calc ? { ...payload.calc, state: undefined } : payload.calc);
    if (JSON.stringify(payload).length <= MAX_FULL_CHARS) return payload;
    if (typeof payload.stemHtml === 'string' && payload.stemHtml.length > 24_000) {
      payload.stemHtml = `${payload.stemHtml.slice(0, 24_000)}…`;
    }
  } catch {
    /* send as-is */
  }
  return payload;
}

// Lightweight tick — no HTML. Tutor merges onto the last full snapshot.
function patchPayload(live) {
  return {
    active: true,
    patch: true,
    mode: 'practice',
    id: live.id,
    index: live.index,
    total: live.total,
    section: live.section,
    domainLabel: live.domainLabel,
    sectionLabel: live.sectionLabel,
    selected: live.selected,
    flagged: live.flagged,
    type: live.type,
    palette: live.palette,
    marks: live.marks,
    eliminated: live.eliminated,
    annotateActive: live.annotateActive,
    seconds: live.seconds,
    timerRunning: live.timerRunning,
    calc: sanitizeCalc(live.calc),
  };
}

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
  const teach = useTeachStudent();
  const chanRef = React.useRef(null);
  const liveRef = React.useRef(live);
  const lastQidRef = React.useRef(null);
  const lastTrackRef = React.useRef(null);
  const idleTimerRef = React.useRef(null);
  const wasTutorOnlineRef = React.useRef(false);

  // Mirror `chatOpen` into a ref so the (stable) onChat handler can read the
  // latest value without re-subscribing on every toggle.
  const chatOpenRef = React.useRef(chatOpen);
  React.useEffect(() => {
    liveRef.current = live;
  }, [live]);
  React.useEffect(() => {
    chatOpenRef.current = chatOpen;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (chatOpen) setUnread(false);  // opening the chat clears the unread marker
  }, [chatOpen]);

  const pushLive = React.useCallback((forceFull = false) => {
    const ch = chanRef.current;
    const cur = liveRef.current;
    if (!ch || !cur?.active) return;

    // Reviewing a completed session: both sides render the same questions from
    // the database, so all the tutor needs is which session is open.
    if (cur.mode === 'review') {
      lastQidRef.current = null;
      ch.sendSession({ active: true, mode: 'review', sessionId: cur.sessionId });
      const rk = `review|${cur.sessionId}`;
      if (rk !== lastTrackRef.current) {
        lastTrackRef.current = rk;
        ch.track({ active: true, mode: 'review', sessionId: cur.sessionId });
      }
      return;
    }

    const qChanged = lastQidRef.current !== cur.id;
    lastQidRef.current = cur.id;
    ch.sendSession(forceFull || qChanged ? fullPayload(cur) : patchPayload(cur));
    const key = `${cur.section}|${cur.domainLabel}|${cur.index}|${cur.total}`;
    if (key !== lastTrackRef.current) {
      lastTrackRef.current = key;
      ch.track({
        active: true,
        mode: 'practice',
        section: cur.section,
        domainLabel: cur.domainLabel,
        index: cur.index,
        total: cur.total,
      });
    }
  }, []);

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
      onTeach: teach.onTeach,
      onPoint: teach.onPoint,
      onInk: teach.onInk,
      // A tutor is "online" iff one is currently subscribed to our channel.
      onPresence: (state) => {
        const tutorOnline = Object.values(state || {}).some((metas) =>
          metas.some((e) => e.role === 'tutor'),
        );
        setPeerOnline(tutorOnline);
        // When a tutor (re)joins, push a full snapshot so they get stem/choices
        // even if they missed earlier broadcasts (or oversized patches dropped).
        if (tutorOnline && !wasTutorOnlineRef.current) pushLive(true);
        wasTutorOnlineRef.current = tutorOnline;
      },
      // After reconnect, re-announce current practice so the tutor recovers.
      onSubscribed: () => pushLive(true),
    });
    chanRef.current = ch;
    return () => {
      alive = false;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      ch.close();
      chanRef.current = null;
    };
  }, [userId, setPeerTyping, pushLive, teach.onTeach, teach.onPoint, teach.onInk]);

  // Broadcast practice state. Full snapshot only when the question changes;
  // everything else is a tiny patch (timer, selection, calc chrome). Idle is
  // debounced so a one-frame status flicker never tells the tutor we've left.
  React.useEffect(() => {
    const ch = chanRef.current;
    if (!ch) return undefined;
    const active = !!(live && live.active);

    if (!active) {
      if (idleTimerRef.current) return undefined;
      idleTimerRef.current = setTimeout(() => {
        idleTimerRef.current = null;
        // Bail if practice resumed during the wait.
        if (liveRef.current?.active) return;
        ch.sendSession({ active: false });
        if (lastTrackRef.current !== '') {
          lastTrackRef.current = '';
          ch.track({ active: false });
        }
        lastQidRef.current = null;
      }, IDLE_ANNOUNCE_MS);
      return undefined;
    }

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    pushLive(false);
    return undefined;
  }, [live, pushLive]);

  const sendChat = React.useCallback(async (body) => {
    const text = String(body || '').trim();
    if (!text || !userId) return;
    // clientKey stays stable across the optimistic→saved swap so the bubble
    // doesn't remount (that remount was a big source of send-time chat jitter).
    const clientKey = `tmp-${Date.now()}`;
    const optimistic = { id: clientKey, clientKey, sender_id: userId, role: 'student', body: text };
    setMessages((prev) => [...prev, optimistic]);
    const saved = await saveMessage({ studentId: userId, senderId: userId, role: 'student', body: text });
    if (saved) {
      setMessages((prev) => prev.map((m) => (
        m.id === clientKey ? { ...saved, clientKey } : m
      )));
    }
    chanRef.current?.sendChat(saved || optimistic);
  }, [userId]);

  const notifyTyping = React.useCallback((on) => {
    chanRef.current?.sendTyping({ role: 'student', typing: !!on });
  }, []);

  return { messages, sendChat, peerTyping, notifyTyping, unread, peerOnline, teach };
}
