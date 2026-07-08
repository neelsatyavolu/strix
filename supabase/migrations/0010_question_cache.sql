-- Durable server-side cache of normalized College Board questions, so serving,
-- grading and session re-scoring don't depend on the live CB qbank API being
-- reachable (it WAF-blocks bursts). Written through on every successful fetch;
-- stale rows still serve when CB is down.
--
-- Service-role only: RLS is enabled with no policies, so clients can never
-- read the answer key out of this table.

create table if not exists public.question_cache (
  id text primary key,
  section text not null check (section in ('rw', 'math')),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.question_cache enable row level security;
