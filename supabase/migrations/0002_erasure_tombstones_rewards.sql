-- =====================================================================================================================
-- Numeria · 0002_erasure_tombstones_rewards.sql  (applies on top of 0001_init.sql)
--
-- 1. GDPR erasure leaves a TOMBSTONE. erase_child() used to hard-delete the child with no trace, so a sibling device
--    that still held the child re-inserted it on its next push (upsert = INSERT when the row is gone). Now:
--      * public.erased_children keeps only (child_id, org_id, erased_at): no personal data, just the fact of erasure.
--      * families read it (is_org_member) so every device learns about erasures on pull and drops local data.
--      * a BEFORE INSERT trigger on children rejects any insert / upsert of an erased id, for every role
--        (owner, guardian, service_role, direct SQL), so a stale device cannot bring the child back.
-- 2. Reward claims are MONOTONIC on the server: claimed_at and unlocked_at keep the earliest value ever written, so a
--    newer edit of the title from a device that never saw the claim cannot erase it.
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor of the existing project and press "Run".
-- It is idempotent: tables/indexes use IF NOT EXISTS, functions use CREATE OR REPLACE, triggers and policies are
-- dropped and re-created, grants/revokes are repeatable.
--
-- Verified with the automated RLS suite in supabase/tests (11_erasure_and_rewards.sql).
-- =====================================================================================================================

begin;

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Erased children (tombstones for GDPR erasure)
-- ---------------------------------------------------------------------------------------------------------------------

create table if not exists public.erased_children (
  child_id  uuid primary key,
  org_id    uuid not null references public.organizations (id) on delete cascade,
  erased_at timestamptz not null default now()
);
create index if not exists erased_children_org_idx on public.erased_children (org_id);

alter table public.erased_children enable row level security;

drop policy if exists erased_children_select on public.erased_children;
create policy erased_children_select on public.erased_children for select to authenticated
  using (public.is_org_member(org_id));

-- Only erase_child() (security definer) writes here. Clients may read their organization's tombstones and nothing else.
revoke all on table public.erased_children from anon, public, authenticated;
grant select on table public.erased_children to authenticated;

-- A child id that was erased can never be written again. BEFORE INSERT also covers INSERT … ON CONFLICT (an upsert of a
-- missing row is an insert). Security definer: the check must see every tombstone, whatever the caller's org.
create or replace function public.tg_children_erased_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.erased_children e where e.child_id = new.id) then
    raise exception 'child % was erased and cannot be written again', new.id using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.tg_children_erased_guard() from public, anon, authenticated;

-- Trigger names run in alphabetical order: children_05_erased fires before children_10_guard and children_20_lww.
drop trigger if exists children_05_erased on public.children;
create trigger children_05_erased before insert or update on public.children
  for each row execute function public.tg_children_erased_guard();

-- GDPR erase: hard delete of the child and its data, plus a tombstone (written first, in the same transaction).
create or replace function public.erase_child(p_child_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  select ch.org_id into v_org from public.children ch where ch.id = p_child_id;
  if v_org is null then
    return;  -- already gone (its tombstone, if any, is kept)
  end if;
  if not public.has_org_role(v_org, array['owner', 'admin']) then
    raise exception 'only owners and admins can erase a child' using errcode = '42501';
  end if;
  insert into public.erased_children (child_id, org_id) values (p_child_id, v_org)
  on conflict (child_id) do nothing;
  delete from public.children where id = p_child_id;  -- cascades to every child-scoped table
end;
$$;

revoke all on function public.erase_child(uuid) from public, anon;
grant execute on function public.erase_child(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. Monotonic reward claims / unlocks
-- ---------------------------------------------------------------------------------------------------------------------

-- Runs after rewards_20_lww (LWW may skip a stale write; a surviving write keeps the earliest unlock/claim).
-- least() ignores NULLs in Postgres, so this is "earliest non-null value of old and new".
create or replace function public.tg_rewards_monotonic()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.claimed_at  := least(old.claimed_at, new.claimed_at);
    new.unlocked_at := least(old.unlocked_at, new.unlocked_at);
  end if;
  return new;
end;
$$;

revoke all on function public.tg_rewards_monotonic() from public, anon, authenticated;

drop trigger if exists rewards_30_monotonic on public.rewards;
create trigger rewards_30_monotonic before update on public.rewards
  for each row execute function public.tg_rewards_monotonic();

commit;

-- Ask PostgREST to pick up the new table and function signatures immediately.
notify pgrst, 'reload schema';
