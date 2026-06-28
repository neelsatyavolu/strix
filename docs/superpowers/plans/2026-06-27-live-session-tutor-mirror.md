# Live Session — Tutor's Read-Only Test Mirror — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give tutors a read-only "Live Session" view that mirrors a student's in-progress SAT test screen — highlights, strikethroughs, timer, flags, selected answer, and live Desmos state — looking exactly like the student's screen, with instant exit/return to stats.

**Architecture:** Build on the existing Supabase Realtime channel (`strix:student:${id}`). The student's test screen reports its local UI state up to `SixteenApp` via a new `LiveBroadcastContext`; `SixteenApp` folds it into the single live broadcast payload. A new read-only `LiveTestView` (Option A — composes the same primitive components as the student screens) rehydrates that payload. A "Live Session" sidebar tab appears while the watched student is active.

**Tech Stack:** Next.js App Router, React (JSX, `'use client'`), Supabase Realtime, Desmos GraphingCalculator API, CSS-in-JS design tokens.

## Global Constraints

- **No test framework exists.** Per-task verification gate is: `pnpm lint` && `pnpm exec tsc --noEmit` && `pnpm build` all pass, plus the manual browser check noted in the task. Do NOT add a test runner.
- **UI components are `.jsx`**, `lib/` is `.ts`/`.js`. Match the extension of the file being edited; do not convert JSX to TSX.
- **2-space indentation. `'use client'`** at top of client components. Functional components only. Immutable updates only (spread, no in-place mutation).
- **No Tailwind/Prettier.** Use existing CSS-in-JS + `var(--token)` design tokens.
- **Do not change the student's exam-taking behavior.** Student screens gain reporting side-effects only; their interaction logic is untouched.
- **No DB schema changes.** The mirror is ephemeral.
- **Commit only when the user asks** (global rule). Each task ends with a *suggested* commit the user can approve; do not push.

---

## File Structure

**New**
- `components/sixteen/session/LiveBroadcastContext.jsx` — context carrying a `report(partial)` callback from test screens up to `SixteenApp`.
- `components/tutor/LiveTestView.jsx` — read-only mirror screen (RW + Math branches) built from shared primitives.
- `components/sixteen/test/DesmosPanel.jsx` — Desmos panel extracted from `QuestionMath.jsx`, with `readOnly` + external-state props.
- `lib/tutor/throttle.js` — tiny leading+trailing throttle helper for high-frequency reports.

**Modified**
- `components/sixteen/SixteenApp.jsx` — `liveUi` state + throttled `report`; provide `LiveBroadcastContext`; fold `liveUi` into the `live` memo; add "Live Session" sidebar item + `live-session` route; remove the auto-hijack; swap `LiveQuestionView` → `LiveTestView`.
- `components/sixteen/screens/QuestionRW.jsx` — report UI snapshot via throttled effect.
- `components/sixteen/screens/QuestionMath.jsx` — report UI snapshot; use extracted `DesmosPanel` with `onStateChange`.

**Removed**
- `components/tutor/LiveQuestionView.jsx` — superseded by `LiveTestView`.

---

## Task 1: Live broadcast payload plumbing (producer bridge)

Creates the bridge from screen-local UI state into the single broadcaster, and the throttle helper. No visible behavior change yet (payload gains fields nothing reads).

**Files:**
- Create: `lib/tutor/throttle.js`
- Create: `components/sixteen/session/LiveBroadcastContext.jsx`
- Modify: `components/sixteen/SixteenApp.jsx` (imports; `live` memo ~`:90-107`; wrap screen render ~`:353-357`)

**Interfaces:**
- Produces: `throttle(fn, ms)` → throttled function with `.cancel()`.
- Produces: `LiveBroadcastProvider({ report, children })`, `useLiveBroadcast()` → `report` function (no-op default).
- Produces: live payload now also carries (when a screen reports them) `selected, flagged, type, marks, eliminated, annotateActive, seconds, timerRunning, sectionLabel, palette, calc`.

- [ ] **Step 1: Create the throttle helper**

