-- Backfill the spaced-repetition queue from existing practice history, so
-- questions missed before review enrollment existed still surface. Enrolls one
-- box-1 item (due now) per (user, question) whose MOST RECENT answer was wrong
-- and that isn't already scheduled. Idempotent: re-running is a no-op.
insert into public.review_items
  (user_id, external_id, section, domain, skill, difficulty, snapshot, box, due_at, last_result, times_seen)
select
  latest.user_id, latest.external_id, latest.section, latest.domain, latest.skill,
  latest.difficulty, latest.snapshot, 1, now(), false, 1
from (
  select distinct on (a.user_id, sq.external_id)
    a.user_id,
    sq.external_id,
    sq.section,
    sq.domain,
    sq.skill,
    sq.difficulty,
    sq.snapshot,
    a.is_correct
  from public.answers a
  join public.session_questions sq on sq.id = a.session_question_id
  where sq.external_id is not null
    and a.value is not null
    and coalesce((sq.snapshot->>'pretest')::boolean, false) = false
  order by a.user_id, sq.external_id, a.created_at desc
) latest
where latest.is_correct = false
on conflict (user_id, external_id) do nothing;
