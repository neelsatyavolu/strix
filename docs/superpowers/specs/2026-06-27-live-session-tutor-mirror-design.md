# Live Session — Tutor's Read-Only Test Mirror

**Date:** 2026-06-27
**Status:** Approved design, pending implementation plan

## Summary

Give tutors a **"Live Session"** view that mirrors a student's in-progress SAT
practice screen in real time, looking *exactly* like the student's Bluebook-style
test screen — including live highlights, answer-choice strikethroughs, the timer,
mark-for-review flags, and the Desmos calculator's actual state — but fully
read-only (the tutor cannot answer or edit anything).

The tutor can leave the Live Session to browse the student's stats/dashboard and
return instantly, because the realtime subscription runs continuously in the
background regardless of which view is active.

## Goals

- A tutor watching a live student sees a faithful, read-only copy of the exact
  test screen the student is looking at.
- Mirror the student's annotations (passage/stem highlights) and answer-choice
  strikethroughs **live / continuously** (~sub-second, throttled).
- Mirror the **Desmos calculator's actual state** (typed expressions + graph),
  read-only, updating live.
- Mirror selected answer, mark-for-review flag, timer, and question palette status.
- Let the tutor exit to check stats and return to the live view instantly.

## Non-Goals

- No persistence of annotations/strikethroughs/Desmos state to the database. The
  mirror is ephemeral, like the existing live view.
- No changes to the student's exam-taking behavior or experience.
- No DB schema changes.
- No tutor ability to interact with or control the student's screen (view-only).

## Decisions (locked)

- **Fidelity:** Full screen-share fidelity — live Desmos state mirror + live
  continuous annotations/strikethroughs.
- **Render approach: Option A** — a dedicated read-only mirror screen built from
  the *same primitive components* the student screens use. The student's
  `QuestionRW`/`QuestionMath` screens are **not** dual-moded or refactored into a
  shared core (Options B/C were rejected because there is no automated test
  framework and the student exam flow is the most critical path in the app).
  Extracting a shared presentational core (Option C) remains a possible future
  follow-up if drift becomes a problem.

## Existing architecture this builds on

The realtime plumbing already exists and is reused as-is:

- `lib/tutor/realtime.js` — Supabase Realtime channel `strix:student:${id}`;
  `sendSession`, `sendChat`, `sendTyping`, presence `track`.
- `lib/tutor/useStudentLive.js` — student-side broadcaster; opens the channel and
  sends the live session payload + presence.
- `lib/tutor/useTutorWatch.js` — tutor-side subscriber; returns `liveStudents`
  (presence) and `watchedLive` (current question payload) and chat.
- `components/sixteen/SixteenApp.jsx` — app shell. Builds the live payload memo
  (~`:110`), renders the sidebar (`:224`), the "Viewing" student picker (`:268`),
  routes views (`:320`), and currently **auto-hijacks** `mainContent` with the
  live view when the watched student is mid-section (`:356`).
- `components/tutor/LiveQuestionView.jsx` — today's thin read-only view (question
  + selected choice only). Replaced by the new `LiveTestView`.
- `components/sixteen/screens/QuestionRW.jsx`, `QuestionMath.jsx` — the student
  exam screens. All annotation/elimination/timer/Desmos state is **local
  `useState`** here, not in `SessionContext`.

## Architecture

Three parts: **Producer** (student screen streams a rich snapshot), **Transport**
(existing Supabase broadcast, expanded payload), **Consumer** (new read-only
`LiveTestView`).

### Part 1 — Producer: bridging local screen state into the broadcast

The state to mirror (`marks`, `elim`, `seconds`, `annotate`, Desmos) lives in the
test screens' local state, but the broadcaster (`useStudentLive`) is in
`SixteenApp`. Bridge it **without moving state ownership** via a new lightweight
context:

- **New `LiveBroadcastContext`** (e.g. `components/sixteen/session/LiveBroadcastContext.jsx`)
  exposing a `report(partial)` callback and holding the latest reported UI snapshot.
- `QuestionRW`/`QuestionMath` call `report({ marks: marks[q.id], eliminated:
  [...elimSet], seconds, annotateActive: annotate, flagged, selected, type,
  palette, calc })` from a **throttled effect (~250ms)** whenever those values change.
- `SixteenApp`'s live-payload memo merges session-derived fields (question html,
  index, total, domain, section) with the latest reported UI fields;
  `useStudentLive` broadcasts the union.

Net change to each student screen: one throttled report effect + one Desmos
observe hook. No behavioral change to the exam flow.

### Part 2 — Transport: expanded payload

`lib/tutor/realtime.js` (`sendSession`) and the `useStudentLive` payload builder
carry the expanded shape:

```
{
  // existing
  active, index, total, section, domainLabel,
  stemHtml, stimulusHtml, choices,
  // answer + flag
  selected, flagged, type,                  // type: 'mcq' | 'spr'
  // annotations + eliminations
  marks: { stem, passage },                 // highlighted HTML strings
  eliminated: ['A', 'C'],                   // crossed-out choice letters
  // tool + timer state
  annotateActive, seconds, timerRunning,
  // palette so the read-only palette renders
  palette: [{ answered, flagged }, ...],
  // calculator
  calc: { open, pos, size, state }          // Desmos getState() JSON, throttled
}
```

