-- Harden authentication support functions and prevent customers from
-- promoting their own profile to an approved or admin account.
--
-- NOT YET APPLIED. Run in the Supabase dashboard SQL editor as one
-- transaction (the begin/commit below). After it succeeds, change this
-- header to "APPLIED <date> via the dashboard SQL editor" like
-- 20260729_account_pricing.sql.
--
-- Defensive revision (2026-09-05). This file's preconditions live only in
-- the production database, not in repo migrations, so every step checks
-- that the object it touches exists:
--   * The trigger compares protected columns through to_jsonb(), so a column
--     that does not exist on profiles (e.g. notes, stripe_customer_id) is
--     skipped instead of raising "record new has no field" on every update.
--   * Grants/revokes only run for functions that exist.
--   * The `set search_path = ''` pinning from the original draft is deferred:
--     those function bodies are not in git, and pinning breaks any body that
--     references a table without a schema prefix. Re-add it per function
--     only after reading its body in the dashboard.

begin;

-- Abort up front if the admin predicate everything below depends on is missing.
do $$
begin
  if to_regprocedure('public.is_admin()') is null
     and to_regprocedure('private.is_admin()') is null then
    raise exception 'is_admin() not found in public or private - verify the live schema before applying';
  end if;
end;
$$;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Move is_admin() into the private schema (idempotent) and tighten who may call it.
do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    execute 'alter function public.is_admin() set schema private';
  end if;
  if to_regprocedure('private.is_admin()') is not null then
    execute 'revoke all on function private.is_admin() from public, anon';
    execute 'grant execute on function private.is_admin() to authenticated, service_role';
  end if;
end;
$$;

-- Tighten execute grants on whichever support functions exist.
do $$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke all on function public.handle_new_user() from public, anon, authenticated';
    execute 'grant execute on function public.handle_new_user() to supabase_auth_admin';
  end if;
  if to_regprocedure('public.handle_updated_at()') is not null then
    execute 'revoke all on function public.handle_updated_at() from public, anon, authenticated';
  end if;
  if to_regprocedure('public.get_effective_price(uuid, uuid)') is not null then
    execute 'revoke all on function public.get_effective_price(uuid, uuid) from public, anon, authenticated';
    execute 'grant execute on function public.get_effective_price(uuid, uuid) to service_role';
  end if;
end;
$$;

-- Block non-admins from changing authorization/billing fields on their own
-- profile. Columns are compared through to_jsonb so a name that does not
-- exist on profiles is ignored rather than erroring.
create or replace function private.protect_profile_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  protected constant text[] := array[
    'id', 'email', 'role', 'is_approved',
    'stripe_customer_id', 'square_customer_id',
    'notes', 'internal_notes',
    'square_price_category_id', 'always_charge_delivery', 'created_at'
  ];
  new_row jsonb := to_jsonb(new);
  old_row jsonb := to_jsonb(old);
  col text;
begin
  if auth.uid() is null or private.is_admin() then
    return new;
  end if;

  foreach col in array protected loop
    if (new_row -> col) is distinct from (old_row -> col) then
      raise exception 'Only administrators can update profile authorization fields'
        using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$$;

revoke all on function private.protect_profile_authorization_fields() from public, anon, authenticated;

drop trigger if exists protect_profile_authorization_fields on public.profiles;
create trigger protect_profile_authorization_fields
before update on public.profiles
for each row execute function private.protect_profile_authorization_fields();

drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Authenticated users can view authorized profiles" on public.profiles;
drop policy if exists "Authenticated users can update authorized profiles" on public.profiles;

create policy "Authenticated users can view authorized profiles"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id or (select private.is_admin()));

create policy "Authenticated users can update authorized profiles"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id or (select private.is_admin()))
with check ((select auth.uid()) = id or (select private.is_admin()));

commit;
