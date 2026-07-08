# Proctorly — Design Spec

**Date:** 2026-06-25
**Status:** Approved direction; building autonomously in phases.

Proctorly is a Mac-native-styled web app for digital-SAT practice. It pulls real
College Board questions, runs adaptive modules and targeted drills, scores them,
tracks stats over time, and offers two kinds of tutoring: an **AI tutor**
(ChatGPT + Grok via Vercel AI Gateway) and a **live human tutor** who can watch a
student's session in real time and chat. The visual design is the imported
"Sixteen" design system (claude.ai design project `375889de…`).

## Decisions (locked)

| Area | Decision |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript, deployed on Vercel |
| Questions | **Live proxy** to the College Board Question Bank API, with per-question caching in our DB |
| Backend | **Supabase** — Postgres + Auth + Realtime + Storage (hosted project) |
| AI tutor | **Vercel AI Gateway** — one key, both OpenAI + xAI via `provider/model` strings, with fallback |
| Auth methods | Email + password and Google OAuth (magic-link optional later) |
| Build cadence | Phased, but proceed phase→phase autonomously (no approval gate between phases) |
| Styling | Reuse the design's `tokens/*.css` + `styles.css` verbatim; port JSX screens/components to TSX with identical markup |

## Architecture

```
Next.js (App Router) on Vercel
├── app/                     route segments per screen
│   ├── (auth)/              sign-in / sign-up / onboarding
│   ├── (app)/               dashboard, practice, stats, tutor, settings (AppShell)
│   └── api/                 route handlers (server)
│       ├── questions/       proxy + cache of CB Question Bank
│       ├── sessions/        create/answer/submit, scoring
│       ├── tutor/ai/        AI tutor chat (AI Gateway, streaming)
│       └── tutor/invite/    human-tutor invites + permissions
├── lib/
│   ├── supabase/            server + browser clients, RLS-aware
│   ├── cb/                  College Board API client + normalizer
│   ├── scoring/             raw→scaled curve + adaptive routing
│   └── ai/                  Gateway client, tutor system prompts
├── components/              ported design-system primitives (TSX)
├── styles/tokens + styles.css   verbatim from the design
└── supabase/migrations/     SQL schema + RLS policies
```

Data flow: the browser never calls the CB API or AI providers directly. All
external calls go through Next.js route handlers (server) so keys stay secret,
content is cached, and tutor-mode rules are enforced server-side (a tutor's
client cannot submit answers — enforced by RLS + server checks, not just UI).

## College Board question integration (`lib/cb`)

Two upstream sources, normalized into one internal `Question` shape:

1. **Question Bank (primary).**
   - List: `POST https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions`
     body `{asmtEventId:99, test:1|2, domain:"<codes>"}` → stubs
     (`questionId, external_id, ibn, skill_cd, primary_class_cd, difficulty`).
   - Detail (`external_id` items): `POST .../get-question` `{external_id}` →
     `type` (`mcq`|`spr`), `stem` (HTML), `stimulus` (HTML passage), `answerOptions[]`,
     `keys`/`correct_answer`, `rationale` (HTML). Math is **MathML** → KaTeX.
   - Detail (`ibn` released items): `GET https://saic.collegeboard.org/disclosed/{ibn}.json`.
     Math here is PNG images.
2. **Normalized internal shape** stored in Postgres `questions` table (cache):
   `id, source, section (rw|math), domain, skill, difficulty (E|M|H), type (mcq|spr),
   stem_html, stimulus_html, choices[] (id, html), correct[], rationale_html, raw_json`.

Rendering: sanitize all HTML (DOMPurify, server-side allowlist). Render MathML via
KaTeX (`mml`→ render). Reading = passage pane + question pane. Math = KaTeX choices
+ optional Desmos calculator (official Desmos API embed) + reference sheet + grid-in
input for `spr`.

**Legal note:** the CB endpoints are reverse-engineered and content is CB
copyright (personal/educational use). We proxy + cache for the signed-in user's
own practice; we do not redistribute a bulk dataset publicly. Surfaced to the user.

## Scoring & adaptivity (`lib/scoring`)

- Drill mode: per-question correct/incorrect, accuracy, median time — no scaled score.
- Module mode: Module 1 (mixed difficulty) → route to Module 2A (easier) or 2B (harder)
  using a correctness threshold (~⅔). R&W: 2×27 Q / 32 min. Math: 2×22 Q / 35 min.
- Scaled score: section 200–800, total 400–1600. We use a **representative IRT-style
  curve** (documented as approximate; real per-form equating tables are not public).
  Routing to the easy module caps the section (~590), reflected in the curve.