`lib/tutor/throttle.js`:
```js
// Leading + trailing throttle. Calls fn immediately, then at most once per
// `ms`, always firing a trailing call with the latest args.
export function throttle(fn, ms) {
  let last = 0;
  let timer = null;
  let lastArgs = null;
  const invoke = (now, args) => { last = now; fn(...args); };
  const throttled = (...args) => {
    const now = Date.now();
    lastArgs = args;
    const remaining = ms - (now - last);
    if (remaining <= 0) {
      if (timer) { clearTimeout(timer); timer = null; }
      invoke(now, args);
    } else if (!timer) {
      timer = setTimeout(() => { timer = null; invoke(Date.now(), lastArgs); }, remaining);
    }
  };
  throttled.cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  return throttled;
}
```

- [ ] **Step 2: Create LiveBroadcastContext**

`components/sixteen/session/LiveBroadcastContext.jsx`:
```jsx
'use client';
import React from 'react';

// Bridges the active test screen's local UI state (highlights, strikethroughs,
// timer, calculator) up to SixteenApp, which folds it into the single live
// broadcast. `report(partial)` merges into the broadcast snapshot. Default is a
// no-op so screens render safely outside a broadcasting context.
const LiveBroadcastContext = React.createContext(() => {});

export function LiveBroadcastProvider({ report, children }) {
  return (
    <LiveBroadcastContext.Provider value={report || (() => {})}>
      {children}
    </LiveBroadcastContext.Provider>
  );
}

export function useLiveBroadcast() {
  return React.useContext(LiveBroadcastContext);
}
```

- [ ] **Step 3: Add `liveUi` state + `report` in SixteenApp and fold into the `live` memo**

In `components/sixteen/SixteenApp.jsx`, add imports near the other session imports (after line 29):
```jsx
import { LiveBroadcastProvider } from './session/LiveBroadcastContext';
```

Add state after `watchedStudentId` (after line 49):
```jsx
  // Latest UI snapshot reported by the active test screen (highlights, elim,
  // timer, calculator). Folded into the live broadcast below.
  const [liveUi, setLiveUi] = React.useState({});
  const report = React.useCallback((partial) => {
    setLiveUi((prev) => ({ ...prev, ...partial }));
  }, []);
```

Replace the `live` memo (lines 90-107) with:
```jsx
  const live = React.useMemo(() => {
    const q = sessionLive.current;
    if (sessionLive.status !== 'active' || !q) return { active: false };
    return {
      active: true,
      index: sessionLive.index,
      total: sessionLive.questions.length,
      section: q.section,
      domainLabel: q.domainLabel,
      stemHtml: q.stemHtml,
      stimulusHtml: q.stimulusHtml,
      choices: q.choices,
      selected: sessionLive.responses[q.id]?.value || null,
      // Rich mirror fields reported by the active screen (may be undefined until
      // the screen reports; consumers must tolerate missing keys).
      flagged: liveUi.flagged,
      type: liveUi.type,
      marks: liveUi.marks,
      eliminated: liveUi.eliminated,
      annotateActive: liveUi.annotateActive,
      seconds: liveUi.seconds,
      timerRunning: liveUi.timerRunning,
      sectionLabel: liveUi.sectionLabel,
      palette: liveUi.palette,
      calc: liveUi.calc,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLive.status, sessionLive.current, sessionLive.index, sessionLive.questions.length, sessionLive.responses, liveUi]);
```

- [ ] **Step 4: Wrap the screen render in the provider**

In `SixteenApp.jsx`, the `mainContent`/screen is rendered inside `AppShell` (around line 375-390). Wrap the screen so test screens can call `report`. Locate where `screen` is assigned to `mainContent` (line 353) and wrap the final rendered content. Concretely, change the `AppShell` children from `{mainContent}` to:
```jsx
        <LiveBroadcastProvider report={report}>
          {mainContent}
        </LiveBroadcastProvider>
```
(If `AppShell` is invoked as `<AppShell ...>{mainContent}</AppShell>`, replace `{mainContent}` with the wrapped version above.)

- [ ] **Step 5: Verify gate**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass. App behaves exactly as before (no consumer reads the new fields yet; `liveUi` stays `{}` so all new payload fields are `undefined`).

- [ ] **Step 6: Suggested commit**

```bash
git add lib/tutor/throttle.js components/sixteen/session/LiveBroadcastContext.jsx components/sixteen/SixteenApp.jsx
git commit -m "feat(tutor): live broadcast bridge for rich test-screen state"
```

