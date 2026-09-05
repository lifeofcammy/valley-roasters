-- Harden authentication support functions and prevent customers from
-- promoting their own profile to an approved or admin account.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    execute 'alter function public.is_admin() set schema private';
  end if;
end;
$$;
alter function private.is_admin() set search_path = '';
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

alter function public.handle_new_user() set search_path = '';
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

alter function public.handle_updated_at() set search_path = '';
revoke all on function public.handle_updated_at() from public, anon, authenticated;

alter function public.get_effective_price(uuid, uuid) set search_path = '';
revoke all on function public.get_effective_price(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_effective_price(uuid, uuid) to service_role;

create or replace function private.protect_profile_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and not private.is_admin()
     and (
       new.id is distinct from old.id
       or new.email is distinct from old.email
       or new.role is distinct from old.role
       or new.is_approved is distinct from old.is_approved
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.square_customer_id is distinct from old.square_customer_id
       or new.notes is distinct from old.notes
       or new.internal_notes is distinct from old.internal_notes
       or new.square_price_category_id is distinct from old.square_price_category_id
       or new.always_charge_delivery is distinct from old.always_charge_delivery
       or new.created_at is distinct from old.created_at
     ) then
    raise exception 'Only administrators can update profile authorization fields'
      using errcode = '42501';
  end if;

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