## AI tutor (`lib/ai`, `api/tutor/ai`)

- Vercel AI SDK + AI Gateway. Request: `{provider:'openai'|'xai', model, messages, questionContext}`.
  Model strings: `openai/gpt-5.4-mini`, `xai/grok-4.5` (configurable; `grok-4.3` deprecated). Streaming (SSE).
- System prompt encodes Proctorly's tutor persona (calm, Socratic, never just gives the
  answer during a scored module). `questionContext` grounds the model in the current item.
- Availability rules from the design: AI allowed in drills and outside modules; during a
  **scored** module the AI panel is restricted (no answer-giving) — enforced server-side.

## Live human-tutor mode (`api/tutor/invite`, Supabase Realtime)

- Student generates an invite link with permission toggles ("can watch", "can chat",
  never "can answer"). Tutor signs in, joins the session.
- Realtime: session state (current question, selections, flags, timer) broadcast on a
  Supabase Realtime channel; tutor sees it live. Chat persists to `tutor_messages`.
- RLS: a tutor can read the student's live session + send chat, but `answers` writes are
  restricted to the owning student. Enforced in DB policies + server route checks.

## Data model (Postgres)

`profiles` (1:1 auth.users — name, email, target score, defaults) ·
`questions` (CB cache, above) ·
`practice_sessions` (user_id, mode drill|module|full, section, config, status, scores) ·
`session_questions` (session_id, question_id, order, module 1|2a|2b) ·
`answers` (session_question_id, user_id, selected, is_correct, time_ms, flagged) ·
`tutor_links` (student_id, token, permissions, expires_at) ·
`tutor_memberships` (student_id, tutor_id, status) ·
`tutor_messages` (session_id|relationship, sender_id, role, body, ai_provider) ·
`ai_threads` (session_id, messages jsonb). All tables RLS-protected.

## Screen inventory (design → routes)

| Design screen | Route | Real-data wiring |
| --- | --- | --- |
| Onboarding | `/onboarding` | profile create, target score |
| Dashboard | `/` | latest score, resume session, drill tiles, recent sessions |
| PracticeSetup | `/practice/new` | section/mode/category/difficulty/length → create session |
| QuestionRW | `/session/[id]/rw` | real R&W item, highlighter, eliminator, palette, flag |
| QuestionMath | `/session/[id]/math` | real Math item, KaTeX, Desmos, grid-in, reference |
| ModuleReview | `/session/[id]/review` | between-module summary |
| ScoreReport | `/session/[id]/report` | scaled scores + per-category breakdown |
| Stats | `/stats` | score-over-time, per-domain accuracy, heatmap |
| TutorInvite | `/tutor/invite` | generate link, permissions |
| TutorChat | `/tutor/chat` | full-screen chat (human + AI) |
| Settings | `/settings` | profile, appearance, defaults, tutor management |
| TutorPanel / SessionStats | mounted panels | AI/human chat panel; live session stats overlay |

Plus role switch (student | tutor) and dark mode, as in `App.jsx`.

## Phasing (autonomous)

- **Phase 1 — Foundation + practice.** Next.js scaffold, design tokens/components ported,
  Supabase schema + auth (sign in/up, onboarding), CB question proxy+cache, PracticeSetup,
  QuestionRW + QuestionMath rendering real items, drill flow, answer persistence, Dashboard,
  Stats (basic), Settings. Score report for drills.
- **Phase 2 — AI tutor.** AI Gateway wiring, TutorPanel streaming chat (ChatGPT + Grok
  switch), question grounding, scored-module restrictions, AI thread persistence.
- **Phase 3 — Modules + live human tutor.** Full adaptive module engine (M1→M2A/2B),
  scaled scoring + ScoreReport + ModuleReview, tutor invites + permissions, Supabase
  Realtime live-watch, tutor chat, role enforcement (RLS). Deploy to Vercel.

## Credentials needed from user (parallel to build)

1. Hosted **Supabase** project: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (or authorize me to create one via Vercel Marketplace).
2. **Vercel AI Gateway** key: `AI_GATEWAY_API_KEY` (local dev; Vercel deploy can use OIDC).
3. **Google OAuth** client id/secret (optional; email+password works without it).
4. Vercel deploy (login/link) — at end of Phase 3.

## Risks / caveats

- CB endpoints can change or rate-limit; cache aggressively, degrade gracefully.
- Score curve is approximate (no public equating tables) — labeled in UI.
- Desmos embed requires their API key/script; reference sheet is static.
- Copyright posture: per-user personal practice, no public bulk redistribution.
