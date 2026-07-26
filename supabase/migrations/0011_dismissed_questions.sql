-- Questions a student has marked "I've done this already". Hard-excluded from
-- all future draws (drills and synthetic modules) so they never resurface.
create table if not exists public.dismissed_questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  external_id text not null,
  section     text not null check (section in ('rw', 'math')),
  created_at  timestamptz not null default now(),
  unique (user_id, external_id)
);
create index if not exists idx_dismissed_user_section
  on public.dismissed_questions (user_id, section);

alter table public.dismissed_questions enable row level security;

create policy dismissed_self on public.dismissed_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
