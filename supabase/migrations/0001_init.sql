-- =====================================================================================================================
-- Numeria · 0001_init.sql
--
-- Multi-tenant backend for families AND schools. Children never have accounts: adults (auth.users) belong to
-- organizations through memberships, and organizations own children. Teachers can READ the learning data of children
-- enrolled in their classes (parents consent by typing the class code) but can never modify it.
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor of a fresh project and press "Run".
-- It is idempotent: running it again on the same project is safe (tables/indexes use IF NOT EXISTS, functions use
-- CREATE OR REPLACE, triggers and policies are dropped and re-created).
--
-- Verified with the automated RLS suite in supabase/tests (see supabase/README.md).
--
-- Conventions
--   * Client-synced tables (children, progress, skill_mastery, attempts, sessions, rewards) use client-generated UUIDs
--     so a device can create rows offline. `updated_at` is the CLIENT edit time (last-writer-wins key, clamped so a
--     skewed clock cannot win forever); `synced_at` is the SERVER time the row last changed (pull cursor).
--   * Every table has RLS enabled. Policies only target the `authenticated` role; `anon` gets nothing.
--   * RLS helpers are SECURITY DEFINER with an empty search_path (fully-qualified names) to avoid recursion and
--     search_path hijacking.
-- =====================================================================================================================

begin;

-- ---------------------------------------------------------------------------------------------------------------------
-- 0. Generic helpers (no table references, so they can be created first)
-- ---------------------------------------------------------------------------------------------------------------------

-- 64 hex chars of strong randomness (gen_random_uuid uses pg_strong_random). Used for invite tokens.
create or replace function public.random_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text, 'UTF8')), 'hex');
$$;

-- 6-character class code without ambiguous characters (no I, O, 0, 1). 32 symbols → 32^6 ≈ 1.07e9 codes.
create or replace function public.new_join_code()
returns text
language plpgsql
volatile
security definer  -- must see every class (not only RLS-visible ones) to guarantee uniqueness
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  raw bytea;
  code text;
  i int;
begin
  loop
    raw := uuid_send(gen_random_uuid());        -- bytes 0..5 of a v4 UUID are fully random
    code := '';
    for i in 0..5 loop
      code := code || substr(alphabet, (get_byte(raw, i) % 32) + 1, 1);
    end loop;
    -- plpgsql resolves the table at run time, so this function can be created before public.classes exists.
    exit when not exists (select 1 from public.classes c where c.join_code = code);
  end loop;
  return code;
end;
$$;

-- updated_at for tables written by the server / dashboards (not by the offline sync engine).
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Last-writer-wins guard for client-synced rows: a stale write (older updated_at) is silently skipped, so a device
-- that was offline for a week cannot overwrite newer edits. updated_at is clamped to now()+10 min to neutralise
-- devices with a clock in the future. synced_at always records the server time of the change (pull cursor).
create or replace function public.tg_sync_lww()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now() + interval '10 minutes');
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;  -- keep the newer row
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

-- progress: optimistic concurrency. The client merges monotonically (stars max, unlocks OR...) and writes with
-- `where version = <the version it merged with>`; every write bumps the version.
create or replace function public.tg_progress_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now() + interval '10 minutes');
  new.synced_at := clock_timestamp();
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
  else
    new.version := 1;
  end if;
  return new;
end;
$$;

-- sessions are merged monotonically: minutes only grow, an ended session stays ended, the summary is kept.
create or replace function public.tg_sessions_merge()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now() + interval '10 minutes');
  if tg_op = 'UPDATE' then
    new.child_id   := old.child_id;
    new.started_at := least(old.started_at, new.started_at);
    new.minutes    := greatest(old.minutes, new.minutes);
    new.ended_at   := coalesce(new.ended_at, old.ended_at);
    new.summary    := coalesce(new.summary, old.summary);
    new.updated_at := greatest(old.updated_at, new.updated_at);
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

-- attempts are append-only.
create or replace function public.tg_attempts_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'attempts are append-only' using errcode = '42501';
  end if;
  new.synced_at := clock_timestamp();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------------------------------------------------

-- Adult profile, 1:1 with auth.users (created by trigger on sign-up).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text not null default '' check (char_length(display_name) <= 80),
  locale       text not null default 'es-ES' check (char_length(locale) between 2 and 16),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('family', 'school')),
  name       text not null check (char_length(btrim(name)) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null,
  settings   jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'admin', 'teacher', 'guardian')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships (user_id);