---

## Task 2: Student RW screen reports its UI snapshot

`QuestionRW` reports highlights, eliminations, timer, flag, selection, and palette so a watching tutor can mirror them.

**Files:**
- Modify: `components/sixteen/screens/QuestionRW.jsx`

**Interfaces:**
- Consumes: `useLiveBroadcast()` → `report`.
- Produces: reported snapshot `{ type:'mcq', selected, flagged, marks, eliminated, annotateActive, seconds, timerRunning, sectionLabel, palette }`.

- [ ] **Step 1: Import the hook**

In `QuestionRW.jsx`, after line 9 (`usePracticeSession` import):
```jsx
import { useLiveBroadcast } from '@/components/sixteen/session/LiveBroadcastContext';
```

- [ ] **Step 2: Get `report` in the component**

After `const session = usePracticeSession();` (line 22):
```jsx
  const report = useLiveBroadcast();
```

- [ ] **Step 3: Report the snapshot via effect**

Add this effect AFTER the timer effects and AFTER `elim`/`marks`/`seconds`/`annotate` are declared, but it must compute `sectionLabel`/`palette` from values available at render. Place the effect just before the early returns (after line 56, before line 58). Note `q`, `resp`, `elimSet`, `items` are computed *after* the early returns, so report only the primitives the effect can see and recompute the rest inline:
```jsx
  React.useEffect(() => {
    const qq = session.current;
    if (session.status !== 'active' || !qq) return;
    const r = session.responses[qq.id] || {};
    const sectionLabel = session.activeModule?.label === 'Drill'
      ? 'Reading & Writing — Drill'
      : `Reading & Writing, ${session.activeModule?.label || 'Module 1'}`;
    const palette = session.questions.map((x, i) => ({
      answered: !!session.responses[x.id]?.value,
      flagged: !!session.responses[x.id]?.flagged,
      current: i === session.index,
    }));
    report({
      type: 'mcq',
      selected: r.value || null,
      flagged: !!r.flagged,
      marks: marks[qq.id] || null,
      eliminated: [...(elim[qq.id] || new Set())],
      annotateActive: annotate,
      seconds,
      timerRunning,
      sectionLabel,
      palette,
    });
  }, [report, session.status, session.current, session.index, session.responses, session.questions, session.activeModule, marks, elim, annotate, seconds, timerRunning]);
```

- [ ] **Step 4: Verify gate**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass.

- [ ] **Step 5: Manual check (single browser is enough here)**

`pnpm dev`, start an RW drill, open DevTools → Network → WS, confirm `session` broadcast frames now include `marks`/`eliminated`/`seconds`. (Full mirror verified in Task 6.)

- [ ] **Step 6: Suggested commit**

```bash
git add components/sixteen/screens/QuestionRW.jsx
git commit -m "feat(tutor): broadcast RW annotations, eliminations, timer, palette"
```

---

## Task 3: Extract `DesmosPanel`, add student-side state reporting

Move `DesmosPanel` out of `QuestionMath.jsx` into a reusable file with a `readOnly` mode and external-state props, and have the student report live calculator state.

**Files:**
- Create: `components/sixteen/test/DesmosPanel.jsx`
- Modify: `components/sixteen/screens/QuestionMath.jsx` (remove inline `DesmosPanel` def lines 337-426 and `loadDesmos`/`DESMOS_KEY`/`CALC_MIN_*` lines 316-335; import the new module; add reporting)

**Interfaces:**
- Consumes: `throttle` from `lib/tutor/throttle.js`.
- Produces: `DesmosPanel({ onClose, readOnly=false, state=null, onStateChange, onGeometry })`.
  - Student: pass `onStateChange(stateJson)` (fires on Desmos change, throttled by caller) and `onGeometry({pos,size})`.
  - Tutor: pass `readOnly` + `state` (applied via `setState`), `onClose` no-op.

- [ ] **Step 1: Create the extracted panel**

