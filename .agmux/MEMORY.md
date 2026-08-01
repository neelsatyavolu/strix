# agmux Project Memory

> Shared across every agent, chat, and terminal session in this project.
> Prefer the `agmux-memory` MCP tools to read/write; this file is the projection.
> Entries marked **important** are must-remember constraints — honor them unless the user overrides.
> Do not store secrets (API keys, tokens, passwords).

- **Project**: `7d6ae6aa-83f5-4748-93de-d5cf01205774`
- **Updated**: 2026-08-01T02:14:45.113Z
- **Active entries**: 11
- **Important**: 5

## Important (must remember)

> Agents must treat these as binding constraints unless the user overrides them.

### ⚠ IMPORTANT: Vocab correctPool bank-only

- **id**: `12a6ff32-39f3-409f-af1b-a75d865cfd76`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-08-01T02:14:45.113Z
- **updated**: 2026-08-01T02:14:45.113Z

correctPool for usage MCQ must use only entry.correctPassage from bank. Never score generic generatedCorrect templates as correct — they produce false-corrects (e.g. 'New regulations were intended to vacate the environmental damage'). Wrong pool may still use generatedWrong as filler; prefer bank wrongs. Also audit wrongPassages for TRUE_WRONG (valid uses listed as distractors).

### ⚠ IMPORTANT: Vocab known = unflipped + correct only

- **id**: `58cd43bd-77ff-49d3-a23c-2635d2a03230`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-30T15:16:13.214Z
- **updated**: 2026-07-30T15:16:13.214Z

Vocabulary checkmark/known: only if student taps I know it (no flip) AND gets usage quiz right, or manual checklist. If they flip for definition first, correct usage does NOT mark known — word stays due for practice. last_mode flash_know vs flash_study. nextBox capped at MAX_BOX so study path never auto-masters.

### ⚠ IMPORTANT: Vocab quiz: no def in options

- **id**: `20ca93a6-1d91-4ce2-9fdb-c1b02af4d664`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-30T15:14:44.307Z
- **updated**: 2026-07-30T15:14:44.307Z

Usage MCQ options must NEVER include the dictionary definition (or 'means'/'defined as'). Correct/wrong passages test meaning from context only. lib/vocab/usageOptions.ts filters leaks; bank reviewed 2026-07-30 for quality.

### ⚠ IMPORTANT: Vocabulary feature v2 flashcards

- **id**: `5548fbe5-4610-4f47-8a9e-f84e1c6d42ab`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-29T03:03:29.436Z
- **updated**: 2026-07-29T03:03:29.436Z

Vocabulary is flashcard flow: word face → know it / flip definition → usage MCQ (which passage uses the word correctly). Bank is AODEFEN SAT 400 from 400.pdf TOC in lib/vocab/bank.ts (correctPassage + wrongPassages). Progress still public.vocab_progress Leitner. No produce mode. Regenerate scripts in scripts/aodefen-400-*.json.

### ⚠ IMPORTANT: Tutor live session sticky idle

- **id**: `460b5ec6-79cb-4c81-9b70-ba1246e05ad8`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-28T01:59:41.822Z
- **updated**: 2026-07-28T02:12:20.274Z

Presence must NEVER clear watchedLive or idle liveStudents (channel flaps under math). Only explicit session active:false after ~4s debounce. Student broadcasts: full snapshot on question change/tutor join/resubscribe; lightweight patches for ticks. Keep sticky last frame so Live Session never flashes 'not in a section' while student is still practicing. Student-side idle announce debounced ~900ms.

## Decisions

### ⚠ IMPORTANT: Vocab correctPool bank-only

- **id**: `12a6ff32-39f3-409f-af1b-a75d865cfd76`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-08-01T02:14:45.113Z
- **updated**: 2026-08-01T02:14:45.113Z

correctPool for usage MCQ must use only entry.correctPassage from bank. Never score generic generatedCorrect templates as correct — they produce false-corrects (e.g. 'New regulations were intended to vacate the environmental damage'). Wrong pool may still use generatedWrong as filler; prefer bank wrongs. Also audit wrongPassages for TRUE_WRONG (valid uses listed as distractors).

### ⚠ IMPORTANT: Vocab known = unflipped + correct only

- **id**: `58cd43bd-77ff-49d3-a23c-2635d2a03230`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-30T15:16:13.214Z
- **updated**: 2026-07-30T15:16:13.214Z

Vocabulary checkmark/known: only if student taps I know it (no flip) AND gets usage quiz right, or manual checklist. If they flip for definition first, correct usage does NOT mark known — word stays due for practice. last_mode flash_know vs flash_study. nextBox capped at MAX_BOX so study path never auto-masters.

### ⚠ IMPORTANT: Vocab quiz: no def in options

- **id**: `20ca93a6-1d91-4ce2-9fdb-c1b02af4d664`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-30T15:14:44.307Z
- **updated**: 2026-07-30T15:14:44.307Z

Usage MCQ options must NEVER include the dictionary definition (or 'means'/'defined as'). Correct/wrong passages test meaning from context only. lib/vocab/usageOptions.ts filters leaks; bank reviewed 2026-07-30 for quality.

