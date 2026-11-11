-- =====================================================================================================================
-- Numeria · 0006_actividad_todas_asignaturas.sql  (applies on top of 0005_ingles_stats.sql, after 0001 to 0004)
--
-- «Tiene que apuntarse todo en todas las asignaturas». Three changes, all compatible with the apps already installed:
--
-- 1. public.child_stats keeps its signature, its columns and their meaning (the maths aggregates), with two fixes:
--    - top_errors leaves «No lo sé» (error_type 'dont-know') out: it is a casilla still to learn, not a kind of
--      calculation mistake. The app already leaves it out of the most frequent errors it computes on the device
--      (src/data/summary.ts), so the family and the school now read the same thing. Accuracy is unchanged: a «No lo sé»
--      still counts as an answer that was not right, as on the device.
--    - Caligrafía sessions (summary.subject = 'handwriting', new in this version of the app) are left out of the maths
--      minutes, next to the Lengua and English marks.
--
-- 2. public.child_activity (NEW): attempts and minutes per subject ('math', 'language', 'english', 'handwriting') for
--    each child since a date. The class screen uses it to say who has not practised ANY subject this week, and to show
--    the minutes of each subject. An app that does not know this function keeps working: it simply never calls it, and
--    the new app falls back to the maths numbers (and says so) while this migration is not applied.
--    Attempts: graded answers (a retry with context.graded = false is not one). Minutes: the sessions of the period.
--
-- 3. public.assignment_progress (NEW): for one teacher's mission, the graded attempts and right answers of each pupil
--    of its class, made between the mission's start and its due date (or now), on the mission's skills. Attempts played
--    from the mission itself (context.assignmentId) count too; a mission with no skills («Práctica general») counts the
--    maths attempts of the period. Nothing new is stored: it is read from the attempts the app already syncs.
--
-- No table, column, policy or trigger changes. Both new functions are SECURITY INVOKER with an empty search_path, as
-- child_stats: RLS decides which children, classes, missions and attempts the caller may see. Callable by signed-in
-- users only (same grants as 0001_init.sql).
--
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and press "Run". Idempotent (create or replace,
-- grants repeated): running it twice is safe. It must run after 0005, because it replaces the function that 0005 defines.
-- =====================================================================================================================

begin;

-- ---------------------------------------------------------------------------------------------------------------------
-- 1. child_stats: the maths aggregates (same signature and columns as 0001; only the body changes)
-- ---------------------------------------------------------------------------------------------------------------------