`components/sixteen/test/DesmosPanel.jsx` (moved verbatim from `QuestionMath.jsx:316-426`, plus `readOnly`/`state`/`onStateChange`/`onGeometry` wiring and a transparent overlay in read-only mode):
```jsx
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
  const [size, setSize] = React.useState(sizeProp || { w: 460, h: 360 });
  const [pos, setPos] = React.useState(posProp || { x: 18, y: 78 });

  // In read-only mode, follow externally supplied geometry.
  React.useEffect(() => { if (readOnly && posProp) setPos(posProp); }, [readOnly, posProp?.x, posProp?.y]);
  React.useEffect(() => { if (readOnly && sizeProp) { setSize(sizeProp); if (calcRef.current) calcRef.current.resize(); } }, [readOnly, sizeProp?.w, sizeProp?.h]);

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

  const report = () => { if (onGeometry) onGeometry({ pos, size }); };

  const onHeaderDown = (e) => {
    if (readOnly) return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, orig = pos;
    const move = (ev) => setPos({ x: orig.x + (ev.clientX - startX), y: orig.y + (ev.clientY - startY) });
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); report(); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  const onResizeDown = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY, orig = size;
    const move = (ev) => {
      setSize({ w: Math.max(CALC_MIN_W, orig.w + (ev.clientX - startX)), h: Math.max(CALC_MIN_H, orig.h + (ev.clientY - startY)) });
      if (calcRef.current) calcRef.current.resize();
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); report(); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  return (
    <div style={{
      position: 'absolute', left: pos.x, top: pos.y, width: size.w, height: size.h,
      background: 'var(--paper)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
      zIndex: 25, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: '1px solid var(--border-2)',
    }}>
      <div onMouseDown={onHeaderDown} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#2E7D32', color: '#fff', cursor: readOnly ? 'default' : 'move', userSelect: 'none' }}>
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
        <div onMouseDown={onResizeDown} title="Drag to resize" style={{
          position: 'absolute', right: 0, bottom: 0, width: 18, height: 18, cursor: 'nwse-resize', zIndex: 1,
          background: 'linear-gradient(135deg, transparent 0 50%, var(--border-2) 50% 60%, transparent 60% 70%, var(--border-2) 70% 80%, transparent 80%)',
        }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Remove the inline Desmos code from QuestionMath and import the module**

In `QuestionMath.jsx`: delete `DESMOS_KEY`, `loadDesmos`, `CALC_MIN_W/H` (lines 316-335) and the inline `function DesmosPanel(...)` (lines 337-426). Add import after line 8 (`ExitTest` import):
```jsx
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';
import { useLiveBroadcast } from '@/components/sixteen/session/LiveBroadcastContext';
import { throttle } from '@/lib/tutor/throttle';
```

- [ ] **Step 3: Wire student calc reporting + the report effect**

After `const session = usePracticeSession();` (line 23) add:
```jsx
  const report = useLiveBroadcast();
  const reportCalc = React.useMemo(() => throttle((state) => report({ calc: { open: true, state } }), 200), [report]);
```

Change the calculator render (line 219) from `{calcOpen && <DesmosPanel onClose={() => setCalcOpen(false)} />}` to:
```jsx
      {calcOpen && (
        <DesmosPanel
          onClose={() => { setCalcOpen(false); report({ calc: { open: false } }); }}
          onStateChange={reportCalc}
          onGeometry={({ pos, size }) => report({ calc: { open: true, pos, size } })}
        />
      )}
```

Add the snapshot report effect before the early returns (after line 59, before line 76), mirroring Task 2 but with Math specifics:
```jsx
  React.useEffect(() => {
    const qq = session.current;
    if (session.status !== 'active' || !qq) return;
    const r = session.responses[qq.id] || {};
    const sectionLabel = session.activeModule?.label === 'Drill'
      ? 'Math — Drill'
      : `Math, ${session.activeModule?.label || 'Module 1'}`;
    const palette = session.questions.map((x, i) => ({
      answered: !!session.responses[x.id]?.value,
      flagged: !!session.responses[x.id]?.flagged,
      current: i === session.index,
    }));
    report({
      type: qq.type === 'spr' ? 'spr' : 'mcq',
      selected: r.value || null,
      flagged: !!r.flagged,
      marks: marks[qq.id] || null,
      eliminated: [...(elim[qq.id] || new Set())],
      annotateActive: annotate,
      seconds,
      timerRunning,
      sectionLabel,
      palette,
    });
  }, [report, session.status, session.current, session.index, session.responses, session.questions, session.activeModule, marks, elim, annotate, seconds, timerRunning]);
