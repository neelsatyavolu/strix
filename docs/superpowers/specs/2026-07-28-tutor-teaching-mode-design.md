# Tutor Teaching Mode — Design

Date: 2026-07-28
Status: Approved for planning

## Problem

A tutor watching a live session can see exactly what their student is doing, but
can only talk about it — "look at the second sentence of the third paragraph".
There is no way to point at something, circle it, or draw on it. The same gap
exists when reviewing a completed section together.

## Goal

Teaching mode: a tutor-toggled overlay that puts the tutor's cursor on the
student's screen as a laser pointer, and lets the tutor draw, highlight, and
label directly on the question the student is looking at. Ink clears when the
question changes. Works both during live practice and while reviewing a
completed section.

## Non-goals

- Student-to-tutor annotation (one direction only: tutor draws, student sees).
- Persisting annotations to the database or across sessions.
- Screen sharing / video. This is a semantic overlay, not a pixel mirror.
- Teaching mode on non-question screens (dashboard, stats, question bank).

## Key constraint driving the design

The tutor's `LiveTestView` is a **reconstruction** of the student's screen from a
broadcast payload — a different DOM with different widths, column layout, padding
and independent scroll position. It is not a pixel mirror. Raw screen coordinates
therefore cannot be shared: a circle drawn at (620, 410) on the tutor's screen
lands somewhere unrelated on the student's.

## Architecture

### 1. Coordinate model — region anchoring

New module `lib/tutor/anchors.js`.

Every annotatable box on both sides is wrapped in a `TeachRegion` with a stable
id. Regions:

| id           | Live practice                | Completed review              |
| ------------ | ---------------------------- | ----------------------------- |
| `passage`    | RW stimulus column           | same                          |
| `stem`       | question stem                | same                          |
| `choice-A`…`choice-D` | each `OptionRow`    | same                          |
| `spr`        | grid-in answer box           | student answer + key block    |
| `calc`       | Desmos panel                 | n/a                           |

A point is stored as:

```js
{ region: 'stem', x: 0.62, y: 0.31 }
// x = (clientX - rect.left) / rect.width
// y = (clientY - rect.top)  / rect.width   <-- width, deliberately
```

Dividing **both** axes by the region's width preserves aspect ratio, so a circle
drawn on the tutor's narrow panel renders as a circle (not an ellipse) inside the
student's wider stem box. Reconstruction on the receiver is
`px = left + x * width`, `py = top + y * width`.

Consequences:

- Independent scroll is free — the region's rect moves with the scroll, the
  stroke moves with it.
- If the receiver has no region with that id (e.g. tutor annotates `calc` and the
  student closed Desmos), the stroke is **dropped**, never misplaced.
- Text reflow is tolerated but not corrected: a circle around a word that wraps
  differently will be near, not exactly on, that word. Accepted tradeoff — the
  alternative (text-range anchoring) is a much larger build.

### 2. Transport

New broadcast events on the existing `strix:student:<id>` channel, added to
`lib/tutor/realtime.js` alongside `chat` / `session` / `typing`. They are
deliberately **separate events** from `session`: a burst of stroke traffic must
never contribute to the payload-size failure that drops a question snapshot.

| event   | direction      | payload                                                              | rate |
| ------- | -------------- | -------------------------------------------------------------------- | ---- |
| `teach` | tutor → student | `{ on, tool, color, qid }`, plus commands `{ clear }`, `{ undo, strokeId }`, `{ goto: { sessionId, qid, index } }` | on change |
| `point` | tutor → student | `{ qid, region, x, y }` or `{ qid, off: true }`                       | ~30 Hz, throttled |
| `ink`   | tutor → student | `{ qid, strokeId, region, tool, color, pts: [[x,y], …], done? }`      | batched while drawing |

- `point` uses the existing `lib/tutor/throttle.js` (coalesce to one send per
  animation frame, capped at 30 Hz).
- `ink` batches points and flushes every ~80 ms while the pointer is down, with a
  final `done: true` flush on pointer up. Each flush carries only the points
  added since the last flush; the receiver appends.
- Every payload carries `qid`. The receiver drops anything whose `qid` does not
  match the question currently on screen. This is what makes "clears on question
  change" correct even under out-of-order delivery.
- Teaching state is re-announced on `onSubscribed` and when a tutor rejoins, the
  same way `pushLive(true)` works today — including a full replay of current
  strokes so a reconnecting student does not lose the drawing.

### 3. Rendering — `components/tutor/TeachLayer.jsx`

One absolutely-positioned SVG overlay per region, sized to that region's rect,
re-measured on resize/scroll via `ResizeObserver` + a scroll listener on the
scrolling ancestor.

- **Student side:** `pointer-events: none` on every layer. The student must be
  able to keep answering, highlighting, and scrolling while the tutor draws.
- **Tutor side:** the topmost layer captures pointer events while teaching mode is
  on, so drags become strokes instead of text selection.
- **Laser pointer** is not a stroke: a single transient dot rendered from the last
  `point` payload, with a ~600 ms fading tail of recent positions. It disappears
  when `point` stops arriving for 1 s, or on `{ off: true }`.

### 4. Tools

Four tools, chosen by the tutor from a floating toolbar:

| tool          | behavior                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `laser`       | Transient dot + fading trail. No persistence. Default tool.                |
| `pen`         | Freehand stroke, ~2.5px, opaque. Persists until cleared.                   |
| `highlighter` | Freehand stroke, ~14px, `multiply` blend at ~35% alpha. Persists.          |
| `text`        | Click places a caret; tutor types a short label (≤80 chars) pinned to that anchor point. Enter or blur commits; Escape cancels. Persists. |

