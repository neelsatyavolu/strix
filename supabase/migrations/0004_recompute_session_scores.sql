-- ---------------------------------------------------------------------------
-- 0004_recompute_session_scores
--
-- Skipped questions (no answer recorded) used to be counted as wrong in a
-- session's score_correct / score_total / accuracy. Going forward they're
-- excluded at persist time; this backfills existing rows so historical sessions
-- match. Operational (non-pretest) answered questions only — pretest items and
-- skipped (null/blank value) answers don't count. scaled_score is left as-is.
-- ---------------------------------------------------------------------------

with answered as (
  select
    a.session_id,
    a.is_correct
  from public.answers a
  join public.session_questions sq on sq.id = a.session_question_id
  where a.value is not null
    and btrim(a.value) <> ''
    and coalesce((sq.snapshot->>'pretest')::boolean, false) = false
),
recomputed as (
  select
    session_id,
    count(*)::int                                          as total,
    count(*) filter (where is_correct)::int                as correct
  from answered
  group by session_id
)
update public.practice_sessions ps
set
  score_correct = r.correct,
  score_total   = r.total,
  accuracy      = case when r.total > 0 then round(r.correct::numeric / r.total * 100)::int else 0 end
from recomputed r
where ps.id = r.session_id;

-- Sessions whose every answer was skipped have no row in `recomputed`; zero them
-- out so their stored score is consistent with "skipped doesn't count".
update public.practice_sessions ps
set score_correct = 0, score_total = 0, accuracy = 0
where not exists (
  select 1
  from public.answers a
  join public.session_questions sq on sq.id = a.session_question_id
  where a.session_id = ps.id
    and a.value is not null
    and btrim(a.value) <> ''
    and coalesce((sq.snapshot->>'pretest')::boolean, false) = false
);