```

- [ ] **Step 4: Verify gate**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass. Manually confirm (`pnpm dev`) the student's Desmos calculator still opens, computes, drags, and resizes exactly as before.

- [ ] **Step 5: Suggested commit**

```bash
git add components/sixteen/test/DesmosPanel.jsx components/sixteen/screens/QuestionMath.jsx
git commit -m "feat(tutor): extract DesmosPanel, broadcast Math UI + live calc state"
```

---

## Task 4: Build `LiveTestView` (read-only mirror)

The tutor-facing screen. Composes the same primitives as the student screens, fed entirely by the `live` payload, all interaction disabled.

**Files:**
- Create: `components/tutor/LiveTestView.jsx`

**Interfaces:**
- Consumes: `live` payload fields from Task 1; `DesmosPanel` (readOnly) from Task 3; primitives from `@/components/sixteen` (`TestHeader, DirectionsBar, Timer, TestFooter, OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge`); `Highlightable` from `@/components/sixteen/test/Highlightable`.
- Produces: `default export LiveTestView({ live, studentName })`.

- [ ] **Step 1: Create the component**

`components/tutor/LiveTestView.jsx`:
```jsx
'use client';
import React from 'react';
import * as SixteenNS from '@/components/sixteen';
import Highlightable from '@/components/sixteen/test/Highlightable';
import DesmosPanel from '@/components/sixteen/test/DesmosPanel';

const NOOP = () => {};

