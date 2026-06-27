# Practice Analysis Tabs — Design

**Date:** 2026-06-26
**Status:** Approved (design decisions confirmed); pending spec review
**Author:** brainstormed with Claude

## Goal

Add three navigation entries to the **"You"** sidebar group:

- **Practice Tests** — analysis of completed full SATs
- **Practice Sections** — analysis of completed full-section runs
- **Practice Modules** — analysis of completed single-module runs

Each screen lets the student dive into one practice type, see their attempts over
time, and surface **where they're losing points** (weakest domains) *for that
type only*. When a type has no data, the screen suggests **taking a diagnostic**
(launches a full SAT).

## Data model (no new practice mode needed)

All three types already exist as launchable, scored modes. The mapping was the
key discovery during brainstorming — `mock-full` is the app's "Full section"
mode, and a full SAT (`mock-exam`) is persisted as **two `mock-full` rows**:

| Screen | Source rows in `practice_sessions` |
|---|---|
| **Practice Tests** | `mode = 'mock-full'` **and** `config.exam === true` — the two halves (R&W + Math) of one full SAT, paired |
| **Practice Sections** | `mode = 'mock-full'` **and** `config.exam` falsy — standalone full-section runs |
| **Practice Modules** | `mode = 'mock-m1'` |

Reference: `SessionContext.jsx:166` persists `mock-exam` as `mock-full`;
`SessionContext.jsx:168` tags it with `config.exam = true`. `Stats.jsx:14`
already labels `mock-full` as "Full section".

## Components / changes

### 1. Reliable test pairing — `config.examId` (`SessionContext.jsx`)

A full SAT's two halves are stored as separate rows with no shared id. Add one.

- In `start()` (around line 227–240), when `mode === 'mock-exam'`, generate
  `examId = crypto.randomUUID()` and include it in the persisted `config` so both
  halves inherit it. Concretely: set `config: { ...config, examId }` when
  `isExam`. Because `persistSession` (line 168) already spreads `state.config`
  into the stored `config`, and `startExamNextSection` preserves `state.config`,
  both the R&W and Math rows will carry the same `examId` automatically.
- **No schema migration** — `config` is `jsonb`; `examId`/`exam` are just keys.

