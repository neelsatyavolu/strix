'use client';

import React from 'react';
import { throttle } from '@/lib/tutor/throttle';
import { encodePoint, regionWidth } from '@/lib/tutor/anchors';

// Teaching mode state for both ends of the channel.
//
//   useTeachTutor   — owns the tools, captures pointer input, broadcasts.
//   useTeachStudent — receives, holds what should be painted.
//
// Ink lives in memory only, keyed to a `scope` (the live question id while
// practicing, the session id while reviewing). A scope change wipes it; nothing
// is ever written to the database.

export const TEACH_TOOLS = ['laser', 'pen', 'highlighter', 'text'];
export const TEACH_COLORS = ['#ff3b30', '#ffb020', '#22c55e', '#3b82f6'];

const POINT_MS = 33;          // ~30 Hz laser stream
const INK_FLUSH_MS = 80;      // stroke deltas while the pointer is down
const LASER_IDLE_MS = 1200;   // drop the dot once the tutor stops moving
const PEN_PX = 2.5;
const HIGHLIGHTER_PX = 15;
const TEXT_PX = 15;
const MAX_TEXT = 80;

// Stroke weights travel in region-width units so they scale with the geometry.
function toUnits(px, region) {
  const w = regionWidth(region);
  return w ? px / w : 0;
}

function appendInk(strokes, msg) {
  const i = strokes.findIndex((s) => s.id === msg.id);
  if (i === -1) {
    return [...strokes, {
      id: msg.id,
      region: msg.region,
      tool: msg.tool,
      color: msg.color,
      lw: msg.lw,
      x: msg.x,
      y: msg.y,
      text: msg.text,
      pts: msg.pts ? [...msg.pts] : [],
    }];
  }
  const cur = strokes[i];
  const next = {
    ...cur,
    text: msg.text ?? cur.text,
    pts: msg.pts ? [...cur.pts, ...msg.pts] : cur.pts,
  };
  return [...strokes.slice(0, i), next, ...strokes.slice(i + 1)];
}

/**
 * Tutor side.
 * @param {{ send: { sendTeach: Function, sendPoint: Function, sendInk: Function } | null,
 *           scope: string | null }} opts
 */
export function useTeachTutor({ send, scope }) {
  const [on, setOn] = React.useState(false);
  const [tool, setTool] = React.useState('laser');
  const [color, setColor] = React.useState(TEACH_COLORS[0]);
  const [strokes, setStrokes] = React.useState([]);
  const [laser, setLaser] = React.useState(null);
  const [pendingText, setPendingText] = React.useState(null);

  const sendRef = React.useRef(send);
  const scopeRef = React.useRef(scope);
  const onRef = React.useRef(on);
  const toolRef = React.useRef(tool);
  const colorRef = React.useRef(color);
  React.useEffect(() => { sendRef.current = send; }, [send]);
  React.useEffect(() => { scopeRef.current = scope; }, [scope]);
  React.useEffect(() => { onRef.current = on; }, [on]);
  React.useEffect(() => { toolRef.current = tool; }, [tool]);
  React.useEffect(() => { colorRef.current = color; }, [color]);

  // Live stroke being drawn: { id, region, buffer: [x, y, …] }
  const drawRef = React.useRef(null);
  const flushTimerRef = React.useRef(null);
  const seqRef = React.useRef(0);

  // Built in an effect (not useMemo) so the throttled closure never reads a ref
  // during render.
  const pushPointRef = React.useRef(null);
  React.useEffect(() => {
    const send = throttle((p) => {
      sendRef.current?.sendPoint?.({ scope: scopeRef.current, p });
    }, POINT_MS);
    pushPointRef.current = send;
    return () => { send.cancel(); pushPointRef.current = null; };
  }, []);

  const flushInk = React.useCallback(() => {
    const d = drawRef.current;
    if (!d || !d.buffer.length) return;
    const pts = d.buffer;
    d.buffer = [];
    sendRef.current?.sendInk?.({
      scope: scopeRef.current,
      id: d.id,
      region: d.region,
      tool: d.tool,
      color: d.color,
      lw: d.lw,
      pts,
    });
  }, []);

  const stopDrawing = React.useCallback(() => {
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushInk();
    drawRef.current = null;
  }, [flushInk]);

  // Broadcast tool/on changes so the student's chip and cursor stay in step.
  React.useEffect(() => {
    if (!send) return;
    send.sendTeach?.({ kind: 'state', on, tool, color, scope });
  }, [send, on, tool, color, scope]);

  // A new question (or a new reviewed session) wipes the board, and so does
  // flipping teaching mode. The reset is part of the same side effect that tells
  // the student to clear, so it belongs in the effect rather than in render.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStrokes([]);
    setPendingText(null);
    setLaser(null);
    sendRef.current?.sendTeach?.({ kind: 'clear', scope });
  }, [scope, on]);

  React.useEffect(() => () => {
    if (flushTimerRef.current) clearInterval(flushTimerRef.current);
  }, []);

  const beginStroke = React.useCallback((e) => {
    const pt = encodePoint(e.clientX, e.clientY);
    if (!pt) return;
    const t = toolRef.current;
    if (t === 'laser') return;
    if (t === 'text') {
      setPendingText({ region: pt.region, x: pt.x, y: pt.y, value: '' });
      return;
    }
    seqRef.current += 1;
    const id = `${seqRef.current}-${e.pointerId}`;
    const lw = toUnits(t === 'highlighter' ? HIGHLIGHTER_PX : PEN_PX, pt.region);
    drawRef.current = { id, region: pt.region, tool: t, color: colorRef.current, lw, buffer: [pt.x, pt.y] };
    setStrokes((prev) => [...prev, { id, region: pt.region, tool: t, color: colorRef.current, lw, pts: [pt.x, pt.y] }]);
    flushTimerRef.current = setInterval(flushInk, INK_FLUSH_MS);
  }, [flushInk]);

  const extendStroke = React.useCallback((e) => {
    const pt = encodePoint(e.clientX, e.clientY);
    if (pt) {
      setLaser(pt);
      pushPointRef.current?.(pt);
    }
    const d = drawRef.current;
    // Points outside the stroke's own region are ignored — a stroke belongs to
    // exactly one anchor, otherwise it can't be positioned on the other side.
    if (!d || !pt || pt.region !== d.region) return;
    d.buffer.push(pt.x, pt.y);
    setStrokes((prev) => prev.map((s) => (
      s.id === d.id ? { ...s, pts: [...s.pts, pt.x, pt.y] } : s
    )));
  }, []);

  const endStroke = React.useCallback(() => { stopDrawing(); }, [stopDrawing]);

  const leave = React.useCallback(() => {
    stopDrawing();
    setLaser(null);
    sendRef.current?.sendPoint?.({ scope: scopeRef.current, p: null });
  }, [stopDrawing]);

  const commitText = React.useCallback((value) => {
    const p = pendingText;
    setPendingText(null);
    const text = String(value || '').trim().slice(0, MAX_TEXT);
    if (!p || !text) return;
    seqRef.current += 1;
    const id = `t${seqRef.current}`;
    const stroke = {
      id, region: p.region, tool: 'text', color: colorRef.current,
      lw: toUnits(TEXT_PX, p.region), x: p.x, y: p.y, text, pts: [],
    };
    setStrokes((prev) => [...prev, stroke]);
    sendRef.current?.sendInk?.({ scope: scopeRef.current, ...stroke });
  }, [pendingText]);

  const undo = React.useCallback(() => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      sendRef.current?.sendTeach?.({ kind: 'undo', scope: scopeRef.current, id: last.id });
      return prev.slice(0, -1);
    });
  }, []);

  const clear = React.useCallback(() => {
    setStrokes([]);
    setPendingText(null);
    sendRef.current?.sendTeach?.({ kind: 'clear', scope: scopeRef.current });
  }, []);

  // Ask the student's review screen to scroll to a question. Only meaningful
  // while teaching mode is on — outside it the tutor can't move the student.
  const gotoQuestion = React.useCallback((qid) => {
    if (!onRef.current || !qid) return;
    sendRef.current?.sendTeach?.({ kind: 'goto', scope: scopeRef.current, qid });
  }, []);

  // Replay for a student who just (re)connected mid-lesson.
  const resync = React.useCallback(() => {
    const s = sendRef.current;
    if (!s || !onRef.current) return;
    s.sendTeach?.({ kind: 'state', on: true, tool: toolRef.current, color: colorRef.current, scope: scopeRef.current });
    for (const stroke of strokes) {
      s.sendInk?.({ scope: scopeRef.current, ...stroke });
    }
  }, [strokes]);

  return {
    role: 'tutor',
    on, setOn, tool, setTool, color, setColor,
    strokes, laser, pendingText, setPendingText,
    beginStroke, extendStroke, endStroke, leave, commitText,
    undo, clear, gotoQuestion, resync,
    canTeach: !!send,
  };
}

