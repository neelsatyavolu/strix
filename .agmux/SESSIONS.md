# agmux Session Handoffs

> Optional prior-session context for agents. Use only when you need history — not every turn.
> Prefer MCP tools `session_list` / `session_get` on server `agmux-memory`. This file is the projection.
> Each entry has a short summary and a transcript path you can Read for detail.

- **Project**: `7d6ae6aa-83f5-4748-93de-d5cf01205774`
- **Updated**: 2026-07-28T02:00:07.000Z
- **Sessions**: 4

## Chat multi-line + live session flap

- **id**: `fb10500d-62e3-4564-8d1b-bd18bac11131`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-28T02:00:07.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa66d-e83b-7750-924a-c480963e9f24/chat_history.jsonl`

ChatComposer multi-line auto-grow. Tutor live-session math flicker: debounce idle 2.5s in useTutorWatch (presence gaps no longer clear live immediately), strip oversized Desmos calc from session broadcast, reportCalc 800ms, soft-debounce live-session nav leave.

## Tutor view correct answer

- **id**: `04ad5e75-8f07-4896-93fd-78d9190fa150`
- **provider**: Grok
- **status**: idle
- **updated**: 2026-07-26T21:13:01.000Z
- **transcript**: `/Users/neel/.grok/sessions/%2FUsers%2Fneel%2FDocuments%2FGitHub%2Fstrix/019fa043-96a9-76f3-abbd-52691d38373a/chat_history.jsonl`

Tutor live view shows correct answer during practice: broadcast includes question id; LiveTestView fetches key via grade reveal API and highlights MCQ correct/wrong + SPR correct answer.

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
