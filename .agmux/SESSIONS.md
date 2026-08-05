# agmux Session Handoffs

> Optional prior-session context for agents. Use only when you need history — not every turn.
> Prefer MCP tools `session_list` / `session_get` on server `agmux-memory`. This file is the projection.
> Each entry has a short summary and a transcript path you can Read for detail.

- **Project**: `7d6ae6aa-83f5-4748-93de-d5cf01205774`
- **Updated**: 2026-08-05T03:25:25.000Z
- **Sessions**: 9

## Disclosed math table/stimulus body

- **id**: `377171fe-69f3-47c5-976c-a1dc4243597f`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-08-05T03:25:25.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fcff1-152e-77d3-be6f-30d8be776672/chat_history.jsonl`

Disclosed SAIC items put tables/figures in `body` (stem in `prompt`). normalizeDisclosed ignored body and always set stimulusHtml=null, so Question Bank showed 'table above' with no table (e.g. 08160-DC / 263f9937). Fixed: map body→stimulusHtml; render stimulus above stem in QuestionMath + LiveTestView math; cache schema v2 to re-fetch pre-fix rows.

## Vary MCQ options per attempt

- **id**: `02f384cf-d226-4d5b-933c-8c5883f1e142`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-08-04T03:06:38.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fabc4-c6a0-7bf3-bd03-67abd20f6a2e/chat_history.jsonl`

User noted MCQ options were identical per word (memorizable). Fixed usageOptions: correctPool = bank correct + safe paraphrases (subject/setting swaps + light framing, never generic false-correct verb templates); wrong sampling mixes bank + generated from full pool (no longer locks to same 3 bank wrongs). Smoke test Vacate: 40/40 unique option sets, 9 distinct corrects.

## Fix disclosed question empty stem

- **id**: `b74e262b-37cf-42aa-b878-03dd35e18b93`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-08-01T22:42:45.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fbf78-df23-7981-8b97-068734207c9e/chat_history.jsonl`

Disclosed questions: (1) SAIC JSON is array — unwrap before normalize. (2) Dark mode: math-img PNGs are black-on-transparent so equations invisible — invert filter on .math-img / img[role=math] in dark theme (globals.css). Also SPR type for disclosed, allow role on sanitized img.

## Vocabulary tab

- **id**: `9178c54b-ebb7-413a-bc60-45bda3e2457a`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-28T18:07:52.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa9bf-cfb1-7473-90ea-f688f5a5c8fa/chat_history.jsonl`

Added student Vocabulary tab (Approach 1): curated ~130 DSAT high-utility word bank in lib/vocab/bank.ts with context MCQs + produce mode; Supabase vocab_progress (migration 0012 applied); APIs GET/POST /api/vocab and GET /api/vocab/session; UI screen with hub/practice/done; sidebar Studying → Vocabulary. Research notes in docs/vocab/digital-sat-vocabulary.md. Student-only, Leitner SRS mirrored from review schedule.

## Tutor teaching mode — implemented

- **id**: `87fef06d-be4d-4042-ab5e-7ddf68f5dcb2`
- **provider**: unknown
- **status**: idle
- **updated**: 2026-07-28T18:03:59.751Z
- **transcript**: _(none resolved)_

