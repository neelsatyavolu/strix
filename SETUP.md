# Proctorly — Setup

Proctorly is a **Mac desktop app** (Electron) with a **Vercel + Supabase** backend.
The practice experience (real College Board questions) needs no credentials; auth,
saved progress, and live tutoring use Supabase.

## Backend (already provisioned)

- **Vercel project** `proctorly` — production at <https://proctorly-rho.vercel.app>.
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
   - `https://proctorly-rho.vercel.app/auth/callback`
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
pnpm dist     # build the self-contained Mac .app/.dmg → dist-app/
```

## Deploy

```bash
vercel deploy --prod   # env already set in Vercel
```
To make tutor invite links openable by anyone, set Vercel **Deployment Protection**
to *Only Preview Deployments* (Settings → Deployment Protection) so production is public.
