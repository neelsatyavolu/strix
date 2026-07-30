-- Distinguish unflipped "I know it" vs flipped study path for vocab progress.

alter table public.vocab_progress
  drop constraint if exists vocab_progress_last_mode_check;

alter table public.vocab_progress
  add constraint vocab_progress_last_mode_check
  check (
    last_mode is null
    or last_mode in (
      'context',
      'produce',
      'flash',
      'flash_know',
      'flash_study',
      'manual'
    )
  );
