'use client';

import React from 'react';
import { decodePoint, regionPlacement, scrollRegionIntoView } from '@/lib/tutor/anchors';
import { useTeach } from '@/components/tutor/TeachContext';

// Paints teaching-mode ink and the laser dot over whatever question surface is
// on screen. One fixed canvas for the whole viewport: strokes are stored
// relative to content regions, so they're converted to pixels at paint time and
// therefore follow scrolling, resizing and layout differences for free.
//
// The canvas never takes pointer events. On the tutor's side a separate capture
// layer sits above it while a drawing tool is selected.

const TRAIL_MS = 550;
const LASER_R = 7;

export default function TeachLayer() {
  const teach = useTeach();
  const on = !!teach?.on;
  const isTutor = teach?.role === 'tutor';
  const drawing = isTutor && teach.tool !== 'laser';

  const canvasRef = React.useRef(null);
  const stateRef = React.useRef({ strokes: [], laser: null });
  const trailRef = React.useRef([]);

  // Hand the paint loop the latest ink without restarting it every render.
  React.useEffect(() => {
    stateRef.current = { strokes: teach?.strokes || [], laser: teach?.laser || null };
  });

  // Record laser positions for the fading tail. Region-relative, resolved later.
  const laser = teach?.laser || null;
  React.useEffect(() => {
    if (!laser) { trailRef.current = []; return; }
    trailRef.current = [...trailRef.current, { ...laser, t: performance.now() }].slice(-40);
  }, [laser]);

  React.useEffect(() => {
    if (!on) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;

    const frame = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const s of stateRef.current.strokes) paintStroke(ctx, s);
      paintLaser(ctx, stateRef.current.laser, trailRef.current);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  // Laser tool leaves the tutor fully interactive (scroll, click, switch views);
  // we just follow the real cursor at the document level.
  React.useEffect(() => {
    if (!on || !isTutor || drawing) return undefined;
    const move = (e) => teach.extendStroke(e);
    const out = (e) => { if (!e.relatedTarget) teach.leave(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerout', out);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', out);
    };
  }, [on, isTutor, drawing, teach]);

  if (!on) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40 }}
      />
      {drawing && <CaptureSurface teach={teach} />}
      {isTutor && teach.pendingText && <TextInput teach={teach} />}
      {!isTutor && <OffscreenHint strokes={teach.strokes} laser={teach.laser} />}
    </>
  );
}

// We deliberately don't yank the student's scroll position around. Instead, when
// the tutor marks up something they've scrolled past, offer a nudge they can
// take when they're ready.
function OffscreenHint({ strokes, laser }) {
  const [hint, setHint] = React.useState(null); // { dir, region }
  const ids = React.useMemo(() => {
    const set = new Set(strokes.map((s) => s.region));
    if (laser) set.add(laser.region);
    return [...set];
  }, [strokes, laser]);

  // Polled rather than measured during render: the answer depends on scrolling
  // and layout, which React doesn't tell us about.
  React.useEffect(() => {
    const check = () => {
      let found = null;
      for (const id of ids) {
        const where = regionPlacement(id);
        if (where === 'visible') { found = null; break; }
        if (where && !found) found = { dir: where, region: id };
      }
      setHint((prev) => (prev?.region === found?.region && prev?.dir === found?.dir ? prev : found));
    };
    const t = setInterval(check, 300);
    return () => clearInterval(t);
  }, [ids]);

  if (!hint) return null;
  const up = hint.dir === 'above';
  return (
    <button
      type="button"
      onClick={() => scrollRegionIntoView(hint.region)}
      style={{
        position: 'fixed', left: '50%', transform: 'translateX(-50%)',
        [up ? 'top' : 'bottom']: 64, zIndex: 71,
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px',
        background: 'var(--paper)', border: '1px solid #ff3b30', borderRadius: 999,
        boxShadow: 'var(--shadow-md)', cursor: 'pointer',
        font: 'var(--role-label)', color: 'var(--text-primary)',
      }}
    >
      {up ? '↑' : '↓'} Your tutor marked something {up ? 'above' : 'below'}
    </button>
  );
}

