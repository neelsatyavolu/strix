# Strix redesign — design spec (2026-09-23)

Full redesign of the app + landing page. Direction: **refined Mac-native** — calm,
quiet chrome, strong type hierarchy, fewer boxes, one confident accent (Strix blue).
Test-taking screens stay **Bluebook-faithful** (polish only). Visuals **and** IA change;
no backend/API changes. Ships directly on `main`, surface by surface.

## Principles

1. **One primary action per screen.** Everything else is secondary/ghost.
2. **Whitespace and hairlines over boxes.** Content sits on a white page; cards
   only group things that belong together. No card-in-card. No shadows on cards
   (hairline border only); shadows are for floating things (popovers, toasts, dialogs).
3. **Type does the hierarchy.** Page title → section heading → body → caption.
   Avoid UPPERCASE eyebrows (tiny table/column headers are the only exception).
4. **Numbers are the hero on data screens** — SF display, tabular figures, not mono.
5. **Every state designed:** loading (skeletons, not "Loading…" text), empty
   (EmptyState with a next action), error, read-only (tutor watching).
6. **Plain language.** "Practice", "Progress", "Plan" — not "Sessions", "Modules".

## Visual system (tokens in `styles/tokens/*`)

- Surfaces (light): page `--surface-app` = white; sidebar `--surface-sidebar` #F4F4F6;
  cards `--surface-card` white + `--border-1` hairline; wells `--sunken`.
  Dark: page #1A1A1C, sidebar #151517, card #232326.
- Interaction fills: `--hover`, `--pressed`, `--nav-active` / `--nav-active-fg`.
- Accent: `--brand-blue` (#2E5BFF). Semantic: success/warning/error; domains rw (violet) / math (green).
- Type: 13px UI body. Roles: `--role-page-title` (26/600), `--role-title-lg` (20),
  `--role-title-md` (17, section headings), `--role-title-sm` (15, card titles),
  `--role-body`, `--role-body-lg`, `--role-label`, `--role-caption`, `--role-metric` (big numbers).
- Radius: controls 8, cards 12, dialogs 16. Spacing: 4px grid; page padding 32/40.

## Components

Core (CSS Modules, `components/sixteen/core/`): Button, IconButton, Card, Badge,
Input, Select, SegmentedControl, Tabs, Toggle, Avatar, ScoreBadge, Kbd, plus new
layout primitives: **Page, PageHeader, Section, List/ListRow, Metric, EmptyState,
Skeleton**. Existing prop APIs are preserved; new code uses `className` + `*.module.css`
with token vars (no JS hover state, real `:hover`/`:focus-visible`).

## Shell & navigation

- Full-height sidebar (traffic lights sit over its top), unified 44px toolbar over
  the content with back button + title + actions. Right-side tutor pane unchanged.
- **History:** `useNav()` → `{ view, params, go, back, canGoBack, reset }`. `go` pushes;
  sidebar selection resets the stack; browser back/forward works (history.pushState);
  reload restores non-session views via the URL hash.

### Student nav (7)

| Item | Screen(s) |
|---|---|
| Home | Dashboard — "Up next" card (resume / due reviews / assignments / suggested drill), score summary, focus skills, recent activity |
| Practice | PracticeHub — tabs **Drill**, **Full-length** (module / section / full SAT), **Question bank** |
| Review | Spaced-repetition queue (due badge) |
| Plan | PlanHub — this week's plan + tutor assignments (student) |
| Progress | ProgressHub — tabs **Overview**, **Reading & Writing**, **Math**, **Full-length** (past modules/sections/exams analysis), **History** (all sessions) |
| Vocabulary | Vocabulary |
| Tutor | TutorHub — chat with your tutor + manage/invite tutors |

Footer: account menu (Settings, switch to Tutor view, theme, sign out).

### Tutor nav

Student switcher at the top of the sidebar. Items: Live (only while live), Home,
Progress, Review, Plan (assign + assigned). Everything is the watched student's data, read-only.

### Old screen ids → new home (kept as aliases so every `go()` keeps working)

`practice-setup`, `question-bank` → Practice · `stats`, `sessions`, `practice-modules`,
`practice-sections`, `practice-tests` → Progress · `student-assignments`,
`tutor-assignments`, `plan` → Plan · `tutor-invite`, `tutor-chat` → Tutor.
Result screens (`score-report`, `exam-report`, `session-detail`, `test-review`) share
one Result layout (score header, domain breakdown, filterable question list).

## Out of scope

API/DB changes, test-screen layout changes, new features beyond consolidation.

## Verification

`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` pass; light + dark screenshots of
each surface at 1280×832 and 980×640 (Electron minimum).