create table if not exists public.org_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  email       text not null check (email = lower(email) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  role        text not null check (role in ('admin', 'teacher', 'guardian')),
  token       text not null unique default public.random_token(),
  invited_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);
create index if not exists org_invites_org_idx on public.org_invites (org_id);
create index if not exists org_invites_email_idx on public.org_invites (email) where accepted_at is null;
create unique index if not exists org_invites_pending_uniq on public.org_invites (org_id, email) where accepted_at is null;

-- Children: minimal data (nickname, grammatical gender, grade, companion). The id is generated on the device.
create table if not exists public.children (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations (id) on delete cascade,
  nickname   text not null check (char_length(btrim(nickname)) between 1 and 40),
  gender     text not null check (gender in ('f', 'm', 'n')),
  birth_year smallint check (birth_year between 2005 and 2035),
  grade      smallint check (grade between 1 and 6),
  companion  jsonb not null default '{}'::jsonb check (jsonb_typeof(companion) = 'object' and pg_column_size(companion) < 4096),
  settings   jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 4096),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced_at  timestamptz not null default now()
);
create index if not exists children_org_idx on public.children (org_id, synced_at);

-- School classes. teacher_id is nullable so a teacher can delete their account without destroying the class.
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  teacher_id  uuid references auth.users (id) on delete set null default auth.uid(),
  name        text not null check (char_length(btrim(name)) between 1 and 60),
  grade       smallint check (grade between 1 and 6),
  join_code   text not null unique default public.new_join_code() check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  archived_at timestamptz
);
create index if not exists classes_org_idx on public.classes (org_id);
create index if not exists classes_teacher_idx on public.classes (teacher_id);

create table if not exists public.class_enrollments (
  class_id   uuid not null references public.classes (id) on delete cascade,
  child_id   uuid not null references public.children (id) on delete cascade,
  added_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (class_id, child_id)
);
create index if not exists class_enrollments_child_idx on public.class_enrollments (child_id);

-- Whole game progress of a child (ProgressState JSON). Merged monotonically by the client (see tg_progress_version).
create table if not exists public.progress (
  child_id   uuid primary key references public.children (id) on delete cascade,
  state      jsonb not null check (jsonb_typeof(state) = 'object' and pg_column_size(state) < 262144),
  version    bigint not null default 1,
  updated_at timestamptz not null default now(),
  synced_at  timestamptz not null default now()
);
create index if not exists progress_synced_idx on public.progress (synced_at);

-- Leitner mastery per skill (SkillMastery JSON in `data`).
create table if not exists public.skill_mastery (
  child_id   uuid not null references public.children (id) on delete cascade,
  skill      text not null check (char_length(skill) between 1 and 64),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 4096),
  updated_at timestamptz not null default now(),
  synced_at  timestamptz not null default now(),
  primary key (child_id, skill)
);
create index if not exists skill_mastery_sync_idx on public.skill_mastery (child_id, synced_at);

-- Every answered exercise. Append-only.
create table if not exists public.attempts (
  id                uuid primary key,
  child_id          uuid not null references public.children (id) on delete cascade,
  session_id        uuid,  -- no FK: an attempt may reach the server before its session row
  skill             text not null check (char_length(skill) between 1 and 64),
  kind              text not null check (char_length(kind) between 1 and 32),
  correct           boolean not null,
  given             text not null default '' check (char_length(given) <= 200),
  expected          text not null default '' check (char_length(expected) <= 200),
  ms                integer not null default 0 check (ms between 0 and 86400000),
  input_mode        text not null check (input_mode in ('pen', 'touch', 'keyboard', 'keypad', 'tap')),
  hints_used        smallint not null default 0 check (hints_used between 0 and 50),
  error_type        text check (char_length(error_type) <= 32),
  recognition_fixes smallint not null default 0 check (recognition_fixes between 0 and 500),
  context           jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object' and pg_column_size(context) < 2048),
  created_at        timestamptz not null,
  synced_at         timestamptz not null default now()
);
create index if not exists attempts_child_created_idx on public.attempts (child_id, created_at desc);
create index if not exists attempts_child_synced_idx on public.attempts (child_id, synced_at);

create table if not exists public.sessions (
  id         uuid primary key,
  child_id   uuid not null references public.children (id) on delete cascade,
  started_at timestamptz not null,
  ended_at   timestamptz,
  minutes    numeric(7, 2) not null default 0 check (minutes between 0 and 1440),
  summary    jsonb check (summary is null or (jsonb_typeof(summary) = 'object' and pg_column_size(summary) < 8192)),
  updated_at timestamptz not null default now(),
  synced_at  timestamptz not null default now()
);
create index if not exists sessions_child_started_idx on public.sessions (child_id, started_at desc);
create index if not exists sessions_child_synced_idx on public.sessions (child_id, synced_at);

