'use client';

import { createClient } from '@/lib/supabase/client';

// Live tutoring over Supabase Realtime. Broadcast carries ephemeral session
// state (what question the student is on) + instant chat; tutor_messages
// persists the chat history (RLS lets the student + their active tutor read/write).

/**
 * @param {{
 *   studentId: string,
 *   userId?: string,
 *   role: string,
 *   onChat?: Function,
 *   onSession?: Function,
 *   onPresence?: Function,
 *   onTyping?: Function,
 *   onTeach?: Function,
 *   onPoint?: Function,
 *   onInk?: Function,
 *   onSubscribed?: Function,
 * }} opts
 */
export function openTutorChannel(opts) {
  const { studentId, userId, role } = opts;
  const onChat = opts.onChat || (() => {});
  const onSession = opts.onSession || (() => {});
  const onPresence = opts.onPresence || (() => {});
  const onTyping = opts.onTyping || (() => {});
  const onTeach = opts.onTeach || (() => {});
  const onPoint = opts.onPoint || (() => {});
  const onInk = opts.onInk || (() => {});
  const onSubscribed = opts.onSubscribed || (() => {});
  const supabase = createClient();
  const channel = supabase.channel(`strix:student:${studentId}`, {
    config: { broadcast: { self: false }, presence: { key: userId || role } },
  });

  let presenceMeta = { role };

  channel.on('broadcast', { event: 'chat' }, ({ payload }) => onChat?.(payload));
  channel.on('broadcast', { event: 'session' }, ({ payload }) => onSession?.(payload));
  channel.on('broadcast', { event: 'typing' }, ({ payload }) => onTyping?.(payload));
  // Teaching mode (tutor -> student). Deliberately three separate events, kept
  // off `session`: a burst of pointer/stroke traffic must never grow the
  // question snapshot, which Realtime silently drops when it gets too big.
  channel.on('broadcast', { event: 'teach' }, ({ payload }) => onTeach?.(payload));
  channel.on('broadcast', { event: 'point' }, ({ payload }) => onPoint?.(payload));
  channel.on('broadcast', { event: 'ink' }, ({ payload }) => onInk?.(payload));
  channel.on('presence', { event: 'sync' }, () => onPresence?.(channel.presenceState()));

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.track({ ...presenceMeta, at: Date.now() });
      onSubscribed?.();
    }
  });

  return {
    sendChat: (payload) => channel.send({ type: 'broadcast', event: 'chat', payload }),
    sendSession: (payload) => channel.send({ type: 'broadcast', event: 'session', payload }),
    // Ephemeral "is typing" ping ({ role, typing }) — never persisted.
    sendTyping: (payload) => channel.send({ type: 'broadcast', event: 'typing', payload }),
    // Teaching mode: control ({ kind, ... }), laser position, stroke deltas.
    sendTeach: (payload) => channel.send({ type: 'broadcast', event: 'teach', payload }),
    sendPoint: (payload) => channel.send({ type: 'broadcast', event: 'point', payload }),
    sendInk: (payload) => channel.send({ type: 'broadcast', event: 'ink', payload }),
    // Update this client's presence meta (e.g. the student's live session state),
    // so tutors who join later see it on the next presence sync.
    track: (meta) => { presenceMeta = { role, ...meta }; return channel.track({ ...presenceMeta, at: Date.now() }); },
    close: () => supabase.removeChannel(channel),
  };
}

export async function loadMessages(studentId) {
  const supabase = createClient();
  const { data } = await supabase
    .from('tutor_messages')
    .select('id, sender_id, role, body, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })
    .limit(200);
  return data || [];
}

export async function saveMessage({ studentId, senderId, role, body }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tutor_messages')
    .insert({ student_id: studentId, sender_id: senderId, role, body })
    .select('id, sender_id, role, body, created_at')
    .single();
  if (error) return null;
  return data;
}