Four colors. Undo removes the last stroke by `strokeId` (broadcast as
`{ undo, strokeId }`). Clear removes all ink for the current `qid`.

Note: `highlighter` is visually distinct from the existing student
`Highlightable` text-marking — teaching-mode ink is a free-form overlay and does
not touch `live.marks`.

### 5. Lifecycle

- Ink is held in memory on both sides, keyed by `qid`.
- Question change wipes ink. Navigating back does **not** restore it.
- Turning teaching mode off clears ink and the laser on both sides.
- Session end / channel close clears everything. Nothing is written to Postgres.

### 6. Tutor UX

- A `Teaching` toggle pill in the `LiveTestView` header, next to the existing
  "Watching {name} · read-only" indicator.
- While on: a compact floating toolbar (tool row, color row, undo, clear) docked
  bottom-right above the test footer. Cursor becomes a crosshair over the
  question area.
- The header indicator changes from "read-only" to "teaching" so the tutor always
  knows the student can see their pointer.

### 7. Student UX

- A quiet chip near the tutor panel: "Your tutor is pointing" while teaching mode
  is on. No modal, no interruption.
- The student keeps full control: answering, highlighting, eliminating, scrolling,
  and navigating all continue to work.
- **Off-screen ink:** we deliberately do not auto-scroll the student. If ink lands
  in a region that is scrolled out of view, a subtle arrow appears on the
  corresponding edge of the scroll container; clicking it scrolls that region into
  view. The student chooses when to follow.

### 8. Completed-section review

Today the student broadcasts only active practice (`sessionLive.status ===
'active'`). Review screens broadcast nothing, so the tutor has no way to know
which reviewed question the student is on.

Change: the student's live payload gains a `mode` discriminator.

```js
{ active: true, mode: 'practice', … }               // existing shape, unchanged
{ active: true, mode: 'review', sessionId, qid, index, total }  // new
```

- `Review` and `SessionDetail` report the currently open question through the same
  `liveUi` reporting path the question screens already use.
- The tutor mirrors it by opening the same session/question through the existing
  `studentId` / `readOnly` props those screens already accept — both sides render
  from the database, so no question HTML rides the broadcast in review mode.
- With teaching mode on, the tutor may push `{ goto: { sessionId, qid, index } }`;
  the student's review screen navigates to it. Outside teaching mode the tutor
  cannot move the student.
- `mode: 'review'` must **not** trip the live-practice banner or the auto-open of
  `live-session`. `watchedIsLive` stays gated on `mode === 'practice'`.

Existing payloads without `mode` are treated as `'practice'` for backward
compatibility during rollout.

## Interaction with existing invariants

The binding constraint from project memory — *presence must never clear
`watchedLive` or idle `liveStudents`; only an explicit `session active:false`
after the ~4s debounce* — is unchanged. Teaching events are additive and never
touch `liveStudents`, `watchedLive`, or the idle debounce.

## Files

**New**

- `lib/tutor/anchors.js` — region registry, point encode/decode, rect measurement.
- `lib/tutor/useTeachMode.js` — tutor-side state (on/off, tool, color, strokes) and
  student-side receiver state.
- `components/tutor/TeachRegion.jsx` — wrapper that registers a region id.
- `components/tutor/TeachLayer.jsx` — SVG overlay renderer (laser + strokes + labels).
- `components/tutor/TeachToolbar.jsx` — tutor tool/color/undo/clear controls.

**Modified**

- `lib/tutor/realtime.js` — `teach` / `point` / `ink` events and senders.
- `lib/tutor/useStudentLive.js` — receive teaching events; add `mode` to payloads.
- `lib/tutor/useTutorWatch.js` — send teaching events; handle `mode: 'review'`.
- `components/tutor/LiveTestView.jsx` — regions, overlay, toggle, toolbar.
- `components/sixteen/screens/QuestionRW.jsx`, `QuestionMath.jsx` — regions + overlay.
- `components/sixteen/screens/Review.jsx`, `SessionDetail.jsx` — report review
  position, accept `goto`, regions + overlay.
- `components/sixteen/SixteenApp.jsx` — wire teaching state; gate `watchedIsLive`
  on `mode === 'practice'`.

## Failure handling

- Unknown region id on receive → drop that stroke silently; the rest still renders.
- `qid` mismatch → drop. Prevents ink from a previous question bleeding through.
- Oversized `ink` batch → split at the flush boundary; a batch never exceeds ~8 KB.
- Channel drop → on resubscribe, the tutor re-sends teaching state and a full
  stroke replay for the current `qid`.
- Student closes a region the tutor is drawing on (e.g. Desmos) → those strokes
  stop rendering and resume if it reopens, since strokes are stored by region id.

## Verification

No test framework exists in this repo. Verification is `pnpm lint`,
`pnpm exec tsc --noEmit`, `pnpm build` (the `/verify` sequence), plus manual
two-window checks:

1. Tutor toggles teaching on → student sees the pointer chip and a moving dot.
2. Tutor circles choice C on a narrow window → the circle lands on choice C in the
   student's wide window, undistorted.
3. Student scrolls the passage → tutor's ink stays glued to the annotated text.
4. Student advances to the next question → all ink disappears on both sides.
5. Student answers and highlights while the tutor draws → no interaction is blocked.
6. Review mode: student opens a completed section, tutor mirrors it, tutor pushes
   `goto` for another question, student's screen follows.
7. Reload the tutor mid-drawing → student's ink for the current question is
   restored after resubscribe.
8. Math question with a large Desmos state open → session snapshots still arrive
   (teaching traffic did not starve them).