-- Real-world prize promised by the family (Gran Cofre). Private to the family: teachers never see it.
create table if not exists public.rewards (
  id          uuid primary key,
  child_id    uuid not null references public.children (id) on delete cascade,
  kind        text not null check (kind in ('chest', 'world')),
  world_id    text check (char_length(world_id) <= 16),
  title       text not null check (char_length(btrim(title)) between 1 and 120),
  description text check (char_length(description) <= 500),
  created_by  uuid references auth.users (id) on delete set null,
  unlocked_at timestamptz,
  claimed_at  timestamptz,
  updated_at  timestamptz not null default now(),
  synced_at   timestamptz not null default now()
);
create index if not exists rewards_child_idx on public.rewards (child_id, synced_at);

-- Teacher focus practice for a class ("tabla del 7 esta semana").
create table if not exists public.assignments (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  title      text not null check (char_length(btrim(title)) between 1 and 120),
  selector   jsonb not null default '{}'::jsonb check (jsonb_typeof(selector) = 'object' and pg_column_size(selector) < 4096),
  starts_at  timestamptz not null default now(),
  due_at     timestamptz,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_due_after_start check (due_at is null or due_at > starts_at)
);
create index if not exists assignments_class_idx on public.assignments (class_id, starts_at desc);

-- Failed class-code lookups, to rate-limit brute forcing of join codes. Only SECURITY DEFINER code touches it.
create table if not exists public.join_code_failures (
  id      bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists join_code_failures_user_idx on public.join_code_failures (user_id, at desc);

-- ---------------------------------------------------------------------------------------------------------------------
-- 2. RLS helper functions (SECURITY DEFINER: they read memberships/children without triggering RLS recursion)
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(p_org uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = (select auth.uid()) and m.role = any (p_roles)
  );
$$;

-- True if both users share at least one organization (to show co-members' names).
create or replace function public.shares_org_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships mine
    join public.memberships theirs on theirs.org_id = mine.org_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

-- Class staff = the class teacher (while still a member of the school) or an owner/admin of the school.
create or replace function public.is_class_staff(p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classes c
    join public.memberships m on m.org_id = c.org_id and m.user_id = (select auth.uid())
    where c.id = p_class
      and (c.teacher_id = (select auth.uid()) or m.role in ('owner', 'admin'))
  );
$$;

-- Write access to a child: any member of the organization that owns the child (family adults on their devices,
-- school staff on school-owned devices).
create or replace function public.can_write_child(p_child uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.children ch
    join public.memberships m on m.org_id = ch.org_id and m.user_id = (select auth.uid())
    where ch.id = p_child
  );
$$;

-- Read-only access through a class: the child is enrolled in an ACTIVE class where the caller is staff.
create or replace function public.staff_can_read_child(p_child uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_enrollments e
    join public.children ch on ch.id = e.child_id and ch.deleted_at is null
    join public.classes c on c.id = e.class_id and c.archived_at is null
    join public.memberships m on m.org_id = c.org_id and m.user_id = (select auth.uid())
    where e.child_id = p_child
      and (c.teacher_id = (select auth.uid()) or m.role in ('owner', 'admin'))
  );
$$;

create or replace function public.can_read_child(p_child uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_write_child(p_child) or public.staff_can_read_child(p_child);
$$;

-- A family member of at least one child enrolled in the class (parents see the class name and its assignments).
create or replace function public.is_class_family(p_class uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_enrollments e
    join public.children ch on ch.id = e.child_id
    join public.memberships m on m.org_id = ch.org_id and m.user_id = (select auth.uid())
    where e.class_id = p_class
  );
$$;

-- Roles allowed per organization kind.
create or replace function public.role_fits_org(p_org uuid, p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = p_org
      and (
        (o.kind = 'family' and p_role in ('owner', 'admin', 'guardian'))
        or (o.kind = 'school' and p_role in ('owner', 'admin', 'teacher'))
      )
  );
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. Integrity triggers
-- ---------------------------------------------------------------------------------------------------------------------

-- Profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email, updated_at = now() where id = new.id;
  return new;
end;
$$;

-- Organizations: kind, creator and creation time are immutable (changing the kind would change role semantics).
create or replace function public.tg_organizations_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.kind := old.kind;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

-- Memberships: role must fit the org kind; only owners grant/revoke ownership; an org always keeps one owner.
create or replace function public.tg_memberships_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_owners int;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    if not public.role_fits_org(new.org_id, new.role) then
      raise exception 'role % is not valid for this organization', new.role using errcode = '22023';
    end if;
  end if;

  if v_uid is null then  -- server-side maintenance (service role / SQL editor)
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    if new.org_id <> old.org_id or new.user_id <> old.user_id then
      raise exception 'membership keys are immutable' using errcode = '42501';
    end if;
    if (old.role = 'owner' or new.role = 'owner') and old.role is distinct from new.role
       and not public.has_org_role(old.org_id, array['owner']) then
      raise exception 'only owners can grant or revoke ownership' using errcode = '42501';
    end if;
    if old.role = 'owner' and new.role <> 'owner' then
      select count(*) into v_owners from public.memberships where org_id = old.org_id and role = 'owner';
      if v_owners <= 1 then
        raise exception 'an organization needs at least one owner' using errcode = 'P0001';
      end if;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    -- Cascade from a deleted organization: the org row is already gone.
    if not exists (select 1 from public.organizations o where o.id = old.org_id) then
      return old;
    end if;
    if old.role = 'owner' then
      if old.user_id <> v_uid and not public.has_org_role(old.org_id, array['owner']) then
        raise exception 'only owners can remove an owner' using errcode = '42501';
      end if;
      select count(*) into v_owners from public.memberships where org_id = old.org_id and role = 'owner';
      if v_owners <= 1 then
        raise exception 'an organization needs at least one owner' using errcode = 'P0001';
      end if;
    end if;
    return old;
  end if;

  return new;
end;
$$;

-- Children: created_by is server-maintained; only owners/admins can soft-delete; deletion is permanent.
create or replace function public.tg_children_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    return new;
  end if;
  new.created_by := old.created_by;
  if old.deleted_at is not null then
    new.deleted_at := old.deleted_at;  -- tombstones are permanent: an old copy synced later cannot resurrect a child
  elsif new.deleted_at is not null
     and auth.uid() is not null
     and new.updated_at >= old.updated_at  -- a stale write is skipped by the LWW trigger anyway
     and not public.has_org_role(old.org_id, array['owner', 'admin']) then
    raise exception 'only owners and admins can delete children' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Classes belong to schools and are taught by a member of that school.
create or replace function public.tg_classes_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.organizations o where o.id = new.org_id and o.kind = 'school') then
    raise exception 'classes can only be created in a school organization' using errcode = '22023';
  end if;
  if new.teacher_id is not null and not exists (
    select 1 from public.memberships m
    where m.org_id = new.org_id and m.user_id = new.teacher_id and m.role in ('owner', 'admin', 'teacher')
  ) then
    raise exception 'the teacher must belong to the school' using errcode = '22023';
  end if;
  new.join_code := upper(new.join_code);
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- Enrollments only into active classes and of children that are not deleted.
create or replace function public.tg_enrollments_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.classes c where c.id = new.class_id and c.archived_at is not null) then
    raise exception 'this class is archived' using errcode = '22023';
  end if;
  if exists (select 1 from public.children ch where ch.id = new.child_id and ch.deleted_at is not null) then
    raise exception 'this child was deleted' using errcode = '22023';
  end if;
  return new;
end;
$$;

-- Rewards: remember who created them (an upsert that sends created_by = null keeps the original creator).
create or replace function public.tg_rewards_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.created_by := coalesce(old.created_by, new.created_by);
  elsif new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

-- (Re)create triggers ---------------------------------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists organizations_updated_at on public.organizations;
drop trigger if exists organizations_guard on public.organizations;
create trigger organizations_guard before update on public.organizations
  for each row execute function public.tg_organizations_guard();

drop trigger if exists memberships_guard on public.memberships;
create trigger memberships_guard before insert or update or delete on public.memberships
  for each row execute function public.tg_memberships_guard();

drop trigger if exists children_10_guard on public.children;
create trigger children_10_guard before insert or update on public.children
  for each row execute function public.tg_children_guard();

drop trigger if exists children_20_lww on public.children;
create trigger children_20_lww before insert or update on public.children
  for each row execute function public.tg_sync_lww();

drop trigger if exists classes_guard on public.classes;
create trigger classes_guard before insert or update on public.classes
  for each row execute function public.tg_classes_guard();

drop trigger if exists class_enrollments_guard on public.class_enrollments;
create trigger class_enrollments_guard before insert on public.class_enrollments
  for each row execute function public.tg_enrollments_guard();

drop trigger if exists progress_version on public.progress;
create trigger progress_version before insert or update on public.progress
  for each row execute function public.tg_progress_version();

drop trigger if exists skill_mastery_lww on public.skill_mastery;
create trigger skill_mastery_lww before insert or update on public.skill_mastery
  for each row execute function public.tg_sync_lww();

drop trigger if exists attempts_append_only on public.attempts;
create trigger attempts_append_only before insert or update on public.attempts
  for each row execute function public.tg_attempts_append_only();

drop trigger if exists sessions_merge on public.sessions;
create trigger sessions_merge before insert or update on public.sessions
  for each row execute function public.tg_sessions_merge();

drop trigger if exists rewards_10_created_by on public.rewards;
create trigger rewards_10_created_by before insert or update on public.rewards
  for each row execute function public.tg_rewards_created_by();

drop trigger if exists rewards_20_lww on public.rewards;
create trigger rewards_20_lww before insert or update on public.rewards
  for each row execute function public.tg_sync_lww();

drop trigger if exists assignments_updated_at on public.assignments;
create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------------------------------------------------
-- 4. Row level security
-- ---------------------------------------------------------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.organizations      enable row level security;
alter table public.memberships        enable row level security;
alter table public.org_invites        enable row level security;
alter table public.children           enable row level security;
alter table public.classes            enable row level security;
alter table public.class_enrollments  enable row level security;
alter table public.progress           enable row level security;
alter table public.skill_mastery      enable row level security;
alter table public.attempts           enable row level security;
alter table public.sessions           enable row level security;
alter table public.rewards            enable row level security;
alter table public.assignments        enable row level security;
alter table public.join_code_failures enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_org_with(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- organizations (created only through create_organization)
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
  using (public.is_org_member(id));
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for update to authenticated
  using (public.has_org_role(id, array['owner', 'admin'])) with check (public.has_org_role(id, array['owner', 'admin']));
drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations for delete to authenticated
  using (public.has_org_role(id, array['owner']));

-- memberships (created only through create_organization / accept_invite / claim_invites)
drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select to authenticated
  using (public.is_org_member(org_id));
drop policy if exists memberships_update on public.memberships;
create policy memberships_update on public.memberships for update to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']))
  with check (public.has_org_role(org_id, array['owner', 'admin']));
drop policy if exists memberships_delete on public.memberships;
create policy memberships_delete on public.memberships for delete to authenticated
  using (user_id = (select auth.uid()) or public.has_org_role(org_id, array['owner', 'admin']));

-- org_invites (created only through create_invite)
drop policy if exists org_invites_select on public.org_invites;
create policy org_invites_select on public.org_invites for select to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));
drop policy if exists org_invites_delete on public.org_invites;
create policy org_invites_delete on public.org_invites for delete to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));

