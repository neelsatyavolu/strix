# AGENTS.md

## Shared Codex/Grok integration

Use [shared-ai-auth](https://github.com/neelsatyavolu/shared-ai-auth) for OAuth protocol helpers and live model choices. Strix web uses a pasted Codex callback URL or Grok code; Electron uses localhost callbacks and Keychain. The optional project blacklists are in `lib/ai/web/models.ts` and `electron/ai.cjs`; new models show by default. Keep token and callback values out of logs.

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

Strix (dir name `proctorly`) — a digital SAT practice app. Next.js 16 App Router web backend + an Electron macOS desktop wrapper, with a Supabase (Postgres) backend. Production: strixprep.com.

## Package manager

Use **pnpm** (there is a `pnpm-lock.yaml`). Don't use npm/yarn.

## Running the app

- `pnpm dev` — **web only**, http://localhost:3000. Use this for almost all work.
- `pnpm app` — Next dev **+ Electron desktop** together (via concurrently). Only needed when working on Electron/desktop behavior.
- `pnpm dist` — unsigned macOS `.app`/`.dmg` (local packaging only).
- `pnpm dist:signed` — Developer ID sign via 1Password (no notarize).
- `pnpm dist:release` — Developer ID **+ notarize + staple** (public download).
- `./update.sh` — official release: version bump + `dist:release` + Vercel Blob upload.

Apple signing/notarization uses 1Password (see `~/Documents/GitHub/APPLE_SIGNING.md` and `scripts/load-apple-creds.sh`). Never commit `.p12`/`.p8`/passwords.

## Verify before declaring work complete

There is **no test framework**. Before claiming a change is done, run all three and confirm they pass:

```
pnpm lint
pnpm exec tsc --noEmit   # no typecheck script exists; run tsc directly
pnpm build
```

The `/verify` skill runs this sequence.

## Environment setup

There is **no `.env.example`**. Pull env vars from Vercel: `vercel env pull .env.local`. Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`, `DOWNLOADS_BLOB_BASE`. Google OAuth client setup is manual (see SETUP.md).

## Structure & conventions

- App Router under `app/` (routes + `app/api/`). Components under `components/` (`sixteen/` is the core design system; `tutor/`, `marketing/`). Shared logic under `lib/` (`supabase/`, `cb/` College Board API client, `auth/`, `scoring/`).
- **Mixed language by layer:** API routes / `lib` are TypeScript (`.ts`); UI components are mostly JS/JSX (`.jsx`). Match the extension of the file you're editing — don't convert JSX to TSX.
- 2-space indentation. Client components start with `'use client'`. Functional components only; prefer immutable patterns (no in-place mutation).
- `tsconfig.json` has `strict: true` — keep new TS strict-clean.
- No Tailwind/Prettier. Styling is CSS-in-JS + design tokens in `styles/`.

## Database

Migrations live in `supabase/migrations/` (the schema is already applied to production). To apply one locally: `psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/<file>.sql`.

## Git

Small project — commit directly to `main` (no required feature branch). Use conventional-commit prefixes (`feat:`, `fix:`, `refactor:`) to match existing history.

## macOS build gotchas

`pnpm build:icon` requires the macOS `iconutil` tool. Electron build config is in `electron-builder.config.cjs`; packaged output lands in `dist-app/mac-arm64/`. Official releases use `./update.sh` (Developer ID + notarize via 1Password — see SETUP.md).