/** Student side: receives and holds what should be painted. */
export function useTeachStudent() {
  const [on, setOn] = React.useState(false);
  const [strokes, setStrokes] = React.useState([]);
  const [laser, setLaser] = React.useState(null);
  const [goto, setGoto] = React.useState(null); // { qid, n } — n forces re-scroll
  const scopeRef = React.useRef(null);
  const laserTimerRef = React.useRef(null);
  const gotoSeqRef = React.useRef(0);

  React.useEffect(() => () => { if (laserTimerRef.current) clearTimeout(laserTimerRef.current); }, []);

  // Anything from a different scope than the last thing we painted means the
  // lesson moved on — drop the old ink rather than letting it bleed through.
  const syncScope = React.useCallback((scope) => {
    if (scopeRef.current === scope) return;
    scopeRef.current = scope;
    setStrokes([]);
    setLaser(null);
  }, []);

  const onTeach = React.useCallback((m) => {
    if (!m) return;
    if (m.kind === 'state') {
      syncScope(m.scope);
      setOn(!!m.on);
      if (!m.on) { setStrokes([]); setLaser(null); }
      return;
    }
    if (m.kind === 'clear') {
      syncScope(m.scope);
      setStrokes([]);
      setLaser(null);
      return;
    }
    if (m.kind === 'undo') {
      setStrokes((prev) => prev.filter((s) => s.id !== m.id));
      return;
    }
    if (m.kind === 'goto' && m.qid) {
      gotoSeqRef.current += 1;
      setGoto({ qid: m.qid, n: gotoSeqRef.current });
    }
  }, [syncScope]);

  const onPoint = React.useCallback((m) => {
    if (!m) return;
    syncScope(m.scope);
    if (laserTimerRef.current) clearTimeout(laserTimerRef.current);
    if (!m.p) { setLaser(null); return; }
    setLaser(m.p);
    laserTimerRef.current = setTimeout(() => setLaser(null), LASER_IDLE_MS);
  }, [syncScope]);

  const onInk = React.useCallback((m) => {
    if (!m?.id) return;
    syncScope(m.scope);
    setStrokes((prev) => appendInk(prev, m));
  }, [syncScope]);

  return { role: 'student', on, strokes, laser, goto, onTeach, onPoint, onInk };
}
