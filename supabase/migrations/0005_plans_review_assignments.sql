-- Proctorly — spaced-repetition review items + tutor assignments.
-- Adds the 'review' practice mode. Run in the Supabase SQL editor, or
-- `psql "$POSTGRES_URL_NON_POOLING" -f supabase/migrations/0002_plans_review_assignments.sql`.

-- ---------------------------------------------------------------------------
-- practice_sessions: allow a 'review' mode (spaced-repetition sessions).
-- ---------------------------------------------------------------------------
alter table public.practice_sessions
  drop constraint if exists practice_sessions_mode_check;
alter table public.practice_sessions
  add constraint practice_sessions_mode_check
  check (mode in ('drill', 'mock-m1', 'mock-full', 'review'));

-- ---------------------------------------------------------------------------
-- review_items — Leitner-box scheduling for missed questions.
-- Keyed by (user, external CB question id) so the same question dedups across
-- sessions. We snapshot content so review sessions can be served without CB.
-- ---------------------------------------------------------------------------
create table if not exists public.review_items (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  external_id              text not null,
  section                  text not null check (section in ('rw', 'math')),
  domain                   text,
  skill                    text,
  difficulty               text,
  snapshot                 jsonb not null,
  box                      int not null default 1,
  due_at                   timestamptz not null default now(),
  last_result              boolean,
  times_seen               int not null default 0,
  last_session_question_id uuid references public.session_questions (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, external_id)
);
create index if not exists idx_review_due on public.review_items (user_id, due_at);

-- ---------------------------------------------------------------------------
-- assignments — a tutor assigns a drill to one of their students.
-- ---------------------------------------------------------------------------
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  tutor_id       uuid not null references auth.users (id) on delete cascade,
  student_id     uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  section        text not null check (section in ('rw', 'math')),
  mode           text not null default 'drill',
  domain         text,
  skill          text,
  difficulty     text,
  question_count int  not null default 10 check (question_count between 1 and 50),
  due_at         timestamptz,
  status         text not null default 'assigned' check (status in ('assigned', 'completed')),
  session_id     uuid references public.practice_sessions (id) on delete set null,
  score_correct  int,
  score_total    int,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists idx_assign_student on public.assignments (student_id, status);
create index if not exists idx_assign_tutor on public.assignments (tutor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.review_items enable row level security;
alter table public.assignments  enable row level security;

-- review_items: owner full access; tutors may read their students' items.
create policy review_items_self on public.review_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy review_items_tutor_read on public.review_items
  for select using (public.is_tutor_of(user_id));

-- assignments: the assigning tutor (still active for that student) can manage;
-- the student can read their own + mark them completed.
create policy assignments_tutor on public.assignments
  for all
  using (auth.uid() = tutor_id and public.is_tutor_of(student_id))
  with check (auth.uid() = tutor_id and public.is_tutor_of(student_id));
create policy assignments_student_read on public.assignments
  for select using (auth.uid() = student_id);
create policy assignments_student_complete on public.assignments
  for update using (auth.uid() = student_id) with check (auth.uid() = student_id);
