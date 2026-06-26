# Coherent Tutor Watching — Design

**Date:** 2026-06-26
**Status:** Approved (pending spec review)

## Problem

The tutor experience is split across two disconnected surfaces:

- **`/join/[token]`** (`components/tutor/TutorJoin.tsx`) — a standalone full-page
  route. Clicking an invite link traps the tutor on a full-screen "Watching
  Emily Lin / Waiting for Emily Lin to start a question…" view, even when the
  student is idle. There is no navigation, no dashboard, and no way out.
- **The main app** (`components/sixteen/SixteenApp.jsx`) — already has a
  **Student / Tutor-view** toggle in the titlebar (shown when `canTutor` is
  true) that opens `TutorPanel` as a sidebar.

This split causes three concrete problems:

1. Joining shows a useless "waiting" screen when the student is not in a section.
2. After clicking the link there is no coherent way to switch into / out of
   tutor mode.
3. Opening a tutor link hijacks the whole window into watch mode, even if the
   tutor is in the middle of their own practice.

## Goal

Unify the two surfaces. The invite link should **accept the invite and drop the
tutor into the real app** on Home. Watching a student becomes an **opt-in**
action inside the app, and an idle student shows their **normal screens
(read-only)** rather than a dead "waiting" screen.

## Non-Goals

- No database schema changes. The RLS policies needed already exist.
- No changes to the student's own practice-taking experience.
- No new chat features; the existing realtime chat is reused as-is.

---

## Existing building blocks (reused)

- **DB authorization already exists.** `supabase/migrations/0001_init.sql`
  defines `is_tutor_of(student uuid)` and RLS SELECT policies letting a tutor
  read a student's `profiles`, `practice_sessions`, `session_questions`, and
  `answers` (read-only). No migration needed.
- **Membership tables:** `tutor_links` (invite tokens) and `tutor_memberships`
  (`student_id`, `tutor_id`, `status`).
- **Realtime channel:** `lib/tutor/realtime.ts` → `openTutorChannel()` on
  `strix:student:{studentId}` with `chat`, `session`, and `presence` events.
  The student's `TutorPanel` broadcasts a `session` payload on every question
  navigation (`components/sixteen/panels/TutorPanel.jsx` ~L93–109).
- **Role toggle:** `SixteenApp` already has `role` (`'student' | 'tutor'`),
  `tutorOn`, `canTutor`, and `switchRole()`.
- **Data endpoints:** `/api/stats`, `/api/stats/category`, `/api/stats/history`,
  `/api/sessions` — all currently rely on Supabase RLS to scope to the
  authenticated user (no explicit `studentId`).

---

## A. Join flow — link becomes an accept-invite handler

`app/join/[token]/page.tsx` stays. `components/tutor/TutorJoin.tsx` is reduced
to the lifecycle: **loading → (signin) → joining → redirect / error**.

1. `getSessionProfile()`; if not signed in, show the existing sign-in card.
2. POST `/api/tutor/join` with the token (unchanged — creates / upserts the
   `tutor_memberships` row).
3. On success, **`router.replace('/app')`**. No watching UI on this route.
4. On failure, show the existing error state.

The entire `watching` JSX block (the live question card + chat, `TutorJoin.tsx`
~L107–161) and its realtime/chat state are **deleted** — that behavior moves
into the main app (sections C/E). Remove the now-unused imports
(`openTutorChannel`, `loadMessages`, `saveMessage`) and live/message state.

**Result:** the tutor lands on Home in the full app. Requirement 1 and 3 are
satisfied structurally — there is no waiting screen and no hijack.

---

## B. Watch state in `SixteenApp`

New state:

```js
const [watchedStudentId, setWatchedStudentId] = React.useState(null);
const [students, setStudents] = React.useState([]);   // [{id, name, live}]
const [liveStudents, setLiveStudents] = React.useState({}); // id -> liveMeta|null
```

- `students` is populated from `/api/tutor/students` (already fetched for
  `canTutor`; extend to keep the list, not just the count).
- Entering **Tutor view**: if exactly one student, auto-select them; otherwise
  leave `watchedStudentId` null until chosen.
- **Header picker:** a small dropdown next to the role toggle, shown only in
  tutor view, listing all students with a "live" dot. Selecting one sets
  `watchedStudentId`. The header reads **"Viewing: {name}"**.
- The watched student's name/id is passed down to screens and `TutorPanel`.

`switchRole('student')` clears `watchedStudentId`.

---

## C. What the tutor sees (3 content states)

The chat sidebar (`TutorPanel` in tutor role) is always present in tutor view.
The **main area** depends on the watched student's live state:

1. **Watched student mid-section** → **live question view**. Extract the live
   question card from old `TutorJoin` into a presentational component
   `components/tutor/LiveQuestionView.jsx` (props: `live`, `studentName`). Driven
   by the `session` broadcast from that student's channel.
2. **Watched student idle** → the **normal student screens** (`Dashboard`,
   `Stats`, `CategoryDetail`) rendered with **that student's data**,
   **read-only**.
3. **No watched student selected** (multi-student, none chosen) → a light
   "Pick a student to watch" prompt in the main area.

When `role === 'student'` everything is unchanged (own data, interactive).

### Read-only gating

A `watchedStudentId` (or a derived `readOnly` flag) is provided to screens via a
small context (`WatchContext`) so screens don't need prop-drilling through every
route. When watching:

- `Dashboard`, `Stats`, `CategoryDetail` fetch with `?studentId=`.
- "Start practice" / "New session" actions, mode tiles, and answer inputs are
  disabled or hidden (`PracticeSetup`, the question screens). The sidebar's
  rw/math entries still navigate to read-only setup previews but cannot launch.
- The sidebar footer / account chrome continues to show the **tutor's own**
  identity (they are logged in as themselves); only the content is the
  student's.

---

## D. API changes — optional `studentId`

For `/api/stats`, `/api/stats/category`, `/api/stats/history`, `/api/sessions`:

```ts
const studentId = sp.get("studentId");
let targetId = user.id;
if (studentId && studentId !== user.id) {
  const { data: ok } = await supabase.rpc("is_tutor_of", { student: studentId });
  if (!ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  targetId = studentId;
}
// ... .eq("user_id", targetId)   // explicit filter in every query
```

- **Explicit `user_id` filter in all cases** (self or watched). This also fixes
  a latent bug: today a tutor's own `/api/stats` can OR-in tutored students'
  rows via the permissive RLS tutor policy, because no explicit filter is
  applied. After this change every query is scoped to exactly one user.
- Hooks in `lib/data/hooks.js` (`useStats`, `useHistory`, `fetchHistory`,
  `useSessions`) gain an optional `studentId` argument appended to the query
  string.

---

## E. "Student started practice" banner

The tutor subscribes to **each of their students'** channels to know who is live
(small N; one channel per membership). A new
`components/tutor/LiveStudentsBanner.jsx` renders a slim top banner whenever a
student is mid-section and not currently being watched:

> **Maya Patel started a practice** · Reading & Writing  [ Join ]

- **Join** → `setWatchedStudentId(maya)`, ensure tutor view is on, show the live
  question. Never auto-switches without the click — the tutor stays put (even
  mid-practice) until they opt in.
- Multiple live students → stacked banners (or "+N more").

### Realtime signal additions

The current `session` broadcast only fires on question navigation, and there is
no "ended" signal. Add to the **student** side (`TutorPanel.jsx`):

- Broadcast a `session` with a `started: true` / status field when a section
  begins, and a terminal `{ active: false }` (or `event: 'session-end'`) when
  the student finishes or leaves the section.
- Use channel **presence** to clear a student's live state if they disconnect.

The tutor side maintains `liveStudents[id]` from these events; banners and the
header "live" dots derive from it.

---

## Component / file summary

| File | Change |
|------|--------|
| `components/tutor/TutorJoin.tsx` | Reduce to accept-invite + redirect; delete watching UI |
| `components/tutor/LiveQuestionView.jsx` | **New** — presentational live question card (extracted) |
| `components/tutor/LiveStudentsBanner.jsx` | **New** — top banner for live students |
| `components/sixteen/SixteenApp.jsx` | Watch state, header picker, content-state switch, banner mount |
| `components/sixteen/session/WatchContext.jsx` | **New** — provides `watchedStudentId` / `readOnly` |
| `components/sixteen/screens/Dashboard.jsx`, `Stats.jsx`, `CategoryDetail.jsx` | Read `studentId` from context; pass to fetches |
| `components/sixteen/screens/PracticeSetup.jsx`, `QuestionRW.jsx`, `QuestionMath.jsx` | Disable interactive controls when read-only |
| `components/sixteen/panels/TutorPanel.jsx` | Student-side: broadcast start/end session signals; tutor-side reuse |
| `lib/data/hooks.js` | Optional `studentId` arg on hooks |
| `app/api/stats/route.ts`, `app/api/stats/category/route.ts`, `app/api/stats/history/route.ts`, `app/api/sessions/route.ts` | Optional `studentId` + explicit `user_id` filter |
| `lib/tutor/realtime.ts` | (If needed) helper to subscribe to multiple student channels for presence |

---

## Data flow

```
Invite link → /join/[token] → accept membership → /app (Home)
                                                     │
                          tutor subscribes to each student's channel
                                                     │
              student starts section ──broadcast──▶ liveStudents[id] = {…}
                                                     │
                                              top banner [Join]
                                                     │ click
                              watchedStudentId = id, role = tutor
                                                     │
              ┌──────────────────────────────────────────────────┐
              │ student live?                                     │
              │   yes → LiveQuestionView (from broadcast)         │
              │   no  → normal screens w/ ?studentId= (read-only) │
              └──────────────────────────────────────────────────┘
                         chat sidebar (TutorPanel) always present
```

---

## Testing

- **API:** a tutor requesting `?studentId=` for a student they tutor returns
  that student's rows; for a non-tutored student returns 403; with no param
  returns only the caller's own rows (regression test for the OR-in bug).
- **Read-only:** in tutor view, start/answer controls are disabled; navigating
  Stats/Dashboard shows the watched student's numbers.
- **Join flow:** opening an invite link signed-out → sign-in → lands on `/app`
  Home (not the watching screen).
- **Banner:** simulate a `session` broadcast → banner appears; clicking Join
  selects the student and shows the live question; an `ended`/presence-drop
  clears it.
- **No-hijack:** while the tutor is in their own practice, a student's banner
  appears but the tutor's screen does not change until Join is clicked.

## Open questions / risks

- Subscribing to one channel per student is fine for small N; if a tutor has
  many students, revisit with a single fan-in channel or presence-only.
- Read-only gating touches several screens; prefer a single `readOnly` context
  flag over per-screen prop-drilling to keep the change surgical.
