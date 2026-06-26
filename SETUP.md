# Proctorly — Setup

The app builds and runs against the live College Board question API with **no
credentials**. Auth, data persistence, the AI tutor, and deploy need the keys
below. Create a file named `.env.local` in the repo root with these values.

```bash
# --- Supabase (Postgres + Auth + Realtime) ---
# Free project at https://supabase.com/dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Vercel AI Gateway (ChatGPT + Grok) ---
# https://vercel.com/dashboard → AI Gateway → API Keys
# (local dev only; Vercel deploys inject this via OIDC automatically)
AI_GATEWAY_API_KEY=

# --- App ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 1. Supabase (needed for sign-in + saving progress)

1. Create a project at <https://supabase.com/dashboard>.
2. Copy the three keys above from **Project Settings → API**.
3. Apply the schema: open **SQL Editor**, paste the contents of
   `supabase/migrations/0001_init.sql`, and run it. (Or, with the Supabase CLI:
   `supabase link --project-ref <ref>` then `supabase db push`.)
4. (Optional) Enable **Google** under **Authentication → Providers**. Email +
   password works without this.

## 2. Vercel AI Gateway (needed for the AI tutor)

1. <https://vercel.com/dashboard> → **AI Gateway** → create an API key.
2. Put it in `AI_GATEWAY_API_KEY`. The gateway routes to both
   `openai/gpt-5.4-mini` (ChatGPT) and `xai/grok-4.3` (Grok).

## 3. Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

## 4. Deploy (end of build)

`vercel` (or the Vercel dashboard). Set the same env vars in the Vercel project;
the AI Gateway key is optional there (OIDC covers it).