**Pairing in the UI (Practice Tests):**
- Group exam-flagged `mock-full` rows by `config.examId`.
- **Fallback for pre-existing exam data without an `examId`:** pair two
  exam-flagged rows that have opposite `section` values and `created_at` within a
  small window (e.g. ≤ 3 hours), most-recent-first. A half with no partner renders
  as a partial/incomplete test (show the one section's score, mark the other "—").

### 2. Scoped stats — `?scope=` param (`app/api/stats/route.ts`)

The endpoint currently aggregates **all** answers with no mode filter. Add an
optional `scope` query param: `tests | sections | modules` (absent = current
all-modes behavior, so existing callers are unaffected).

- Extend the `answers` select to also pull the parent session's mode/config via
  the existing join chain:
  `session_questions!inner(section, domain, practice_sessions!inner(mode, config))`.
  *(Verify the FK name `practice_sessions` for the embed; adjust to the actual
  relationship name if Supabase requires it.)*
- In the aggregation loop, skip rows whose parent session doesn't match the scope:
  - `tests` → `mode === 'mock-full' && config?.exam === true`
  - `sections` → `mode === 'mock-full' && !config?.exam`
  - `modules` → `mode === 'mock-m1'`
- Everything downstream (`categories`, `sectionTotals`, `focus`) is then computed
  over just the scoped answers and returned in the **same response shape**. This
  lets the new screens reuse the existing per-domain rendering.

If the join/embedded-filter proves awkward in Supabase, the fallback is a separate
lightweight query: fetch the scoped session ids first, then filter answers by
`session_id in (...)`. Pick whichever is cleaner during implementation; the
response contract is unchanged either way.

### 3. Scoped stats hook (`lib/data/hooks.js`)

Extend `useStats(studentId)` → `useStats(studentId, scope)`:
- Append `scope` to the request URL when provided. The existing SWR `cache` is
  keyed by URL, so each scope caches independently with no extra plumbing.
- Default `scope = null` keeps the current URL and behavior unchanged.

### 4. Three analysis screens (`components/sixteen/screens/`)

To avoid triplicated code (per coding-style: small, focused files), build **one
shared analysis component plus thin config**, not three near-duplicates:

- `practice-analysis/PracticeAnalysis.jsx` — the shared screen body: header +
  summary stats + **Weak Areas** card + **Attempts** list + diagnostic empty
  state. Takes a `kind` prop (`'tests' | 'sections' | 'modules'`).
- `practice-analysis/parts.jsx` (or co-located) — shared subcomponents:
  - `WeakAreasCard` — reads `useStats(studentId, scope)` for this kind; renders
    the weakest domains (reuse the look of `Stats.jsx`'s `DomainBreakdown` /
    `AccuracyRing`). Each weak domain links to `category-detail` (existing).
  - `DiagnosticEmpty` — empty state with a primary **"Take a diagnostic"** CTA
    that calls `session.start({ mode: 'mock-exam' })` then
    `go('rw-question', { kind: 'module' })` (mirrors `PracticeSetup.jsx:197–199`).
  - `SummaryHeader` — best/latest score, # attempts, trend.
- Attempt list differs by kind:
  - **modules / sections** — single-session rows (date, scaled score, accuracy),
    each → `go('session-detail', { id })` (existing screen). Filter `useSessions`
    output by mode/`config.exam` client-side.
  - **tests** — paired rows: composite total (R&W scaled + Math scaled) with each
    half's sub-score; each half → `session-detail`. No new detail screen; no
    rebuild of `ExamReport` (it reads live session state, not history).

Three exported screen wrappers (`PracticeTests`, `PracticeSections`,
`PracticeModules`) each render `<PracticeAnalysis kind=… go=… {...watchProps} />`,
so they accept `studentId`/`readOnly` like other screens (tutor read-only view).

### 5. Nav + routing wiring (`SixteenApp.jsx`)

Add three views: `practice-tests`, `practice-sections`, `practice-modules`.
Touch all five wiring points:

1. **Imports** — import the three screen wrappers.
2. **`switch (view)`** — three cases rendering each wrapper with `go` + `watchProps`.
3. **`sidebarId` map** — map each view to its own id for active highlight.
4. **`titleFor`** — `'Strix — Practice Tests'`, etc.
5. **`Sidebar` `items`** (group `'You'`) + **`onSelect`** handlers:
   - `{ id:'practice-tests',    label:'Practice Tests',    icon: I('graduation-cap'),  group:'You' }`
   - `{ id:'practice-sections', label:'Practice Sections', icon: I('layers'),          group:'You' }`
   - `{ id:'practice-modules',  label:'Practice Modules',  icon: I('square'),          group:'You' }`
   - Placed after **Stats**, before **Tutor**. Icons reuse the mode icons from
     `PracticeSetup` (`graduation-cap`/`layers`/`square`) for consistency.

## Data flow

```
Sidebar select → go('practice-tests')
  → PracticeTests → PracticeAnalysis kind='tests'
      ├─ useSessions(50, studentId)  → filter to exam-flagged mock-full, pair by examId → Attempts list
      └─ useStats(studentId, 'tests') → scoped categories/sectionTotals → Weak Areas card
  → empty → DiagnosticEmpty → session.start({mode:'mock-exam'}) → go('rw-question',{kind:'module'})
```

## Edge cases

- **No data for a type** → `DiagnosticEmpty` (full-SAT CTA). Applies to all three.
- **Unpaired exam half** (old data / abandoned mid-test) → render the available
  half; mark the missing section "—". Never crash on a missing partner.
- **Tutor read-only view** → screens accept `studentId`/`readOnly`; the diagnostic
  CTA is hidden/disabled when `readOnly` (a tutor can't start the student's test),
  matching `PracticeSetup`'s `readOnly` handling.
- **Scaled score null** (unscored/legacy rows) → show accuracy, omit the scaled
  number, exactly like `Stats.jsx` does (`s.scaled_score ?? '—'`).

## Out of scope

- No new practice/run mode (all three already launchable).
- No new `diagnostic` session type (diagnostic = existing full SAT).
- No rebuild of `ExamReport` for historical tests.
- No schema migration.
- Not removing/changing the existing **Stats → Sessions** tab (its filters
  overlap but stay as-is).

## Files touched

| File | Change |
|---|---|
| `components/sixteen/session/SessionContext.jsx` | add `config.examId` on exam start |
| `app/api/stats/route.ts` | `?scope=` filter (tests/sections/modules) |
| `lib/data/hooks.js` | `useStats(studentId, scope)` |
| `components/sixteen/screens/practice-analysis/PracticeAnalysis.jsx` | new shared screen |
| `components/sixteen/screens/practice-analysis/parts.jsx` | new shared parts (WeakAreasCard, DiagnosticEmpty, SummaryHeader, attempt lists) |
| `components/sixteen/screens/PracticeTests.jsx` / `PracticeSections.jsx` / `PracticeModules.jsx` | new thin wrappers |
| `components/sixteen/SixteenApp.jsx` | imports, switch cases, sidebarId, titleFor, sidebar items + onSelect |

## Verification

Per `CLAUDE.md` (no test framework), before declaring done:

```
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Manual: navigate each new sidebar item; with data confirm attempts + weak areas;
with no data confirm the diagnostic CTA launches a full SAT; confirm a full SAT
taken after this change produces a paired "test" with a composite score.
