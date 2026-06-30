-- ---------------------------------------------------------------------------
-- 0008_assignment_full_tests.sql
-- Extend assignments beyond drills: tutors can retract open assignments and
-- assign a full-length SAT, a single full section, or a single module — with a
-- specific Bluebook official test (5–10) or the randomized Question Bank.
-- ---------------------------------------------------------------------------

-- A full SAT covers both sections, so section is null for those.
alter table public.assignments
  alter column section drop not null;

-- Allow retracting an open assignment (soft; the row is kept).
alter table public.assignments
  drop constraint if exists assignments_status_check;
alter table public.assignments
  add constraint assignments_status_check
    check (status in ('assigned', 'completed', 'retracted'));

-- The assignment type, stored as the practice engine's own mode strings so the
-- student launch is a near-passthrough.
alter table public.assignments
  drop constraint if exists assignments_mode_check;
alter table public.assignments
  add constraint assignments_mode_check
    check (mode in ('drill', 'mock-m1', 'mock-full', 'mock-exam'));

-- New target/result columns (all null for legacy drill rows).
alter table public.assignments
  add column if not exists bluebook_test smallint check (bluebook_test between 5 and 10),
  add column if not exists module_key    text     check (module_key in ('m1', 'easy', 'hard')),
  add column if not exists scaled_score  smallint, -- section (mock-full) or composite (mock-exam) shown on completion
  add column if not exists session_id_2  uuid references public.practice_sessions (id) on delete set null; -- Math half of a full SAT