-- children
drop policy if exists children_select on public.children;
create policy children_select on public.children for select to authenticated
  using (public.is_org_member(org_id) or public.staff_can_read_child(id));
drop policy if exists children_insert on public.children;
create policy children_insert on public.children for insert to authenticated
  with check (public.is_org_member(org_id));
drop policy if exists children_update on public.children;
create policy children_update on public.children for update to authenticated
  using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
drop policy if exists children_delete on public.children;
create policy children_delete on public.children for delete to authenticated
  using (public.has_org_role(org_id, array['owner', 'admin']));

-- learning data: progress, skill_mastery, sessions (read: org + class staff; write: org only)
drop policy if exists progress_select on public.progress;
create policy progress_select on public.progress for select to authenticated using (public.can_read_child(child_id));
drop policy if exists progress_insert on public.progress;
create policy progress_insert on public.progress for insert to authenticated with check (public.can_write_child(child_id));
drop policy if exists progress_update on public.progress;
create policy progress_update on public.progress for update to authenticated
  using (public.can_write_child(child_id)) with check (public.can_write_child(child_id));

drop policy if exists skill_mastery_select on public.skill_mastery;
create policy skill_mastery_select on public.skill_mastery for select to authenticated using (public.can_read_child(child_id));
drop policy if exists skill_mastery_insert on public.skill_mastery;
create policy skill_mastery_insert on public.skill_mastery for insert to authenticated with check (public.can_write_child(child_id));
drop policy if exists skill_mastery_update on public.skill_mastery;
create policy skill_mastery_update on public.skill_mastery for update to authenticated
  using (public.can_write_child(child_id)) with check (public.can_write_child(child_id));

