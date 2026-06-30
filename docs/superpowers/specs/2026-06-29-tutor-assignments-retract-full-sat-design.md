# Tutor assignments: retract + full-length SAT / section / module

**Date:** 2026-06-29
**Status:** Design — pending implementation plan

## Goal

Extend the tutor → student assignment system (today: drills only) with three capabilities:

1. **Retract** an open assignment (soft, keeps the record).
2. Assign a **full-length SAT**, a **single full section**, or a **single module** — not just drills.
3. When assigning anything official, let the tutor pick a **specific Bluebook test** (5–10) or the randomized **Question Bank**.

All of this builds on plumbing that already exists: the practice engine already runs `drill`, `mock-m1`, `mock-full`, and `mock-exam`; official forms are identified by integer test number via `lib/cb/official-forms.json` and surfaced by `/api/official-forms`; assignment completion already flows through `config.assignmentId` in `app/api/sessions/route.ts`. The work is wiring these together, not building new engines.

## Assignment types (what the tutor can assign)

| UI label | Stored `mode` | Extra fields | Engine behavior |
|---|---|---|---|
| Drill | `drill` | section, topic (`domain`), difficulty, count | existing flat drill |
| Single module | `mock-m1` | section, `module_key` (`m1`/`easy`/`hard`), `bluebook_test` | one flat module, scored raw |
| Single section | `mock-full` | section, `bluebook_test` | adaptive Module 1 → 2A/2B, scaled 200–800 |
| Full SAT | `mock-exam` | `bluebook_test` (both sections) | R&W full → break → Math full → composite 400–1600 |

- `module_key`: `m1` = Module 1, `easy` = Module 2A (easier), `hard` = Module 2B (harder) — matches the official-forms manifest slots.
- **Constraint:** Module 2A/2B (`easy`/`hard`) exist only in official Bluebook forms, not the synthetic Question Bank. So selecting 2A/2B **requires** a Bluebook test; the Question Bank option is disabled for those. Module 1 and single-section/full-SAT may use Question Bank (`bluebook_test = null`) or a specific test.
- `section` is `null` for a full SAT (covers both); required for the other three.

## 1. Data model — `supabase/migrations/0008_assignment_full_tests.sql`

Alter `public.assignments` (all existing rows are drills, so every change is backward-safe):

- **`status` check** → allow `('assigned','completed','retracted')` (drop + recreate constraint).
- **`mode` check** → add `('drill','mock-m1','mock-full','mock-exam')` (column already exists, default `'drill'`, currently unconstrained).
- **Add `bluebook_test smallint`** null — official test number 5–10, or null = Question Bank.
- **Add `module_key text`** null — check `('m1','easy','hard')`; only set for `mock-m1`.
- **Add `scaled_score smallint`** null — section score (mock-full) or composite (mock-exam) shown on completion; null for drill/module (which show raw correct/total).
- **Add `session_id_2 uuid`** null → `practice_sessions(id)` on delete set null — the **Math half** of a full SAT. `session_id` holds the single session (drill/module/section) or the **R&W half** of a full SAT. This pair feeds `test-review`'s `{ rwId, mathId }` directly.

No RLS change needed: `assignments_tutor` is `FOR ALL` (covers the retract UPDATE), and `assignments_student_complete` already lets a student UPDATE their own row (covers full-SAT client completion below).

## 2. API

### `app/api/tutor/assignments/route.ts`

- **POST** — extend `NewAssignment` Zod schema:
  - `mode: z.enum(['drill','mock-m1','mock-full','mock-exam']).default('drill')`
  - `bluebookTest: z.number().int().min(5).max(10).nullable().optional()`
  - `moduleKey: z.enum(['m1','easy','hard']).nullable().optional()`
  - `section` becomes optional and is required (server-validated) for every mode except `mock-exam`.
  - Server validation: if `moduleKey ∈ {easy,hard}` then `bluebookTest` must be set; reject otherwise with a clean 400.
  - Insert maps: drill fields only for `drill`; `bluebook_test`, `module_key`, `section` per the table above. Default title generated per type when none supplied (e.g. `Full SAT · Bluebook 9`, `R&W Module 2B · Bluebook 7`).
- **PATCH** — extend `EditAssignment` to also accept `status: z.literal('retracted').optional()`. When `status === 'retracted'`, update with `.eq('status','assigned')` so only **open** assignments retract (completed/already-retracted are immutable; a 0-row update is reported as a no-op error to the UI). Feedback path unchanged.

### `app/api/assignments/route.ts` (student)

