# Strix — Setup

Strix is a **Mac desktop app** (Electron) with a **Vercel + Supabase** backend.
The practice experience (real College Board questions) needs no credentials; auth,
saved progress, and live tutoring use Supabase.

## Backend (already provisioned)

- **Vercel project** `proctorly` — production at <https://strixprep.com>.
- **Supabase** provisioned via the Vercel Marketplace integration; env vars
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_*`) live in Vercel and pull locally with
  `vercel env pull .env.local`.
- Schema + RLS: `supabase/migrations/0001_init.sql` (already applied; re-apply with
  `set -a; . ./.env.local; set +a; psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/0001_init.sql`).

## Google sign-in (one-time config you do)

The button + flow are wired (web redirect; desktop opens your system browser via a
loopback). To turn it on:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth client ID*
   → type **Web application**. Add this **Authorized redirect URI** (your Supabase
   project's callback): `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase dashboard** → Authentication → **Providers → Google** → enable, paste
   the Client ID + Client Secret.
3. **Supabase** → Authentication → **URL Configuration → Redirect URLs** → add all
   three (web prod, web dev, desktop loopback):
   - `https://strixprep.com/auth/callback`
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:41639/auth/callback`

Email + password works without any of this.

## AI tutor

No keys — each user connects **their own ChatGPT / Grok subscription** inside the
desktop app (Tutor panel → Connect). Handled by the Electron main process.

## Run

```bash
pnpm install
pnpm dev      # web only, http://localhost:3000
pnpm app      # desktop app (Electron + dev server)
pnpm dist     # unsigned Mac .app/.dmg → dist-app/ (local only)
```

## macOS code signing & notarization

Public downloads must be **Developer ID–signed and notarized**. Credentials live in
**1Password** (never in git). Shared how-to:

- `~/Documents/GitHub/APPLE_SIGNING.md` — items, env vars, troubleshooting
- Loader: `scripts/load-apple-creds.sh` → sources `agmux/scripts/load-apple-creds.sh`

| Command | Result |
|---------|--------|
| `pnpm dist` | Unsigned (fast local package) |
| `pnpm dist:signed` | Developer ID sign only (1Password) |
| `pnpm dist:release` | Developer ID + **notarize + staple** |
| `./update.sh` | Official ship: version bump + `dist:release` + Vercel Blob upload |

Prerequisites for signed builds:

1. `brew install 1password-cli` and `op signin`
2. Access to vault **Personal** items: **Apple Developer ID Certificate** (`.p12`) and **Xanom Apple Dev Creds** (notary API key)
3. Xcode CLT (`xcode-select --install`) for `codesign` / `notarytool`

Verify a build:

```bash
codesign -dv --verbose=2 dist-app/mac-arm64/Strix.app
spctl --assess --type execute --verbose dist-app/mac-arm64/Strix.app
```

## Deploy (web)

```bash
vercel deploy --prod   # env already set in Vercel
```
To make tutor invite links openable by anyone, set Vercel **Deployment Protection**
to *Only Preview Deployments* (Settings → Deployment Protection) so production is public.

## Release desktop app (production DMG)

```bash
./update.sh              # patch bump + signed/notarized build + Blob upload
./update.sh 0.3.0        # explicit version
./update.sh --unsigned   # emergency only — do not ship to users
```
