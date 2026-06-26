-- Proctorly — initial schema + RLS.
-- Run in the Supabase SQL editor, or `supabase db push` with the CLI.

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  email        text,
  role         text not null default 'student' check (role in ('student', 'tutor')),
  target_score int  check (target_score between 400 and 1600),
  test_date    text,
  defaults     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- practice_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.practice_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  mode          text not null check (mode in ('drill', 'mock-m1', 'mock-full')),
  section       text not null check (section in ('rw', 'math')),
  config        jsonb not null default '{}'::jsonb,
  status        text not null default 'active' check (status in ('active', 'submitted', 'abandoned')),
  score_correct int,
  score_total   int,
  accuracy      int,
  scaled_score  int,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_sessions_user on public.practice_sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- session_questions — per-session snapshot of each served question
-- (we proxy questions live, so we snapshot content for review/stats)
-- ---------------------------------------------------------------------------
create table if not exists public.session_questions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.practice_sessions (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  ordinal       int not null,
  module        text default 'm1',
  external_id   text,
  section       text not null check (section in ('rw', 'math')),
  domain        text,
  skill         text,
  difficulty    text,
  snapshot      jsonb not null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_sq_session on public.session_questions (session_id, ordinal);

-- ---------------------------------------------------------------------------
-- answers
-- ---------------------------------------------------------------------------
create table if not exists public.answers (
  id                  uuid primary key default gen_random_uuid(),
  session_question_id uuid not null references public.session_questions (id) on delete cascade,
  session_id          uuid not null references public.practice_sessions (id) on delete cascade,
  user_id             uuid not null references auth.users (id) on delete cascade,
  value               text,
  is_correct          boolean,
  time_ms             int,
  flagged             boolean not null default false,
  created_at          timestamptz not null default now(),
  unique (session_question_id)
);
create index if not exists idx_answers_user on public.answers (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- tutor relationships (Phase 3)
-- ---------------------------------------------------------------------------
create table if not exists public.tutor_links (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users (id) on delete cascade,
  token       text not null unique,
  can_watch   boolean not null default true,
  can_chat    boolean not null default true,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.tutor_memberships (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references auth.users (id) on delete cascade,
  tutor_id    uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'revoked')),
  created_at  timestamptz not null default now(),
  unique (student_id, tutor_id)
);

create table if not exists public.tutor_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references public.practice_sessions (id) on delete cascade,
  student_id  uuid not null references auth.users (id) on delete cascade,
  sender_id   uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('student', 'tutor', 'ai')),
  body        text not null,
  ai_provider text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_tmsg_session on public.tutor_messages (session_id, created_at);

create table if not exists public.ai_threads (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references public.practice_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  messages    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- auto-create a profile row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.session_questions enable row level security;
alter table public.answers           enable row level security;
alter table public.tutor_links       enable row level security;
alter table public.tutor_memberships enable row level security;
alter table public.tutor_messages    enable row level security;
alter table public.ai_threads        enable row level security;

-- helper: is the current user an active tutor of <student>?
create or replace function public.is_tutor_of(student uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.tutor_memberships m
    where m.student_id = student and m.tutor_id = auth.uid() and m.status = 'active'
  );
$$;

-- profiles: owner full access; tutors can read their students' profiles
create policy profiles_self on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_tutor_read on public.profiles
  for select using (public.is_tutor_of(id));

-- practice_sessions: owner full access; tutor read
create policy sessions_self on public.practice_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sessions_tutor_read on public.practice_sessions
  for select using (public.is_tutor_of(user_id));

-- session_questions: owner full access; tutor read
create policy sq_self on public.session_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy sq_tutor_read on public.session_questions
  for select using (public.is_tutor_of(user_id));

-- answers: ONLY the owning student may write; tutor read-only (cannot answer)
create policy answers_self on public.answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy answers_tutor_read on public.answers
  for select using (public.is_tutor_of(user_id));

-- tutor_links: student manages own
create policy links_self on public.tutor_links
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- tutor_memberships: student manages; tutor can read their own membership
create policy memberships_student on public.tutor_memberships
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy memberships_tutor_read on public.tutor_memberships
  for select using (auth.uid() = tutor_id);

-- tutor_messages: student + their active tutor can read; either can send as themselves
create policy tmsg_read on public.tutor_messages
  for select using (auth.uid() = student_id or public.is_tutor_of(student_id));
create policy tmsg_insert on public.tutor_messages
  for insert with check (
    auth.uid() = sender_id
    and (auth.uid() = student_id or public.is_tutor_of(student_id))
  );

-- ai_threads: owner only
create policy ai_threads_self on public.ai_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
