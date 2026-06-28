'use client';
import React from 'react';

// Desmos API key. The public demo key works for development; set
// NEXT_PUBLIC_DESMOS_API_KEY to your own (free for education) for production.
const DESMOS_KEY = process.env.NEXT_PUBLIC_DESMOS_API_KEY || 'dcb31709b452b1cf9dc26972add0fda6';

function loadDesmos() {
  if (window.Desmos) return Promise.resolve(window.Desmos);
  if (window.__desmosPromise) return window.__desmosPromise;
  window.__desmosPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_KEY}`;
    s.async = true;
    s.onload = () => resolve(window.Desmos);
    s.onerror = () => reject(new Error('Desmos failed to load'));
    document.head.appendChild(s);
  });
  return window.__desmosPromise;
}

const CALC_MIN_W = 320;
const CALC_MIN_H = 280;

// onClose: close handler. readOnly: tutor mirror (no input, state pushed in via
// `state`). onStateChange(stateJson): student-side change callback. onGeometry:
// reports {pos,size} so the tutor mirror can match position/size.
export default function DesmosPanel({ onClose, readOnly = false, state = null, onStateChange, onGeometry, pos: posProp, size: sizeProp }) {
  const ref = React.useRef(null);
  const calcRef = React.useRef(null);
  const [failed, setFailed] = React.useState(false);
  const [sizeState, setSizeState] = React.useState(sizeProp || { w: 460, h: 360 });
  const [posState, setPosState] = React.useState(posProp || { x: 18, y: 78 });
  // The read-only tutor mirror follows the student's broadcast position until the
  // tutor drags the panel; after that the tutor controls position locally so they
  // can move it aside to see behind it while the student's work keeps streaming in.
  const [tutorMoved, setTutorMoved] = React.useState(false);
  const pos = readOnly && posProp && !tutorMoved ? posProp : posState;
  const size = readOnly && sizeProp ? sizeProp : sizeState;

  // Resize the embedded calculator when the mirrored size changes.
  React.useEffect(() => {
    if (readOnly && calcRef.current) calcRef.current.resize();
  }, [readOnly, sizeProp?.w, sizeProp?.h]);

  React.useEffect(() => {
    let alive = true;
    loadDesmos()
      .then((Desmos) => {
        if (!alive || !ref.current) return;
        const calc = Desmos.GraphingCalculator(ref.current, { keypad: !readOnly, expressions: true, settingsMenu: false });
        calcRef.current = calc;
        if (readOnly && state) { try { calc.setState(state, { allowUndo: false }); } catch { /* ignore */ } }
        if (!readOnly && onStateChange) {
          calc.observeEvent('change', () => { try { onStateChange(calc.getState()); } catch { /* ignore */ } });
          try { onStateChange(calc.getState()); } catch { /* ignore */ }
        }
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (calcRef.current) calcRef.current.destroy();
      calcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply incoming state on the tutor side as it streams in.
  React.useEffect(() => {
    if (readOnly && calcRef.current && state) {
      try { calcRef.current.setState(state, { allowUndo: false }); } catch { /* ignore */ }
    }
  }, [readOnly, state]);

  const reportGeometry = () => { if (onGeometry) onGeometry({ pos, size }); };

  const onHeaderDown = (e) => {
    if (e.target.closest('button')) return; // let the close button work
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, orig = pos;
    // Tutor mirror: hand position control to the tutor from the current spot so
    // dragging starts where the panel sits and stops following the broadcast.
    if (readOnly) { setPosState(orig); setTutorMoved(true); }
    const move = (ev) => setPosState({ x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) });
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); reportGeometry(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const onResizeDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, orig = size;
    const move = (ev) => {
      setSizeState({ w: Math.max(CALC_MIN_W, orig.w + (ev.clientX - startX)), h: Math.max(CALC_MIN_H, orig.h + (ev.clientY - startY)) });
      if (calcRef.current) calcRef.current.resize();
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); reportGeometry(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div style={{
      position: 'absolute', left: pos.x, top: pos.y, width: size.w, height: size.h,
      background: 'var(--paper)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      zIndex: 25, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid var(--border-2)',
    }}>
      <div onMouseDown={onHeaderDown} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#2E7D32', color: '#fff', cursor: 'move', userSelect: 'none' }}>
        <span style={{ font: 'var(--role-label)', fontWeight: 600 }}>Desmos Graphing Calculator{readOnly ? ' (view only)' : ''}</span>
        {!readOnly && (
          <button onClick={onClose} style={{ width: 18, height: 18, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 12 }}>×</button>
        )}
      </div>
      {failed ? (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16, textAlign: 'center', font: 'var(--role-caption)', color: 'var(--text-secondary)' }}>
          Calculator couldn’t load. Check your connection.
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={ref} style={{ position: 'absolute', inset: 0 }} />
          {readOnly && <div style={{ position: 'absolute', inset: 0, zIndex: 2, cursor: 'not-allowed' }} />}
        </div>
      )}
      {!readOnly && (
        <div
          onMouseDown={onResizeDown}
          title="Drag to resize"
          style={{
            position: 'absolute', right: 0, bottom: 0, width: 18, height: 18,
            cursor: 'nwse-resize', zIndex: 1,
            background: 'linear-gradient(135deg, transparent 0 50%, var(--border-2) 50% 60%, transparent 60% 70%, var(--border-2) 70% 80%, transparent 80%)',
          }}
        />
      )}
    </div>
  );
}
