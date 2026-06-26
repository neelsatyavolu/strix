-- Supports cross-session question dedup: look up every external_id a user has
-- already been served in a section, so we don't repeat a question until the
-- whole bank is exhausted. See app/api/questions/route.ts -> loadSeen().
create index if not exists idx_sq_user_section_ext
  on public.session_questions (user_id, section, external_id);
