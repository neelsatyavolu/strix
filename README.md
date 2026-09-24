# Strix

Free digital SAT practice for Mac and the web — real College Board question-bank
questions, a test screen that works like Bluebook, adaptive modules scored on the
400–1600 scale, and tutoring (bring your own ChatGPT/Grok, or invite a human tutor
who can watch live).

**Use it:** [strixprep.com](https://strixprep.com)

## Stack

- **Next.js 16** (App Router) — marketing page at `/`, the app at `/app` (a client SPA in `components/sixteen/`), API routes in `app/api/`
- **Supabase** (Postgres + Auth + Realtime) — accounts, saved progress, live tutoring
- **Electron** — the macOS desktop wrapper (`electron/`)
- Questions are fetched live from the College Board question bank (`lib/cb/`) and cached

## Getting started

Requires Node 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev                     # http://localhost:3000
```

Create a free [Supabase](https://supabase.com) project and add a `.env.local`:

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Accounts, progress, tutoring |
| `SUPABASE_SERVICE_ROLE_KEY` | Sign-up and the question cache (server-only — never expose) |
| `POSTGRES_URL_NON_POOLING` | Applying migrations with `psql` |
| `NEXT_PUBLIC_DESMOS_API_KEY` | Optional — Desmos calculator |
| `NEXT_PUBLIC_DOWNLOAD_URL`, `DOWNLOADS_BLOB_BASE` | Optional — Mac app download links |
| `NEXT_PUBLIC_DEV_SEED_EMAILS` | Optional — accounts allowed to use the Developer tab |
| `CODEX_MODEL`, `GROK_MODEL` | Optional — AI tutor model overrides |

Then apply the schema:

```bash
for f in supabase/migrations/*.sql; do psql "$POSTGRES_URL_NON_POOLING" -f "$f"; done
```

Email + password sign-in works out of the box; Google sign-in needs OAuth setup
(see [SETUP.md](SETUP.md)).

Other scripts:

| Command | What it does |
|---|---|
| `pnpm app` | Next dev server + the Electron desktop app |
| `pnpm dist` | Unsigned macOS `.app` / `.dmg` in `dist-app/` |
| `pnpm lint` | ESLint |
| `pnpm exec tsc --noEmit` | Type check |
| `pnpm test` | Unit tests (`test/*.test.mjs`) |
| `pnpm build` | Production build |

## Privacy

Strix counts anonymous usage with the developer's own cookieless analytics at
`analytics.n3el.dev` (details at [strixprep.com/privacy](https://strixprep.com/privacy)):

- **Website / web app** — `app/layout.tsx` loads `https://analytics.n3el.dev/p.js`, which sends
  the page path (no query string), the referrer and download-link clicks. No cookies, no
  stored IP addresses, no personal data.
- **Mac app** — `electron/heartbeat.cjs` sends at most one ping per UTC day with a random
  install ID, app version, macOS version, CPU arch and channel. Nothing about your account or
  practice is sent.
- **Opt out** — Settings → Privacy → "Share anonymous usage stats" in the Mac app stops the
  heartbeat and the page-view beacon inside the app window.

## Contributing

Issues and pull requests are welcome. Before opening a PR, make sure
`pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` pass. Project conventions
(file layout, styling with design tokens + CSS Modules, JSX vs TS by layer) are in
[AGENTS.md](AGENTS.md); the design system is described in
[docs/superpowers/specs/2026-09-23-redesign-design.md](docs/superpowers/specs/2026-09-23-redesign-design.md).

## License

[MIT](LICENSE) © Neel Satyavolu

Strix is an independent study tool and is not affiliated with or endorsed by
College Board. SAT is a trademark registered by College Board. Questions are
fetched from the College Board question bank for personal practice; score
conversions use a representative curve and are an estimate, not an official score.
