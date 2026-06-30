-- Allow tutors to assign Bluebook practice test 11.
alter table public.assignments
  drop constraint if exists assignments_bluebook_test_check;

alter table public.assignments
  add constraint assignments_bluebook_test_check
    check (bluebook_test between 5 and 11);