- `marks.stem` / `marks.passage` carry the same `<mark>`-annotated HTML the
  student produced, rendered on the tutor side with `Highlightable active={false}`
  so it looks identical.
- Throttle/last-write-wins keeps volume sane even with rapid highlighting or
  Desmos typing.

### Part 3 — Desmos live sync

- **Student side** (`DesmosPanel` in `QuestionMath.jsx`): attach
  `calc.observeEvent('change', …)` → throttled `report({ calc: { open, pos, size,
  state: calc.getState() } })`. Report `open: false` when the panel closes.
- **Tutor side** (read-only `DesmosPanel`): on each payload, call
  `calc.setState(state, { allowUndo: false })`, mirror `pos`/`size`, and lay a
  transparent overlay over the calculator so the tutor cannot edit (Desmos exposes
  no clean read-only flag). Hide the panel when `calc.open` is false.

### Part 4 — Consumer: `LiveTestView` (new read-only screen)

New `components/tutor/LiveTestView.jsx`, branching on `section`, composing the
**same primitives** the student screens use — `TestHeader`, `Timer`,
`DirectionsBar`, `Highlightable`, `OptionRow`, `QuestionPalette`, read-only
`DesmosPanel` — in the same layout. Differences from the student screen:

- All interaction handlers are no-ops; the footer Next/Submit is disabled/hidden.
- `selected`, `eliminated`, `marks`, `flagged`, `seconds`, palette state come
  straight from the payload.
- A small "watching {name} • read-only" affordance distinguishes it from the
  student's own screen.

Replaces the current thin `LiveQuestionView`.

### Part 5 — Navigation / UX (`SixteenApp.jsx`)

- Add a **"Live Session" sidebar item, pinned at the top, shown only when
  `watchedIsLive`** (conditional push, mirroring how the Dev tab is added at
  `:222`). Include a `●` live dot.
- Route a new `live-session` view → `LiveTestView`. Auto-select it the first time
  a watched student transitions to live.
- **Remove the auto-hijack** of `mainContent` (`SixteenApp.jsx:356`) so Stats /
  Dashboard / Sessions stay freely browsable while the student practices.
- `useTutorWatch` keeps subscribing regardless of the active view, so returning to
  "Live Session" is instant.
- Keep `LiveStudentsBanner` for cross-student "who's live" awareness.

## Edge cases

- **Student idle / between modules:** the tab shows a calm "Student isn't in a
  section right now" state; the tab may auto-hide after the student finishes.
- **Student disconnects:** last frame freezes with a "reconnecting…" hint;
  presence flips inactive after the existing timeout.
- **Large `marks` HTML / rapid Desmos changes:** 250ms throttle + last-write-wins
  bounds broadcast volume.
- **Tutor opens the tab with no student selected:** show the existing
  `PickStudentPrompt`.

## Components & files

**New**
- `components/tutor/LiveTestView.jsx` — read-only mirror screen (RW + Math branches).
- `components/sixteen/session/LiveBroadcastContext.jsx` — `report(partial)` bridge.
- Read-only `DesmosPanel` variant (new component or a `readOnly` prop on a shared
  Desmos panel extracted from `QuestionMath.jsx`).

**Modified**
- `lib/tutor/realtime.js` — expanded `sendSession` payload shape.
- `lib/tutor/useStudentLive.js` — build/merge the expanded payload.
- `lib/tutor/useTutorWatch.js` — surface the expanded `watchedLive` fields (mostly
  pass-through).
- `components/sixteen/screens/QuestionRW.jsx` — throttled `report()` effect.
- `components/sixteen/screens/QuestionMath.jsx` — throttled `report()` effect +
  Desmos `observeEvent` hook; extract read-only-capable `DesmosPanel`.
- `components/sixteen/SixteenApp.jsx` — merge reported UI state into the live memo;
  add the "Live Session" sidebar item; add the `live-session` route; remove the
  `mainContent` auto-hijack.

**Removed / replaced**
- `components/tutor/LiveQuestionView.jsx` — superseded by `LiveTestView`.

## Verification

No automated test framework exists. Before declaring complete, run and confirm all
pass:

```
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Manual verification (two browser sessions — one student, one tutor):

1. Student starts an RW drill; tutor sees the "Live Session" tab appear and the
   mirrored question, selected answer, and live timer.
2. Student highlights passage text and crosses out a choice → tutor sees both
   appear within ~1s.
3. Student flags a question and opens the palette → tutor's mirror reflects flag +
   palette status.
4. Math section: student opens Desmos and types `y = 2x + 1` → tutor's read-only
   Desmos shows the same expression and graph; tutor cannot edit it.
5. Tutor clicks Stats, browses, returns to Live Session → mirror resumes instantly.
6. Student finishes the module → tab shows the idle state (or auto-hides).
