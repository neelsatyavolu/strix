-- Proctorly — profile pictures (avatars).
-- Run in the Supabase SQL editor, or `supabase db push` with the CLI.

-- ---------------------------------------------------------------------------
-- profiles.avatar_url — public URL of the user's uploaded picture (nullable)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;

-- ---------------------------------------------------------------------------
-- avatars storage bucket — public read, 1MB cap, images only.
-- The size limit + mime allowlist are enforced server-side as defense in
-- depth alongside the client-side check.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true,
  1048576,  -- 1 MiB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- RLS on storage.objects for the avatars bucket.
-- Files live at "{user_id}/avatar" — anyone may read (public bucket); only the
-- owner may insert/replace/delete their own. Upsert needs SELECT + INSERT +
-- UPDATE, so all three are granted to the owner (read is covered by the public
-- select policy).
-- ---------------------------------------------------------------------------
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
