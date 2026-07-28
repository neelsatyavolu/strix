# agmux Project Memory

> Shared across every agent, chat, and terminal session in this project.
> Prefer the `agmux-memory` MCP tools to read/write; this file is the projection.
> Entries marked **important** are must-remember constraints — honor them unless the user overrides.
> Do not store secrets (API keys, tokens, passwords).

- **Project**: `7d6ae6aa-83f5-4748-93de-d5cf01205774`
- **Updated**: 2026-07-28T01:59:41.822Z
- **Active entries**: 4

## Decisions

### Tutor live session sticky idle

- **id**: `460b5ec6-79cb-4c81-9b70-ba1246e05ad8`
- **kind**: decision
- **source**: agent
- **created**: 2026-07-28T01:59:41.822Z
- **updated**: 2026-07-28T01:59:41.822Z

Tutor Live Session must not drop on brief Realtime flaps. useTutorWatch debounces idle ~2.5s; missing presence must not immediately set liveStudents inactive. Math Desmos calc.state can oversize session broadcasts — sanitize in useStudentLive (MAX ~48k). reportCalc throttle 800ms.

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
