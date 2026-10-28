-- =====================================================================================================================
-- Numeria · 0004_caligrafia_stats.sql  (applies on top of 0003_ungraded_retries.sql, after 0001 and 0002)
--
-- Caligrafía con lápiz practises letters, words and sentences with the pen. Its attempts use skills 'calig:…' and are not
-- maths or Lengua, so the dashboard aggregates must not count them: a handwriting attempt would move the maths accuracy,
-- the top maths mistakes and the minutes. public.child_stats now leaves 'calig:%' attempts out of attempts, correct and
-- top_errors, next to the 'lng:%' filter of 0003.
--
-- Same signature, SECURITY INVOKER, search_path, and grants as 0001_init.sql. Only the function body changes.
-- HOW TO APPLY: paste this whole file into the Supabase SQL editor and press "Run". Idempotent (create or replace,
-- grants repeated). It must run after 0003, because it replaces the function that 0003 defines.
-- =====================================================================================================================

begin;

-- Dashboard aggregates per child (SECURITY INVOKER: RLS decides which children the caller may see).
-- Accuracy ignores 'recognition' errors (the handwriting was misread: not a maths mistake).
-- Ungraded retry rows (context->>'graded' = 'false') are left out of attempts, correct and top errors (see 0003).
-- Handwriting rows (skill 'calig:…') are left out too (see 0004).
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
      and coalesce(t.summary->>'subject', 'math') <> 'language'
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

-- Grants as in 0001_init.sql: callable by signed-in users only.
revoke all on function public.child_stats(uuid[], timestamptz, timestamptz) from public, anon;
grant execute on function public.child_stats(uuid[], timestamptz, timestamptz) to authenticated;

commit;