### ⚠ IMPORTANT: Vocabulary feature v2 flashcards

- **id**: `5548fbe5-4610-4f47-8a9e-f84e1c6d42ab`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-29T03:03:29.436Z
- **updated**: 2026-07-29T03:03:29.436Z

Vocabulary is flashcard flow: word face → know it / flip definition → usage MCQ (which passage uses the word correctly). Bank is AODEFEN SAT 400 from 400.pdf TOC in lib/vocab/bank.ts (correctPassage + wrongPassages). Progress still public.vocab_progress Leitner. No produce mode. Regenerate scripts in scripts/aodefen-400-*.json.

### ⚠ IMPORTANT: Tutor live session sticky idle

- **id**: `460b5ec6-79cb-4c81-9b70-ba1246e05ad8`
- **kind**: decision
- **important**: true (must remember)
- **source**: agent
- **created**: 2026-07-28T01:59:41.822Z
- **updated**: 2026-07-28T02:12:20.274Z

Presence must NEVER clear watchedLive or idle liveStudents (channel flaps under math). Only explicit session active:false after ~4s debounce. Student broadcasts: full snapshot on question change/tutor join/resubscribe; lightweight patches for ticks. Keep sticky last frame so Live Session never flashes 'not in a section' while student is still practicing. Student-side idle announce debounced ~900ms.

### Vocab MCQ SAT-style pools

- **id**: `fa6df638-1201-42c7-af64-54d36c95de14`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-30T19:41:05.503Z
- **updated**: 2026-07-30T19:41:05.503Z

Usage MCQ pools (correctPassage + wrongPassages) for all 400 bank words rewritten via 80-agent pass under scripts/vocab-sat-mcq/. Correct = natural Digital-SAT academic sentence; wrongs = same register, clear misuse (wrong/opposite sense), not absurd jokes. No definition text in options. Merge source: fixed-00..79.json → lib/vocab/bank.ts. usageOptions prefers bank wrongs and rejects absurd/def-leak templates.

### No manual vocab checkmarks

- **id**: `9eb07ef5-23c0-4c8a-a18c-b16f9be48c7c`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-30T15:18:44.091Z
- **updated**: 2026-07-30T15:18:44.091Z

Vocabulary list is read-only for known status. Manual POST mode=mark disabled. Known only via practice: I know it (no flip) + correct usage quiz.

### Vocab known checklist

- **id**: `a08066e1-a823-4de7-846d-e5f087cf30d3`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-29T03:09:56.958Z
- **updated**: 2026-07-29T03:09:56.958Z

Vocabulary hub has a checklist of all 400 words. known = isMastered(box>5). Toggle via POST /api/vocab {mode:'mark', known:bool} → manual last_mode. Practice flash uses last_mode flash. Uncheck resets box=1 due now. Filters: all/todo/known/due/learning + search. Migration 0013_vocab_progress_modes.sql required for last_mode.

### electron-builder signing workaround

- **id**: `d8738b44-d2ed-476c-a6f5-e8b1e3216fc0`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-16T05:43:47.412Z
- **updated**: 2026-07-16T05:43:47.412Z

Do not use CSC_LINK for Strix on recent macOS — electron-builder set-key-partition-list uses cert password instead of keychain password. scripts/load-apple-creds.sh imports p12 + Apple Developer ID intermediates into a temp keychain, sets CSC_KEYCHAIN + CSC_NAME (without Developer ID Application: prefix), unsets APPLE_CERTIFICATE. Official ship: ./update.sh → dist:release → Blob.

### macOS signing & release

- **id**: `4dfc1b1d-6e19-478e-8c9c-169dfbdbece2`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-16T05:35:16.318Z
- **updated**: 2026-07-16T05:35:16.318Z

Strix desktop releases must be Developer ID signed + notarized via 1Password (Personal vault: Apple Developer ID Certificate + Xanom Apple Dev Creds). Commands: pnpm dist (unsigned), pnpm dist:signed, pnpm dist:release, ./update.sh (official ship). Loader: scripts/load-apple-creds.sh → agmux/scripts/load-apple-creds.sh. Shared docs: ~/Documents/GitHub/APPLE_SIGNING.md. Identity: Developer ID Application: Ramakrishna Satyavolu (VTQW687WBQ), Team VTQW687WBQ. Never commit p12/p8/passwords.

## Facts

### APPLE_SIGNING.md has electron-builder guidance

- **id**: `3af60966-4a0d-41df-917a-5ffb170baea4`
- **kind**: fact
- **source**: agent
- **created**: 2026-07-16T05:44:32.821Z
- **updated**: 2026-07-16T05:44:32.821Z

Shared doc ~/Documents/GitHub/APPLE_SIGNING.md documents electron-builder pitfalls (verified Strix 0.2.6): do not use CSC_LINK; import p12+DeveloperIDG2CA into temp keychain; CSC_KEYCHAIN + CSC_NAME without Developer ID Application: prefix; remap APPLE_API_KEY path/id for notary; restore keychain search list on cleanup. Reference: strix/scripts/load-apple-creds.sh, dist.sh, update.sh.