Implemented tutor "teaching mode" (laser pointer + annotation overlay on the student's screen) per docs/superpowers/specs/2026-07-28-tutor-teaching-mode-design.md. NOT COMMITTED — left in the working tree.

New files:
- lib/tutor/anchors.js — region registry. Points stored as { region, x, y } where BOTH x and y are divided by the region's WIDTH (preserves aspect, so circles stay circles across the tutor's narrow mirror and the student's wide screen). Region ids are `${questionId}::${part}` (passage, stem, choice-A..D, spr, calc). encodePoint uses document.elementsFromPoint (topmost-first = innermost region wins). Unknown region on receive => stroke dropped, never misplaced. Also regionPlacement/scrollRegionIntoView for the off-screen hint.
- lib/tutor/useTeachMode.js — useTeachTutor (tools/capture/broadcast) + useTeachStudent (receiver).
- components/tutor/TeachContext.jsx, TeachRegion.jsx, TeachLayer.jsx, TeachToolbar.jsx.

Modified: realtime.js (teach/point/ink broadcast events + senders), useStudentLive.js (receive + mode on payloads), useTutorWatch.js (teach senders, mode:'review'), LiveTestView.jsx, QuestionRW.jsx, QuestionMath.jsx, ScoreReport.jsx (ReviewItem regions + "Show student"), SessionDetail.jsx (goto scroll), SixteenApp.jsx (hooks/provider/layer/toolbar/chip/review broadcast/watchedIsLive gating).

Key implementation decisions that DIVERGED from the written spec (spec has been updated to match):
1. Review.jsx is the spaced-repetition QUEUE dashboard, not a per-question review. The real completed-work surface is SessionDetail -> ReviewList -> ReviewItem (scrolling list of question cards, in ScoreReport.jsx). Review.jsx untouched.
2. Review co-nav = student broadcasts { active:true, mode:'review', sessionId } only; both sides render the same cards from the DB. SixteenApp derives this from view/viewProps — no review screen reports anything. Tutor auto-follows into session-detail once per session change.
3. Ink is keyed to a single `scope` (live question id while practicing, `session:<id>` while reviewing) instead of a per-payload qid gate — a review page holds many questions and clearing on focus change would be unusable.
4. Rendering is ONE fixed canvas redrawn on rAF (not per-region SVG + scroll listeners). Scroll/resize handled for free.
5. Tutor capture surface only mounts for pen/highlighter/text; the laser tool uses a window pointermove listener so the tutor stays fully interactive. The capture surface forwards wheel to the scrollable element under the cursor so RW passages stay scrollable while drawing.

Verification: pnpm lint (0 errors, 26 pre-existing warnings), pnpm exec tsc --noEmit (clean), pnpm build (compiled successfully). No manual two-window runtime test was performed.

CAUTION for the next agent: SixteenApp.jsx, useStudentLive.js, useTutorWatch.js, LiveTestView.jsx also carry UNCOMMITTED changes from an earlier session (chat multi-line, OptionRow, TutorPanel, TutorChat, ChatComposer). Do not assume the whole diff on those files is teaching-mode work.

## Chat multi-line + live session flap

- **id**: `fb10500d-62e3-4564-8d1b-bd18bac11131`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-28T02:12:25.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa66d-e83b-7750-924a-c480963e9f24/chat_history.jsonl`

Hardened live session: presence never clears watchedLive; only session active:false idles after 4s. Student sends full snapshot on question change / tutor join / resubscribe, patches for timer ticks. Sticky last frame kept while waiting. Oversized full payloads trimmed. Idle announce debounced 900ms on student side.

## Tutor MCQ correct clarity

- **id**: `04ad5e75-8f07-4896-93fd-78d9190fa150`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-28T02:08:06.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa043-96a9-76f3-abbd-52691d38373a/chat_history.jsonl`

MCQ tutor live clarity: OptionRow endLabel + tinted correct/wrong fill; LiveTestView labels Student · Correct / Correct / Student so right picks are obvious.

## Added "I've done this already" on practice questions

- **id**: `b78e564e-a704-4e22-bdad-2cc842874350`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-26T20:51:55.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa02a-8860-77d2-87bf-b79d16c7289e/chat_history.jsonl`

Committed and pushed feat: permanent I've done this already (7b9997b) to main. Left untracked .agmux/.claude/.grok. Switched gh auth to neelsatyavolu for push.

## APPLE_SIGNING.md electron-builder notes

- **id**: `efc2e359-868d-4544-9404-fb319bbd3a32`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-16T05:44:36.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019f6968-fb53-7192-9190-259f4724a4ee/chat_history.jsonl`

Updated ~/Documents/GitHub/APPLE_SIGNING.md with electron-builder section: never CSC_LINK (set-key-partition-list bug), use CSC_KEYCHAIN + stripped identity, Tauri vs EB notary env remap, Strix paths, troubleshooting rows. Documented after Strix 0.2.6 notarized ship.
