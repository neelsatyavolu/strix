-- Vocabulary practice progress (Leitner-box SRS per curated word_id).
-- Word content lives in-repo (lib/vocab/bank.ts); this table stores only progress.

create table if not exists public.vocab_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  word_id        text not null,
  box            int  not null default 1 check (box >= 1),
  due_at         timestamptz not null default now(),
  times_seen     int  not null default 0,
  times_correct  int  not null default 0,
  last_result    boolean,
  last_mode      text check (last_mode is null or last_mode in ('context', 'produce')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, word_id)
);

create index if not exists idx_vocab_progress_due
  on public.vocab_progress (user_id, due_at);

create index if not exists idx_vocab_progress_user
  on public.vocab_progress (user_id);

alter table public.vocab_progress enable row level security;

-- Owner full access (student-only feature; no tutor policies in v1).
drop policy if exists vocab_progress_self on public.vocab_progress;
create policy vocab_progress_self on public.vocab_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