drop policy if exists sessions_select on public.sessions;
create policy sessions_select on public.sessions for select to authenticated using (public.can_read_child(child_id));
drop policy if exists sessions_insert on public.sessions;
create policy sessions_insert on public.sessions for insert to authenticated with check (public.can_write_child(child_id));
drop policy if exists sessions_update on public.sessions;
create policy sessions_update on public.sessions for update to authenticated
  using (public.can_write_child(child_id)) with check (public.can_write_child(child_id));

-- attempts: append-only (no update/delete policy; rows go away only when the child is erased)
drop policy if exists attempts_select on public.attempts;
create policy attempts_select on public.attempts for select to authenticated using (public.can_read_child(child_id));
drop policy if exists attempts_insert on public.attempts;
create policy attempts_insert on public.attempts for insert to authenticated with check (public.can_write_child(child_id));

-- rewards: family/org only
drop policy if exists rewards_select on public.rewards;
create policy rewards_select on public.rewards for select to authenticated using (public.can_write_child(child_id));
drop policy if exists rewards_insert on public.rewards;
create policy rewards_insert on public.rewards for insert to authenticated with check (public.can_write_child(child_id));
drop policy if exists rewards_update on public.rewards;
create policy rewards_update on public.rewards for update to authenticated
  using (public.can_write_child(child_id)) with check (public.can_write_child(child_id));
