-- Tutor feedback on an assignment — a free-text note the student can read.
-- Readable by the student (assignments_student_read) and writable by the
-- assigning tutor (assignments_tutor); no policy changes needed.
alter table public.assignments add column if not exists feedback text;