// Tutor-only input surface for pen / highlighter / text. Wheel is forwarded to
// whatever is under the cursor so passages stay scrollable while drawing.
function CaptureSurface({ teach }) {
  const onWheel = (e) => {
    const under = document.elementsFromPoint(e.clientX, e.clientY);
    const scroller = under.find((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const oy = getComputedStyle(el).overflowY;
      return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight;
    });
    if (scroller) scroller.scrollTop += e.deltaY;
  };

  return (
    <div
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); teach.beginStroke(e); }}
      onPointerMove={teach.extendStroke}
      onPointerUp={teach.endStroke}
      onPointerCancel={teach.endStroke}
      onPointerLeave={teach.leave}
      onWheel={onWheel}
      style={{
        position: 'fixed', inset: 0, zIndex: 41,
        cursor: teach.tool === 'text' ? 'text' : 'crosshair',
        touchAction: 'none',
      }}
    />
  );
}

// Small floating field anchored where the tutor clicked with the text tool.
function TextInput({ teach }) {
  const p = teach.pendingText;
  const pos = decodePoint(p.region, p.x, p.y);
  const [value, setValue] = React.useState('');
  if (!pos) return null;
  return (
    <input
      autoFocus
      value={value}
      maxLength={80}
      placeholder="Note…"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') teach.commitText(value);
        if (e.key === 'Escape') teach.setPendingText(null);
      }}
      onBlur={() => teach.commitText(value)}
      style={{
        position: 'fixed', left: pos.px, top: pos.py, zIndex: 42,
        font: 'var(--role-label)', color: teach.color,
        background: 'var(--paper)', border: `1.5px solid ${teach.color}`,
        borderRadius: 6, padding: '4px 8px', minWidth: 160, outline: 'none',
        boxShadow: 'var(--shadow-md)',
      }}
    />
  );
}

function paintStroke(ctx, s) {
  if (s.tool === 'text') return paintText(ctx, s);
  if (!s.pts || s.pts.length < 2) return;
  const first = decodePoint(s.region, s.pts[0], s.pts[1]);
  // Region gone (student closed the calculator, moved on) — drop the stroke
  // rather than painting it somewhere meaningless.
  if (!first) return;

  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = Math.max(1, (s.lw || 0.004) * first.width);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = s.tool === 'highlighter' ? 0.3 : 0.95;
  ctx.beginPath();
  ctx.moveTo(first.px, first.py);
  for (let i = 2; i < s.pts.length; i += 2) {
    const p = decodePoint(s.region, s.pts[i], s.pts[i + 1]);
    if (p) ctx.lineTo(p.px, p.py);
  }
  ctx.stroke();
  ctx.restore();
}

function paintText(ctx, s) {
  const pos = decodePoint(s.region, s.x, s.y);
  if (!pos || !s.text) return;
  const size = Math.max(11, (s.lw || 0.02) * pos.width);
  ctx.save();
  ctx.font = `600 ${size}px var(--font-sans, system-ui), system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  const w = ctx.measureText(s.text).width;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, pos.px - 5, pos.py - 4, w + 10, size + 8, 5);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = s.color;
  ctx.fillText(s.text, pos.px, pos.py);
  ctx.restore();
}

function paintLaser(ctx, laser, trail) {
  const now = performance.now();
  const live = trail.filter((p) => now - p.t < TRAIL_MS);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 1; i < live.length; i += 1) {
    const a = decodePoint(live[i - 1].region, live[i - 1].x, live[i - 1].y);
    const b = decodePoint(live[i].region, live[i].x, live[i].y);
    if (!a || !b) continue;
    const age = (now - live[i].t) / TRAIL_MS;
    ctx.globalAlpha = Math.max(0, 0.35 * (1 - age));
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = LASER_R * 0.9 * (1 - age) + 1;
    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.lineTo(b.px, b.py);
    ctx.stroke();
  }
  if (laser) {
    const p = decodePoint(laser.region, laser.x, laser.y);
    if (p) {
      const glow = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, LASER_R * 3);
      glow.addColorStop(0, 'rgba(255,59,48,0.55)');
      glow.addColorStop(1, 'rgba(255,59,48,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.px, p.py, LASER_R * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3b30';
      ctx.beginPath();
      ctx.arc(p.px, p.py, LASER_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(p.px - 1.5, p.py - 1.5, LASER_R * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