drop policy if exists rewards_delete on public.rewards;
create policy rewards_delete on public.rewards for delete to authenticated using (public.can_write_child(child_id));

-- classes
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated
  using (public.is_org_member(org_id) or public.is_class_family(id));
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes for insert to authenticated
  with check (
    public.has_org_role(org_id, array['owner', 'admin'])
    or (public.has_org_role(org_id, array['teacher']) and teacher_id = (select auth.uid()))
  );
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes for update to authenticated
  using (public.is_class_staff(id))
  with check (
    public.has_org_role(org_id, array['owner', 'admin'])
    or (public.has_org_role(org_id, array['teacher']) and teacher_id = (select auth.uid()))
  );
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete to authenticated using (public.is_class_staff(id));

-- class_enrollments: families join with the class code (join_class); school staff can enrol their own school's children
drop policy if exists class_enrollments_select on public.class_enrollments;
create policy class_enrollments_select on public.class_enrollments for select to authenticated
  using (public.is_class_staff(class_id) or public.can_write_child(child_id));
drop policy if exists class_enrollments_insert on public.class_enrollments;
create policy class_enrollments_insert on public.class_enrollments for insert to authenticated
  with check (public.is_class_staff(class_id) and public.can_write_child(child_id));
drop policy if exists class_enrollments_delete on public.class_enrollments;
create policy class_enrollments_delete on public.class_enrollments for delete to authenticated
  using (public.is_class_staff(class_id) or public.can_write_child(child_id));

-- assignments
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select to authenticated
  using (public.is_class_staff(class_id) or public.is_class_family(class_id));
drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments for insert to authenticated
  with check (public.is_class_staff(class_id) and created_by = (select auth.uid()));
drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments for update to authenticated
  using (public.is_class_staff(class_id)) with check (public.is_class_staff(class_id));
drop policy if exists assignments_delete on public.assignments;
create policy assignments_delete on public.assignments for delete to authenticated using (public.is_class_staff(class_id));

-- join_code_failures: no policies → only SECURITY DEFINER functions can read/write it.

-- ---------------------------------------------------------------------------------------------------------------------
-- 5. RPCs
-- ---------------------------------------------------------------------------------------------------------------------

