-- Xanom sign-in (accounts.xanom.co). Supabase owns auth.users, so the Xanom
-- OIDC subject lives in a link table. Additive only.

create table if not exists public.xanom_links (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  xanom_sub   text not null unique,
  xanom_email text,
  linked_at   timestamptz not null default now()
);

alter table public.xanom_links enable row level security;

-- Users can see their own link (Settings shows "Signed in with Xanom").
-- All writes go through the service role in /api/xanom/callback.
drop policy if exists "xanom_links_select_own" on public.xanom_links;
create policy "xanom_links_select_own" on public.xanom_links
  for select using (auth.uid() = user_id);

revoke insert, update, delete, truncate on public.xanom_links from anon, authenticated;

-- Facts the callback needs that the admin API doesn't expose (whether a
-- password is set, Google identity). Look up by id, or by email when id is null.
create or replace function public.xanom_auth_user(p_id uuid default null, p_email text default null)
returns table (id uuid, email text, has_password boolean, has_google boolean)
language sql stable security definer set search_path = auth, public
as $$
  select u.id,
         u.email::text,
         coalesce(u.encrypted_password, '') <> '',
         exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'google')
  from auth.users u
  where (p_id is not null and u.id = p_id)
     or (p_id is null and p_email is not null and lower(u.email) = lower(p_email))
  limit 1;
$$;

-- Account pre-hijacking guard: clear the password and end every session.
create or replace function public.xanom_revoke_password_and_sessions(p_id uuid)
returns void
language plpgsql security definer set search_path = auth, public
as $$
begin
  update auth.users set encrypted_password = '' where id = p_id;
  delete from auth.refresh_tokens where user_id = p_id::text;
  delete from auth.sessions where user_id = p_id;
end;
$$;

revoke all on function public.xanom_auth_user(uuid, text) from public, anon, authenticated;
revoke all on function public.xanom_revoke_password_and_sessions(uuid) from public, anon, authenticated;
grant execute on function public.xanom_auth_user(uuid, text) to service_role;
grant execute on function public.xanom_revoke_password_and_sessions(uuid) to service_role;