-- Dashboard aggregates per child (SECURITY INVOKER: RLS decides which children the caller may see).
-- Accuracy ignores 'recognition' errors (the handwriting was misread: not a maths mistake).
-- Ungraded retry rows (context->>'graded' = 'false') are left out of attempts, correct and top errors (see 0003).
-- Handwriting rows (skill 'calig:…') are left out too (see 0004).
-- English rows (skill 'eng:…') and English sessions (summary subject 'english') are left out too (see 0005).
-- «No lo sé» ('dont-know') is not a mistake in top_errors, and Caligrafía sessions ('handwriting') are not maths
-- minutes (see 0006).
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
      and (t.context->>'graded') is distinct from 'false'
      and t.skill not like 'lng:%'
      and t.skill not like 'calig:%'
      and t.skill not like 'eng:%'
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
        and (t.context->>'graded') is distinct from 'false'
        and t.skill not like 'lng:%'
        and t.skill not like 'calig:%'
        and t.skill not like 'eng:%'
        and not t.correct
        and t.error_type is not null and t.error_type not in ('recognition', 'dont-know')
      group by t.child_id, t.error_type
    ) x
    where x.rn <= 5
    group by x.child_id
  ),
  s as (
    select t.child_id, sum(t.minutes) as minutes
    from public.sessions t
    where t.child_id = any (p_child_ids) and t.started_at >= p_since
      and coalesce(t.summary->>'subject', 'math') not in ('language', 'english', 'handwriting')
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
-- 2. child_activity: attempts and minutes of every subject (NEW)
-- ---------------------------------------------------------------------------------------------------------------------

-- One row per child and subject with some activity since p_since (a child with no activity has no row). The subject of
-- an attempt comes from its skill prefix (as src/engine/subjects.ts), the subject of a session from its summary mark
-- (no mark, or one this version does not know, is maths).
create or replace function public.child_activity(p_child_ids uuid[], p_since timestamptz)
returns table (
  child_id uuid,
  subject text,
  attempts bigint,
  minutes numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with a as (
    select t.child_id,
           case
             when t.skill like 'lng:%' then 'language'
             when t.skill like 'eng:%' then 'english'
             when t.skill like 'calig:%' then 'handwriting'
             else 'math'
           end as subject,
           count(*) as attempts
    from public.attempts t
    where t.child_id = any (p_child_ids) and t.created_at >= p_since
      and (t.context->>'graded') is distinct from 'false'
    group by 1, 2
  ),
  s as (
    select t.child_id,
           case
             when t.summary->>'subject' in ('language', 'english', 'handwriting') then t.summary->>'subject'
             else 'math'
           end as subject,
           sum(t.minutes) as minutes
    from public.sessions t
    where t.child_id = any (p_child_ids) and t.started_at >= p_since
    group by 1, 2
  )
  select coalesce(a.child_id, s.child_id),
         coalesce(a.subject, s.subject),
         coalesce(a.attempts, 0),
         coalesce(s.minutes, 0)
  from a
  full join s on s.child_id = a.child_id and s.subject = a.subject;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- 3. assignment_progress: what each pupil has done of a teacher's mission (NEW)
-- ---------------------------------------------------------------------------------------------------------------------

-- One row per pupil of the mission's class that the caller may see (zero attempts included). Unknown or hidden mission:
-- no rows. Recognition errors (a misread digit) are not counted, as in child_stats.
create or replace function public.assignment_progress(p_assignment_id uuid)
returns table (
  child_id uuid,
  attempts bigint,
  correct bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with m as (
    select x.id, x.class_id, x.starts_at, x.due_at,
           array(
             select jsonb_array_elements_text(case when jsonb_typeof(x.selector->'skills') = 'array' then x.selector->'skills' else '[]'::jsonb end)
           ) as skills
    from public.assignments x
    where x.id = p_assignment_id
  )
  select e.child_id,
         count(t.id),
         count(t.id) filter (where t.correct)
  from m
  join public.class_enrollments e on e.class_id = m.class_id
  left join public.attempts t
    on t.child_id = e.child_id
   and t.created_at >= m.starts_at
   and (m.due_at is null or t.created_at <= m.due_at)
   and (t.context->>'graded') is distinct from 'false'
   and coalesce(t.error_type, '') <> 'recognition'
   and (
     t.context->>'assignmentId' = m.id::text
     or (cardinality(m.skills) > 0 and t.skill = any (m.skills))
     or (cardinality(m.skills) = 0 and t.skill not like 'lng:%' and t.skill not like 'eng:%' and t.skill not like 'calig:%')
   )
  group by e.child_id;
$$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Grants as in 0001_init.sql: callable by signed-in users only.
-- ---------------------------------------------------------------------------------------------------------------------

revoke all on function public.child_stats(uuid[], timestamptz, timestamptz) from public, anon;
grant execute on function public.child_stats(uuid[], timestamptz, timestamptz) to authenticated;

revoke all on function public.child_activity(uuid[], timestamptz) from public, anon;
grant execute on function public.child_activity(uuid[], timestamptz) to authenticated;

revoke all on function public.assignment_progress(uuid) from public, anon;
grant execute on function public.assignment_progress(uuid) to authenticated;

commit;

-- Ask PostgREST to pick up the two new functions immediately.
notify pgrst, 'reload schema';