// Read-only mirror of a watched student's exact test screen. Driven entirely by
// the live broadcast payload; every interaction is disabled.
export default function LiveTestView({ live, studentName = 'your student' }) {
  const {
    TestHeader, DirectionsBar, Timer, TestFooter,
    OptionRow, QuestionPalette, FlagButton, QuestionNumberBadge,
  } = SixteenNS;
  const first = String(studentName).split(' ')[0];
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  if (!live || live.active === false) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--test-canvas)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: 360 }}>
          <div style={{ font: 'var(--role-title-sm)', marginBottom: 6 }}>{first} isn’t in a section right now</div>
          <div style={{ font: 'var(--role-caption)', color: 'var(--text-tertiary)' }}>This view will fill in the moment they start a module.</div>
        </div>
      </div>
    );
  }

  const isMath = live.section === 'math';
  const sectionLabel = live.sectionLabel || (isMath ? 'Math' : 'Reading & Writing');
  const elimSet = new Set(live.eliminated || []);
  const palette = live.palette || [];
  const items = palette.map((p, i) => ({
    n: i + 1,
    status: p.current ? 'current' : p.answered ? 'answered' : 'unanswered',
    marked: !!p.flagged,
    onClick: NOOP,
  }));
  const calc = live.calc;

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--test-canvas)' }}>
      <TestHeader
        sectionLabel={sectionLabel}
        timer={live.timerRunning === false || live.seconds == null ? null : <Timer seconds={live.seconds} hidden={false} onToggleHide={NOOP} />}
        tools={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#fff', font: 'var(--role-caption)', paddingRight: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          Watching {first} · read-only
        </span>}
      />
      <DirectionsBar onDirections={NOOP} />

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: (!isMath && live.stimulusHtml) ? '1fr 1px 1fr' : '1fr', overflow: 'hidden' }}>
        {!isMath && live.stimulusHtml && (
          <>
            <div style={{ overflow: 'auto', padding: '36px 56px 48px' }}>
              <Highlightable className="cb-passage" html={live.stimulusHtml} active={false} value={live.marks?.passage} onChange={NOOP} />
            </div>
            <div style={{ background: 'var(--test-divider)' }} />
          </>
        )}
        <div style={{ overflow: 'auto', padding: isMath ? '32px 24px 48px' : '24px 56px 48px', position: 'relative' }}>
          <div style={{ maxWidth: isMath ? 760 : undefined, margin: isMath ? '0 auto' : undefined }}>
            <QuestionNumberBadge
              n={(live.index ?? 0) + 1}
              flag={<FlagButton marked={!!live.flagged} onClick={NOOP} />}
            />
            <Highlightable className="cb-stem" html={live.stemHtml} active={false} value={live.marks?.stem} onChange={NOOP} />

            {live.type === 'spr' ? (
              <div style={{ marginTop: 24, maxWidth: 320 }}>
                <label style={{ display: 'block', font: 'var(--role-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-tertiary)', marginBottom: 8 }}>Student’s answer</label>
                <div style={{ width: '100%', padding: '12px 14px', font: 'var(--role-title-sm)', fontFamily: 'var(--font-mono)', color: 'var(--test-ink)', background: 'var(--test-canvas)', border: '2px solid var(--border-2)', borderRadius: 'var(--radius-md)', minHeight: 22 }}>
                  {live.selected || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                {(live.choices || []).map((o) => (
                  <OptionRow
                    key={o.letter}
                    letter={o.letter}
                    selected={live.selected === o.letter}
                    eliminated={elimSet.has(o.letter)}
                    showEliminator={elimSet.size > 0}
                    onSelect={NOOP}
                    onToggleEliminate={NOOP}
                  >
                    <span className="cb-choice" dangerouslySetInnerHTML={{ __html: o.html }} />
                  </OptionRow>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMath && calc?.open && <DesmosPanel readOnly state={calc.state} pos={calc.pos} size={calc.size} onClose={NOOP} />}

      {paletteOpen && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--test-footer-height) + 12px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <QuestionPalette items={items} title={sectionLabel} onSelect={NOOP} onReviewAll={NOOP} />
        </div>
      )}
      {paletteOpen && <div onClick={() => setPaletteOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.10)', zIndex: 10 }} />}

      <TestFooter
        studentName={studentName}
        current={(live.index ?? 0) + 1}
        total={live.total}
        onPalette={() => setPaletteOpen((o) => !o)}
        paletteOpen={paletteOpen}
        onBack={NOOP}
        onNext={NOOP}
        nextDisabled
        nextLabel="—"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify gate**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass. (Not yet routed; visual check happens in Task 5/6.)

- [ ] **Step 3: Suggested commit**

```bash
git add components/tutor/LiveTestView.jsx
git commit -m "feat(tutor): read-only LiveTestView mirroring the exact test screen"
```

---

## Task 5: Navigation — Live Session tab, route, remove auto-hijack

Surface `LiveTestView` as a sidebar tab that appears while the watched student is active; let the tutor leave and return freely.

**Files:**
- Modify: `components/sixteen/SixteenApp.jsx` (import swap; sidebar items ~`:200-222`; `onSelect` ~`:228-240`; view switch ~`:320-341`; `mainContent` ~`:353-357`; auto-select effect)

**Interfaces:**
- Consumes: `LiveTestView` (Task 4); existing `watchedIsLive`, `tutorWatch.watchedLive`, `watchedName`, `go`, `view`.

- [ ] **Step 1: Swap the import**

In `SixteenApp.jsx` line 26, replace:
```jsx
import LiveQuestionView from '@/components/tutor/LiveQuestionView';
```
with:
```jsx
import LiveTestView from '@/components/tutor/LiveTestView';
```

- [ ] **Step 2: Add the conditional "Live Session" sidebar item**

In the `sidebarItems` construction (the array ending ~line 221, before the Dev push at line 222), add — after the array is built but using the same pattern — a conditional unshift so it pins to the top when the watched student is live:
```jsx
  if (isTutor && watchedIsLive) {
    sidebarItems.unshift({ id: 'live-session', label: 'Live Session', icon: I('radio'), group: 'Live', live: true });
  }
```
(Place this immediately after the existing `sidebarItems` array literal and before `if (devEnabled) ...`. `isTutor` is the existing role flag; if the local name differs, use `role === 'tutor'`.)

- [ ] **Step 3: Route the sidebar selection**

In the `onSelect` handler (lines 228-240), add a branch:
```jsx
        else if (id === 'live-session') go('live-session');
```

- [ ] **Step 4: Add the view case**

In the `switch (view)` block (lines 320-341), add:
```jsx
    case 'live-session': screen = <LiveTestView live={tutorWatch.watchedLive} studentName={watchedName} />; break;
```

- [ ] **Step 5: Remove the auto-hijack**

Replace the tutor `mainContent` block (lines 353-357):
```jsx
  let mainContent = screen;
  if (isTutor) {
    if (!watchedStudentId) mainContent = <PickStudentPrompt students={students} onPick={setWatchedStudentId} />;
    else if (watchedIsLive) mainContent = <LiveQuestionView live={tutorWatch.watchedLive} studentName={watchedName} />;
  }
```
with:
```jsx
  let mainContent = screen;
  if (isTutor && !watchedStudentId && view !== 'tutor-invite' && view !== 'settings') {
    mainContent = <PickStudentPrompt students={students} onPick={setWatchedStudentId} />;
  }
```
(The live view is now a normal routed screen, not an override. Stats/Dashboard stay browsable while the student practices.)

- [ ] **Step 6: Auto-open Live Session the first time a watched student goes live**

Add an effect after `watchedIsLive` is defined (after line 114):
```jsx
  const wasLive = React.useRef(false);
  React.useEffect(() => {
    if (watchedIsLive && !wasLive.current) { wasLive.current = true; setView('live-session'); }
    if (!watchedIsLive) {
      wasLive.current = false;
      setView((v) => (v === 'live-session' ? 'dashboard' : v));
    }
  }, [watchedIsLive]);
```

- [ ] **Step 7: Verify gate**

Run:
```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass. Confirm no remaining references to `LiveQuestionView` (`grep -rn LiveQuestionView components/` returns only the file itself).

- [ ] **Step 8: Suggested commit**

```bash
git add components/sixteen/SixteenApp.jsx
git commit -m "feat(tutor): Live Session sidebar tab with free exit/return"
```

---

## Task 6: End-to-end verification + remove dead `LiveQuestionView`

**Files:**
- Remove: `components/tutor/LiveQuestionView.jsx`

- [ ] **Step 1: Delete the superseded component**

```bash
git rm components/tutor/LiveQuestionView.jsx
```

- [ ] **Step 2: Full verify gate**

```bash
pnpm lint && pnpm exec tsc --noEmit && pnpm build
```
Expected: all pass, no references to the deleted file.

- [ ] **Step 3: Two-browser manual verification**

With `pnpm dev`, sign in as a student in one browser and a tutor (who that student added) in another:
1. Student starts an RW drill → tutor sees the "Live Session" tab appear (top of sidebar) and auto-opens to the mirrored question, selected answer, and live timer.
2. Student highlights passage text + crosses out a choice → both appear on the tutor's mirror within ~1s.
3. Student flags a question and opens the palette → tutor's flag + palette status reflect it.
4. Math section: student opens Desmos, types `y = 2x + 1` → tutor's read-only Desmos shows the same expression/graph and cannot be edited.
5. Tutor clicks Stats, browses, clicks Live Session again → mirror resumes instantly (no reload).
6. Student finishes the module → tab shows the idle state, then the tutor is dropped back to Dashboard.

- [ ] **Step 4: Suggested commit**

```bash
git add -A
git commit -m "chore(tutor): remove superseded LiveQuestionView"
```

---

## Self-Review notes

- **Spec coverage:** full-fidelity annotations/strikethroughs (Tasks 2/3 report `marks`/`eliminated`; Task 4 renders via `Highlightable active={false}` + `OptionRow eliminated`), live Desmos (Task 3 student `observeEvent` + Task 4 read-only `setState`), timer/flag/selected/palette (Tasks 2/3 → Task 4), sidebar tab + remove hijack + instant return (Task 5), idle/disconnect/no-student edge states (Task 4 idle block + Task 5 PickStudentPrompt). All covered.
- **Type consistency:** payload keys (`selected, flagged, type, marks, eliminated, annotateActive, seconds, timerRunning, sectionLabel, palette, calc`) are written identically in Task 1 memo, reported in Tasks 2/3, and read in Task 4. `calc` shape `{ open, state, pos, size }` consistent across Task 3 (produce) and Task 4 (consume). `DesmosPanel` prop names (`readOnly, state, pos, size, onClose, onStateChange, onGeometry`) consistent across Tasks 3/4.
- **Risk:** Student exam screens are modified only by additive reporting effects + the Desmos extraction (behavior-preserving move). No interaction logic changed.
