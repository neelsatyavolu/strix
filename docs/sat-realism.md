# Digital SAT realism — spec, implementation audit & roadmap

**Audience:** any engineer/agent working on practice-test generation, scoring, or a
future full-SAT mode. This is the single source of truth for *how the real digital
SAT is built* and *how faithfully this app reproduces it*.

> **Rule for anyone editing test logic: do not assume how the SAT works — verify
> against the cited sources below (or re-research).** Every factual claim here is
> tagged ✅ **CB-stated** (officially published by College Board) or ⚠️ **observed**
> (community/prep-derived, consistent but not officially documented). Treat ⚠️ items
> as conventions, not guarantees.

Last verified: **2026-06** against the sources in [§6](#6-sources).

---

## 1. The real digital SAT (verified spec)

Administered in College Board's **Bluebook** app. Two sections, each section is
**two-stage module-adaptive**.

### Structure & timing — ✅ CB-stated
| Section | Questions | Modules | Time/module | Total |
|---|---|---|---|---|
| Reading & Writing (R&W) | 54 | 2 × 27 | 32 min | 64 min |
| Math | 44 | 2 × 22 | 35 min | 70 min |

- **One 10-minute break** between the R&W section and the Math section. **No break
  between the two modules** within a section. ✅
- **Adaptivity is at the module level, not per question.** Module 1 is a broad mix of
  easy/medium/hard; performance on Module 1 routes the student to an easier or harder
  Module 2. Routing happens **independently per section** (R&W stage-1 → R&W stage-2;
  Math stage-1 → Math stage-2). ✅
- **Embedded pretest (unscored) questions:** "a small number" per module, scattered and
  indistinguishable from scored items. ✅ The specific **2-per-module** split (R&W
  25 scored + 2; Math 20 scored + 2) is ⚠️ observed, not CB-published — CB publishes only
  the 54/44 totals and the phrase "small number."

### Scoring — ✅ CB-stated
- **Total 400–1600** = R&W section score (**200–800**) + Math section score (**200–800**).
- CB uses unpublished per-form **IRT equating**; exact raw→scaled tables are not public.

### R&W content & ordering — ✅ CB-stated (order is published verbatim)
- Four domains. Within a module they appear in this **fixed order**, with the CB
  `skill_cd` codes (verified against the live qbank API) the app sorts on:
  1. **Craft and Structure** `CAS` (≈28%) — Words in Context `WIC` → Text Structure & Purpose `TSP` → Cross-Text Connections `CTC`
  2. **Information and Ideas** `INI` (≈26%) — Central Ideas & Details `CID` → Command of Evidence `COE` → Inferences `INF`
  3. **Standard English Conventions** `SEC` (≈26%) — Boundaries `BOU`, Form/Structure/Sense `FSS`
  4. **Expression of Ideas** `EOI` (≈20%) — Transitions `TRA` → Rhetorical Synthesis `SYN`
  - ⚠️ Command of Evidence is a **single** `COE` code — Textual vs Quantitative is a
    framework sub-distinction not exposed by the API (infer from a table/graph in the stimulus).
- Within Craft, Information, and Expression: questions are **grouped by skill and arranged
  easiest → hardest**. **Standard English Conventions is ordered by difficulty only**
  (not skill-grouped). The ramp **resets at each domain boundary**.
- **One short passage per question** (25–150 words). Cross-Text Connections uses a paired
  passage but still one question. There are **no** long multi-question shared passages
  (that was the paper SAT). ✅
- Per-domain **counts vary test-to-test** within the published % ranges; the percentage is
  the stable target, the exact count is not fixed. ✅ (per-module split below is ⚠️ derived)

### Math content & ordering — ✅ CB-stated
- Four domains, each appears in every module: **Algebra (≈35%)**, **Advanced Math (≈35%)**,
  **Problem-Solving & Data Analysis (≈15%)**, **Geometry & Trigonometry (≈15%)**.
- **Ordered easiest → hardest across the module, domains interleaved** (NOT domain-grouped). ✅
- ~75% multiple-choice, ~25% **student-produced response (SPR / grid-in)**. Grid-ins
  **cluster at the end of each module** (~5–6/module) — ⚠️ observed on every released form,
  not formally codified by CB.
- **Desmos graphing calculator** embedded and available for the **entire** math section
  (both modules); **reference/formula sheet** on every math question; BYO approved
  calculator also allowed. No calculator on R&W. ✅

### Bluebook behavior & tools — ✅ CB-stated (except where noted)
- **Navigation:** free movement back/forward within the active module, change answers,
  "Mark for Review," jump via Question Menu — **until the timer expires**. ✅
- **Once you move on from a module you cannot return to it.** ✅
- **Timer hits 0:** Bluebook auto-advances. ⚠️ observed — CB only states you can't return
  after moving on.
- Tools: countdown **timer** (hideable until 5 min left), **Mark for Review**, **answer
  eliminator**, **highlighter + notes**, **Desmos**, **reference sheet**, line reader, zoom. ✅

### Per-module count ranges (⚠️ derived — ≈ half the published section weighting)
Used by the blueprint allocator. Totals are fixed (27 / 22); each domain's share is
randomized within its range per draw.

| R&W domain | per module | | Math domain | per module |
|---|---|---|---|---|
| Craft and Structure (CAS) | 6–8 | | Algebra (H) | 6–8 |
| Information and Ideas (INI) | 6–7 | | Advanced Math (P) | 6–8 |
| Standard English Conventions (SEC) | 5–8 | | Problem-Solving & Data Analysis (Q) | 2–4 |
| Expression of Ideas (EOI) | 4–6 | | Geometry & Trigonometry (S) | 2–4 |

---

## 2. How this app builds a module

Questions are proxied live from the College Board question bank; we never store a
question pool of our own. Flow:

```
PracticeSetup → SessionContext.start()
  drill      → GET /api/questions?mode=drill   → drawQuestions()   (flat filtered set)
  mock-m1    → GET /api/questions?mode=module&profile=mixed → drawModule()  (one blueprinted module)
  mock-full  → M1 as above → routeModule2() → GET ...&profile=easy|hard&exclude=<M1 ids> → drawModule()
```

| Concern | Location |
|---|---|
| Blueprint allocator, ordering, difficulty profiles | `lib/cb/blueprint.ts` |
| CB bank fetch, normalize, draw, dedup primitives | `lib/cb/client.ts`, `lib/cb/normalize.ts` |
| Domain codes ↔ labels ↔ design categories | `lib/cb/domains.ts` |
| API entry (drill vs module, seen-loading) | `app/api/questions/route.ts` |
| Session state, adaptive routing, M1→M2 exclude | `components/sixteen/session/SessionContext.jsx` |
| Score scaling + routing threshold | `lib/scoring/curve.ts` |
| Per-module timer (32/35 min) | `components/sixteen/screens/QuestionRW.jsx`, `QuestionMath.jsx` |
| Persistence (used for cross-session dedup) | `app/api/sessions/route.ts`, `supabase/migrations/0001_init.sql` |

**`drawModule(section, profile, exclude?, seen?)`** — picks per-domain counts
(randomized within range), selects stubs biased to the profile's difficulty mix,
fetches details (math over-fetches via `MATH_OVERDRAW` for grid-in headroom), then orders:
- R&W → `arrangeRW`: fixed domain order; within domain, skills in the published `RW_SKILL_ORDER`, ramped (SEC by difficulty only).
- Math → `selectMath` + `arrangeMath`: hits per-domain counts and a 5–6 grid-in target (dedup-safe same-domain MCQ↔SPR rebalancing), then MCQ ramp easiest→hardest with the SPR block ramped at the end.

**Difficulty profiles** (`PROFILE_WEIGHTS`): `mixed` (Module 1), `easy` (Module 2A),
`hard` (Module 2B). These shift the *pool* difficulty, mirroring module adaptivity.

**Full SAT** (`mock-exam`): `SessionContext` runs R&W (M1→M2) → `exam-break` (10 min) →
Math (M1→M2), snapshots each section, and `ExamReport` sums the two section scores via
`compositeScore` (400–1600). Each section keeps independent routing and dedup.

---

## 3. Fidelity audit (current state)

### ✅ Faithful
- Module sizes (27 / 22), 2 modules/section, per-module timers (32 / 35 min) that
  **auto-advance at 0** (you can't return — Bluebook behavior, ⚠️ observed).
- R&W fixed domain order + **exact published skill order within domain** (`RW_SKILL_ORDER`),
  ramped; SEC by difficulty only.
- Math easiest→hardest ramp with domains interleaved; **grid-ins pinned to 5–6/module**
  (≈99% of draws; rest ±1) clustered & ramped at the end.
- Per-domain counts vary test-to-test within published ranges.
- Module-adaptive routing (M1 mixed → easier/harder M2), per section.
- **Full SAT** (`mock-exam`): R&W → 10-min break → Math, composite **400–1600**.
- **Pretest carve-out:** 2 unscored items per module, excluded from the score and tagged
  "Unscored" in review (⚠️ the 2/module count is convention, not CB-published).
- One-passage-per-question R&W model (matches digital SAT; no shared long passages).
- Scoring 200–800/section on a piecewise curve anchored to CB linear-form tables, with the
  easy-module cap; Desmos + formula sheet (Math); **working highlighter** (R&W + Math).
- Tools: timer (hideable), Mark for Review, answer eliminator, **Annotate/highlighter**.

### ⚠️ Approximated (inherent — CB does not publish the exact data)
- **Per-module domain counts:** ranges are ≈half the published *section* weightings (CB
  publishes section-level %, not per-module). Reasonable derivation, not official.
- **Score scaling:** there is **no official adaptive raw→scaled table** (CB scores the
  adaptive forms by per-item IRT). `lib/scoring/curve.ts` interpolates a percent-correct
  curve anchored to CB's published *linear* practice-test tables — closer than linear, still
  an estimate (labeled as such in the UI).
- **Easy-module cap (≈600):** prep-reported high-500s/low-600s; no CB number.
- **Routing threshold** `MODULE2_HARD_THRESHOLD = 2/3`: prep estimate, not CB-published.
- **Grid-in count** lands at 5–6 ≈99% of the time; the rare ±1 mirrors real form variation.

### ❌ Remaining gaps
- None of the previously-listed structural gaps remain. The items under "Approximated"
  above are inherent limits of public CB data, not implementation gaps — do **not** try to
  "fix" them with invented tables; keep them labeled as estimates.

---

## 4. Duplicate-question policy (implemented)

**Requirement:** a student must never see the same question twice **within one
test/practice**; across separate tests, avoid repeats **until the entire bank is
exhausted**, after which repeats are allowed.

Two distinct mechanisms (`lib/cb/client.ts`, `lib/cb/blueprint.ts`):
- **`exclude: Set<string>` — HARD.** Ids removed from the pool entirely. Used so Module 2
  can never reuse a Module 1 item (`SessionContext.finishModule` passes M1 ids).
- **`seen: Set<string>` — SOFT.** The user's previously-served ids (this section), loaded
  from `session_questions` via `loadSeen()` in `app/api/questions/route.ts` (RLS-scoped to
  the user; anonymous → empty set → feature simply off). Selection is **unseen-first**:
  all unseen items are exhausted before any seen item is reused, and the per-domain trim
  preserves that order so a trim never drops an unseen item for a seen one.

Guarantees (verified by the synthetic checks described in [§4.1](#41-verification)):
1. No duplicate id within a single module.
2. Zero M1/M2 overlap in a full mock.
3. With unseen available, **no** seen item is drawn.
4. Near-exhaustion: the few remaining unseen are used before any repeat.
5. Full exhaustion: a complete module is still returned (repeats allowed), still unique within the test.

Index supporting the lookup: `idx_sq_user_section_ext` (`supabase/migrations/0002_seen_index.sql`).

**Note:** in-progress (unpersisted) Module 1 items aren't in `session_questions` yet — that's
why M1→M2 dedup uses the explicit `exclude`, not `seen`.

### 4.1 Verification
The allocation/ordering/dedup logic is pure and was validated with standalone synthetic
runs (hundreds of trials, both sections) asserting the §3/§4 invariants. When changing
`blueprint.ts`, re-run an equivalent check before shipping — the trim-order interaction
between `seen` preference and difficulty bucketing is subtle (a naive "unseen-first within
each difficulty bucket" is **wrong**; unseen must be globally first per domain).

---

## 5. Full SAT (implemented)

A full SAT is **R&W (M1→M2) → 10-min break → Math (M1→M2)**, scored **400–1600**. Mode
`mock-exam`, started from `PracticeSetup`:

1. **Orchestration** — `SessionContext` runs each section as a full mock-full flow.
   `state.exam = { sections: ['rw','math'], index, results: [sectionSnapshot] }`. On a
   section's final module, `finishModule` snapshots it and either routes to `exam-break`
   (more sections) or `exam-report` (done). `startExamNextSection` loads the next section's
   Module 1 after the break. Routing and dedup are independent per section.
2. **Break** — `ExamBreak.jsx`: a standalone 10-minute timer; section time does not run.
3. **Composite** — `ExamReport.jsx` sums the two section scores via `compositeScore` (curve.ts).
4. **Persistence** — each section persists as its own `mock-full` row with `config.exam = true`
   (avoids a DB enum change; `'mock-exam'` is mapped in `persistSession`).

`drawModule` is unchanged — full SAT is composition + scoring + UI over the same generator.

**Possible future work** (not gaps, just extras): a single linked "exam" row in the schema;
a desk/scratch-paper affordance; per-question timing capture; Bluebook's line-reader/zoom tools.

---

## 6. Sources

College Board (primary):
- Structure / timing / break / adaptivity: <https://satsuite.collegeboard.org/sat/whats-on-the-test/structure>
- R&W (domain order, passage length 25–150): <https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing>
- Test spec overview (domain weights, ordering rules): <https://satsuite.collegeboard.org/media/pdf/digital-sat-test-spec-overview.pdf>
- Assessment framework (embedded pretest): <https://satsuite.collegeboard.org/media/pdf/assessment-framework-for-digital-sat-suite.pdf>
- Bluebook timing/navigation: <https://bluebook.collegeboard.org/help-center/how-does-timing-work-bluebook>
- Bluebook tools: <https://bluebook.collegeboard.org/students/tools>
- Calculator policy: <https://satsuite.collegeboard.org/sat/what-to-bring-do/calculator-policy>

⚠️ observed/derived (corroborated by PrepScholar, Princeton Review, Test Innovators, Khan
Academy): per-module 25/20 scored split, ~5–6 grid-ins at module end, timer auto-advance at 0.