- **Add PATCH** — student completes their own **full-SAT** assignment after both halves persist:
  - Body: `{ id, rwSessionId, mathSessionId, scaled }` (Zod-validated).
  - Update own row (`student_id = auth.uid()`, enforced by `assignments_student_complete` RLS): `status='completed'`, `session_id=rwSessionId`, `session_id_2=mathSessionId`, `scaled_score=scaled`, `completed_at=now()`, only `.eq('status','assigned')` (don't resurrect a retracted assignment).
  - This exists because a full SAT is two persisted sessions; the per-session server completion path (below) can't see the composite or both ids.

### `app/api/sessions/route.ts` (single-session completion — drill / module / section)

- Existing `config.assignmentId` completion stays, with two additions: also write `scaled_score = p.scaled_score` (for `mock-full`; null for drill/module), and keep `.eq` guard so it won't overwrite a retracted assignment (`.eq('status','assigned')`).
- **Full SAT must NOT use this path.** The exam's two halves carry `config.assignmentId`? No — see §4: `assignmentId` is stripped from the persisted exam-half configs so this route never fires for `mock-exam`; the student PATCH above handles it once, with the composite.

## 3. `/api/official-forms`

Reused unchanged. The tutor form fetches `{ available, completed }` once when a non-drill type is selected, to render the Bluebook picker (taken tests muted, exactly like `PracticeSetup`).

## 4. Engine — `components/sixteen/session/SessionContext.jsx`

- **Single module by key:** in `start()`, the non-drill/non-fullsection branch (currently `fetchModule1`) uses `fetchOfficialModule({ test: bluebookTest, section, moduleKey })` when `config.moduleKey` and `config.bluebookTest` are set; otherwise falls back to `fetchModule1` (synthetic Module 1). Module label reflects the key (`Module 1` / `Module 2A` / `Module 2B`).
- **Full-SAT assignment completion:** the exam carries `config.assignmentId` through `start()`. In `persistSession`, **strip `assignmentId`** from the half's POSTed config (so `/api/sessions` never auto-completes), and **capture the returned session id** into `state.exam.results` for that section. When the exam fully finishes (Math half done), if `config.assignmentId` is set, fire one `PATCH /api/assignments` with `{ id, rwSessionId, mathSessionId, scaled: composite }`. Composite is the 400–1600 already computed for the exam report.
- Drill / mock-m1 / mock-full keep `config.assignmentId` and complete via `/api/sessions` (single session) — no engine change beyond the module-key fetch.

## 5. Tutor UI — `components/sixteen/screens/TutorAssignments.jsx`

- New-assignment card gains a **Type** `SegmentedControl` (Drill / Module / Section / Full SAT). Fields shown conditionally:
  - Drill → existing topic / difficulty / count.
  - Module → Section (R&W/Math) + Which module (Module 1 / 2A / 2B) + Bluebook picker (Question Bank disabled when 2A/2B).
  - Section → Section + Bluebook picker.
  - Full SAT → Bluebook picker only.
  - Bluebook picker = small reusable sub-component listing Question Bank + `available` tests (muted if `completed`), from `/api/official-forms`. Title field auto-defaults per type.
- Open-assignment card gains a **Retract** action — a subtle red text button by the "Waiting" badge with a one-tap inline confirm ("Retract?" → "Yes"). Calls `PATCH { id, status:'retracted' }` then `reload()`.
- Retracted assignments are excluded from both the open and completed lists (GET already returns them; filter client-side, or optionally add a small "Retracted" collapsed group — out of scope unless trivial).
- Completed **full-SAT / section** cards show `scaled_score` (composite or section) instead of a raw fraction, with the review button routed by type (see §6).

## 6. Student UI — `components/sixteen/screens/StudentAssignments.jsx`

- `start(a)` dispatches by `a.mode` (mirrors `PracticeSetup`'s launch):
  - `drill` → unchanged.
  - `mock-m1` / `mock-full` → `session.start({ mode: a.mode, section: a.section, bluebookTest: a.bluebook_test ?? null, moduleKey: a.module_key ?? null, assignmentId: a.id })` → `go('<section>-question', { kind:'module' })`.
  - `mock-exam` → `session.start({ mode:'mock-exam', bluebookTest: a.bluebook_test ?? null, assignmentId: a.id })` → `go('rw-question', { kind:'module' })`.
- Card subtitle adapts per type (e.g. `Full SAT · Bluebook 9`, `R&W Module 2B`, `Math section · Question Bank`) instead of always `N questions`.
- Completed cards: drill/module show raw `correct/total`; section shows `scaled_score`; full SAT shows composite `scaled_score` + a **Review** button.

## 7. Review routing (both tutor & student completed cards)

- Drill / module → `go('session-detail', { id: a.session_id })` (existing).
- Single section → `go('session-detail', { id: a.session_id })` (single mock-full session; existing detail screen handles it).
- Full SAT → `go('test-review', { rwId: a.session_id, mathId: a.session_id_2 })` — the exact params `TestReview` already consumes.

## Out of scope

- Un-retract / restore (the chosen behavior is soft retract, open-only, not reversible from the UI).
- Editing an assignment's parameters after creation (only feedback + retract).
- Assigning to multiple students at once.
- A standalone synthetic (Question Bank) Module 2A/2B (undefined in the engine; gated behind requiring a Bluebook test).

## Verification

`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` all clean. Manual: assign each of the four types (with Question Bank and a specific Bluebook test), complete each as the student, confirm the correct completion record + review link; retract an open assignment and confirm it leaves both lists and the student no longer sees it.