-- Create an organization and make the caller its owner, atomically.
create or replace function public.create_organization(p_kind text, p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_kind is null or p_kind not in ('family', 'school') then
    raise exception 'invalid organization kind' using errcode = '22023';
  end if;
  if (select count(*) from public.memberships m where m.user_id = v_uid and m.role = 'owner') >= 20 then
    raise exception 'too many organizations' using errcode = 'P0001';
  end if;
  insert into public.organizations (kind, name, created_by)
  values (p_kind, btrim(coalesce(p_name, '')), v_uid)
  returning * into v_org;
  insert into public.memberships (org_id, user_id, role) values (v_org.id, v_uid, 'owner');
  return v_org;
end;
$$;

-- Invite an adult by e-mail (owner/admin only). Returns the token for a shareable link. The invitee joins
-- automatically when they sign in with that (confirmed) e-mail (claim_invites) or by opening the link (accept_invite).
create or replace function public.create_invite(p_org_id uuid, p_email text, p_role text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not public.has_org_role(p_org_id, array['owner', 'admin']) then
    raise exception 'only owners and admins can invite' using errcode = '42501';
  end if;
  if p_role not in ('admin', 'teacher', 'guardian') or not public.role_fits_org(p_org_id, p_role) then
    raise exception 'role % is not valid for this organization', p_role using errcode = '22023';
  end if;
  delete from public.org_invites i where i.org_id = p_org_id and i.email = v_email and i.accepted_at is null;
  insert into public.org_invites (org_id, email, role, invited_by)
  values (p_org_id, v_email, p_role, auth.uid())
  returning token into v_token;
  return v_token;
end;
$$;

-- Accept one invite by token. The caller's confirmed e-mail must match the invited e-mail.
create or replace function public.accept_invite(p_token text)
returns public.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.org_invites;
  v_mem public.memberships;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select lower(u.email) into v_email from auth.users u where u.id = v_uid and u.email_confirmed_at is not null;
  select * into v_inv from public.org_invites i where i.token = p_token for update;
  if not found or v_inv.accepted_at is not null or v_inv.expires_at < now() then
    raise exception 'invite not found or expired' using errcode = 'P0002';
  end if;
  if v_email is null or v_inv.email <> v_email then
    raise exception 'this invite is for another e-mail address' using errcode = '42501';
  end if;
  insert into public.memberships (org_id, user_id, role) values (v_inv.org_id, v_uid, v_inv.role)
  on conflict (org_id, user_id) do nothing;
  update public.org_invites set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
  select * into v_mem from public.memberships m where m.org_id = v_inv.org_id and m.user_id = v_uid;
  return v_mem;
end;
$$;

-- Accept every pending invite addressed to the caller's confirmed e-mail. Returns how many were accepted.
create or replace function public.claim_invites()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_inv public.org_invites;
  v_count int := 0;
begin
  if v_uid is null then
    return 0;
  end if;
  select lower(u.email) into v_email from auth.users u where u.id = v_uid and u.email_confirmed_at is not null;
  if v_email is null then
    return 0;
  end if;
  for v_inv in
    select * from public.org_invites i
    where i.email = v_email and i.accepted_at is null and i.expires_at >= now()
    for update
  loop
    insert into public.memberships (org_id, user_id, role) values (v_inv.org_id, v_uid, v_inv.role)
    on conflict (org_id, user_id) do nothing;
    update public.org_invites set accepted_at = now(), accepted_by = v_uid where id = v_inv.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- A family links its child to a class with the class code (this is the consent step).
-- Returns the class, or NULL when the code does not exist (rate-limited: 20 failures per hour).
create or replace function public.join_class(p_code text, p_child_id uuid)
returns public.classes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_class public.classes;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not public.can_write_child(p_child_id) then
    raise exception 'you cannot link this child' using errcode = '42501';
  end if;
  if (select count(*) from public.join_code_failures f where f.user_id = v_uid and f.at > now() - interval '1 hour') >= 20 then
    raise exception 'too many attempts, try again later' using errcode = 'P0001';
  end if;
  select * into v_class from public.classes c where c.join_code = v_code and c.archived_at is null;
  if not found then
    insert into public.join_code_failures (user_id) values (v_uid);
    return null;
  end if;
  insert into public.class_enrollments (class_id, child_id, added_by) values (v_class.id, p_child_id, v_uid)
  on conflict (class_id, child_id) do nothing;
  return v_class;
end;
$$;

-- New random code for a class (class staff only), e.g. when a code was shared too widely.
create or replace function public.regenerate_join_code(p_class_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if not public.is_class_staff(p_class_id) then
    raise exception 'only class staff can change the code' using errcode = '42501';
  end if;
  v_code := public.new_join_code();
  update public.classes set join_code = v_code where id = p_class_id;
  return v_code;
end;
$$;

-- GDPR right to erasure: hard-delete a child and all of its data (owner/admin of the owning organization).
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
    return;  -- already gone
  end if;
  if not public.has_org_role(v_org, array['owner', 'admin']) then
    raise exception 'only owners and admins can erase a child' using errcode = '42501';
  end if;
  delete from public.children where id = p_child_id;  -- cascades to every child-scoped table
end;
$$;

-- Dashboard aggregates per child (SECURITY INVOKER: RLS decides which children the caller may see).
-- Accuracy ignores 'recognition' errors (the handwriting was misread: not a maths mistake).
create or replace function public.child_stats(p_child_ids uuid[], p_since timestamptz, p_errors_since timestamptz default null)
returns table (
  child_id uuid,
  attempts bigint,
  correct bigint,
  minutes numeric,
  last_played_at timestamptz,
  top_errors jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  with a as (
    select t.child_id,
           count(*) filter (where coalesce(t.error_type, '') <> 'recognition') as attempts,
           count(*) filter (where t.correct and coalesce(t.error_type, '') <> 'recognition') as correct
    from public.attempts t
    where t.child_id = any (p_child_ids) and t.created_at >= p_since
    group by t.child_id
  ),
  e as (
    select x.child_id, jsonb_agg(jsonb_build_object('errorType', x.error_type, 'count', x.n) order by x.n desc, x.error_type) as top_errors
    from (
      select t.child_id, t.error_type, count(*) as n,
             row_number() over (partition by t.child_id order by count(*) desc, t.error_type) as rn
      from public.attempts t
      where t.child_id = any (p_child_ids)
        and t.created_at >= coalesce(p_errors_since, p_since)
        and not t.correct
        and t.error_type is not null and t.error_type <> 'recognition'
      group by t.child_id, t.error_type
    ) x
    where x.rn <= 5
    group by x.child_id
  ),
  s as (
    select t.child_id, sum(t.minutes) as minutes
    from public.sessions t
    where t.child_id = any (p_child_ids) and t.started_at >= p_since
    group by t.child_id
  )
  select c.id,
         coalesce(a.attempts, 0),
         coalesce(a.correct, 0),
         coalesce(s.minutes, 0),
         greatest(
           (select max(t.created_at) from public.attempts t where t.child_id = c.id),
           (select max(coalesce(t.ended_at, t.started_at)) from public.sessions t where t.child_id = c.id)
         ),
         coalesce(e.top_errors, '[]'::jsonb)
  from public.children c
  left join a on a.child_id = c.id
  left join e on e.child_id = c.id
  left join s on s.child_id = c.id
  where c.id = any (p_child_ids);
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 6. Privileges (Supabase grants everything to anon/authenticated by default; tighten explicitly)
-- ---------------------------------------------------------------------------------------------------------------------

revoke all on table
  public.profiles, public.organizations, public.memberships, public.org_invites, public.children, public.classes,
  public.class_enrollments, public.progress, public.skill_mastery, public.attempts, public.sessions, public.rewards,
  public.assignments, public.join_code_failures
from anon, public;

revoke all on table public.join_code_failures from authenticated;

grant select, insert, update, delete on table
  public.profiles, public.organizations, public.memberships, public.org_invites, public.children, public.classes,
  public.class_enrollments, public.progress, public.skill_mastery, public.attempts, public.sessions, public.rewards,
  public.assignments
to authenticated;

-- Server-maintained columns (synced_at, version, created_by, organizations.kind) are enforced by the triggers above;
-- column-level REVOKEs would not override these table-level grants in Postgres.

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.random_token()',
    'public.tg_set_updated_at()',
    'public.tg_organizations_guard()',
    'public.tg_sync_lww()',
    'public.tg_progress_version()',
    'public.tg_sessions_merge()',
    'public.tg_attempts_append_only()',
    'public.handle_new_user()',
    'public.handle_user_email_change()',
    'public.tg_memberships_guard()',
    'public.tg_children_guard()',
    'public.tg_classes_guard()',
    'public.tg_enrollments_guard()',
    'public.tg_rewards_created_by()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
  end loop;

  foreach f in array array[
    'public.new_join_code()',  -- column default of classes.join_code: evaluated as the inserting user
    'public.is_org_member(uuid)',
    'public.has_org_role(uuid, text[])',
    'public.shares_org_with(uuid)',
    'public.is_class_staff(uuid)',
    'public.can_write_child(uuid)',
    'public.staff_can_read_child(uuid)',
    'public.can_read_child(uuid)',
    'public.is_class_family(uuid)',
    'public.role_fits_org(uuid, text)',
    'public.create_organization(text, text)',
    'public.create_invite(uuid, text, text)',
    'public.accept_invite(text)',
    'public.claim_invites()',
    'public.join_class(text, uuid)',
    'public.regenerate_join_code(uuid)',
    'public.erase_child(uuid)',
    'public.child_stats(uuid[], timestamptz, timestamptz)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

-- Profiles for users created before this migration (no-op on a fresh project).
insert into public.profiles (id, email, display_name)
select u.id, u.email, left(coalesce(nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(u.email, ''), '@', 1)), 80)
from auth.users u
on conflict (id) do nothing;

commit;

-- Ask PostgREST to pick up the new schema immediately.
notify pgrst, 'reload schema';
