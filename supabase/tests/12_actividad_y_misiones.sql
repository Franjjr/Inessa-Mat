-- Suite for 0006_actividad_todas_asignaturas.sql: «No lo sé» out of top_errors, the activity of every subject
-- (child_activity) and what each pupil has done of a mission (assignment_progress). Run with: supabase/tests/run.sh
--
-- Cast:  paz owner of school P   tito teacher in P (class 3ºC)   fe owner of family F   rosa owner of family R (stranger)
-- Children (family F, all enrolled in 3ºC): f1 Lengua only   f2 maths, Inglés and Caligrafía   f3 nothing at all

-- =====================================================================================================================
-- 1. fixtures
-- =====================================================================================================================
begin;
select tests.create_user('paz');
select tests.create_user('tito');
select tests.create_user('fe');
select tests.create_user('rosa');
commit;

begin;
select tests.login('paz');
select tests.set('schoolP', (public.create_organization('school', 'CEIP Paz')).id::text);
select tests.set('tok_tito', public.create_invite(tests.id('schoolP'), 'tito@test.numeria', 'teacher'));
commit;

begin;
select tests.login('tito');
select public.accept_invite(tests.get('tok_tito'));
insert into public.classes (org_id, name, grade) values (tests.id('schoolP'), '3ºC', 3);
select tests.set('classC', (select id::text from public.classes where name = '3ºC'));
select tests.set('codeC', (select join_code from public.classes where name = '3ºC'));
commit;

begin;
select tests.login('rosa');
select tests.set('famR', (public.create_organization('family', 'Familia Rosa')).id::text);
commit;

begin;
select tests.login('fe');
select tests.set('famF', (public.create_organization('family', 'Familia Fe')).id::text);
select tests.set('f1', gen_random_uuid()::text);
select tests.set('f2', gen_random_uuid()::text);
select tests.set('f3', gen_random_uuid()::text);
insert into public.children (id, org_id, nickname, gender, grade) values
  (tests.id('f1'), tests.id('famF'), 'Lía', 'f', 3),
  (tests.id('f2'), tests.id('famF'), 'Dani', 'm', 3),
  (tests.id('f3'), tests.id('famF'), 'Noa', 'f', 3);
-- f1: Lengua only (two answers and an 8-minute Lengua session).
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, context, created_at) values
  (gen_random_uuid(), tests.id('f1'), 'lng:ort:bv', 'lng-choice', true, 'b', 'b', 2000, 'tap', null, '{}', now()),
  (gen_random_uuid(), tests.id('f1'), 'lng:ort:bv', 'lng-choice', false, 'v', 'b', 2000, 'tap', 'lng-spelling', '{}', now());
insert into public.sessions (id, child_id, started_at, ended_at, minutes, summary, updated_at) values
  (gen_random_uuid(), tests.id('f1'), now(), now(), 8, '{"attempts": 2, "correct": 1, "subject": "language"}', now());
-- f2: maths (one right, one fact mistake, three «No lo sé», one ungraded retry), a 10-minute maths session; one English
-- answer and a 6-minute English session; one Caligrafía letter and a 4-minute Caligrafía session.
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, context, created_at) values
  (gen_random_uuid(), tests.id('f2'), 'mul:7x8', 'fact-mul', true, '56', '56', 2000, 'keypad', null, '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'mul:6x7', 'fact-mul', false, '48', '42', 2000, 'keypad', 'fact', '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'mul:7x9', 'fact-mul', false, 'No lo sé', '?', 2000, 'keypad', 'dont-know', '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'mul:7x9', 'fact-mul', false, 'No lo sé', '?', 2000, 'keypad', 'dont-know', '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'mul:7x9', 'fact-mul', false, 'No lo sé', '?', 2000, 'keypad', 'dont-know', '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'mul:7x8', 'fact-mul', true, '56', '56', 2000, 'keypad', null, '{"graded": false, "retries": 1}', now()),
  (gen_random_uuid(), tests.id('f2'), 'eng:voc:animales', 'eng-write-word', true, 'dog', 'dog', 2000, 'keyboard', null, '{}', now()),
  (gen_random_uuid(), tests.id('f2'), 'calig:a', 'cursive', true, '3', '3', 2000, 'pen', null, '{"stars": 3}', now()),
  -- three days ago: before the mission started
  (gen_random_uuid(), tests.id('f2'), 'mul:7x8', 'fact-mul', true, '56', '56', 2000, 'keypad', null, '{}', now() - interval '3 days');
insert into public.sessions (id, child_id, started_at, ended_at, minutes, summary, updated_at) values
  (gen_random_uuid(), tests.id('f2'), now(), now(), 10, null, now()),
  (gen_random_uuid(), tests.id('f2'), now(), now(), 6, '{"subject": "english"}', now()),
  (gen_random_uuid(), tests.id('f2'), now(), now(), 4, '{"subject": "handwriting"}', now());
select public.join_class(tests.get('codeC'), tests.id('f1'));
select public.join_class(tests.get('codeC'), tests.id('f2'));
select public.join_class(tests.get('codeC'), tests.id('f3'));
commit;

begin;
select tests.login('tito');
select tests.set('missionT', gen_random_uuid()::text);
select tests.set('missionG', gen_random_uuid()::text);
insert into public.assignments (id, class_id, title, selector, starts_at) values
  (tests.id('missionT'), tests.id('classC'), 'Tabla del 7', '{"skills": ["mul:7x8", "mul:7x9", "mul:7x7"]}', now() - interval '1 day'),
  (tests.id('missionG'), tests.id('classC'), 'Práctica general', '{}', now() - interval '1 day');
commit;

begin;  -- played from the mission itself, on a skill the mission does not list: it counts for the mission by its id
select tests.login('fe');
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, context, created_at)
  values (gen_random_uuid(), tests.id('f2'), 'mul:2x2', 'fact-mul', true, '4', '4', 2000, 'keypad', null,
          jsonb_build_object('activity', 'mission', 'assignmentId', tests.get('missionT')), now());
commit;

-- =====================================================================================================================
-- 2. child_stats: «No lo sé» is not a mistake, Caligrafía is not maths minutes (maths aggregates otherwise unchanged)
-- =====================================================================================================================
begin;
select tests.login('tito');
select tests.eq((select attempts || '/' || correct || '/' || minutes::int from public.child_stats(array[tests.id('f2')], now() - interval '1 day')),
  '6/2/10', 'child_stats keeps the maths meaning: graded maths answers (with «No lo sé»), right ones, maths minutes only');
select tests.eq((select top_errors::text from public.child_stats(array[tests.id('f2')], now() - interval '1 day')),
  '[{"count": 1, "errorType": "fact"}]', '«No lo sé» is left out of top_errors (it is not a kind of calculation mistake)');
select tests.eq((select attempts || '/' || minutes::int from public.child_stats(array[tests.id('f1')], now() - interval '1 day')),
  '0/0', 'a Lengua-only week gives no maths numbers in child_stats');
select tests.ok((select last_played_at is not null from public.child_stats(array[tests.id('f1')], now() - interval '1 day')),
  'last_played_at still counts every subject');
commit;

-- =====================================================================================================================
-- 3. child_activity: attempts and minutes of every subject
-- =====================================================================================================================
begin;
select tests.login('tito');
select tests.eq(
  (select string_agg(subject || ':' || attempts || '/' || minutes::int, ' ' order by subject)
   from public.child_activity(array[tests.id('f1')], now() - interval '1 day')),
  'language:2/8', 'a Lengua-only pupil shows Lengua activity (and no maths row)');
select tests.eq(
  (select string_agg(subject || ':' || attempts || '/' || minutes::int, ' ' order by subject)
   from public.child_activity(array[tests.id('f2')], now() - interval '1 day')),
  'english:1/6 handwriting:1/4 math:6/10', 'each subject has its graded answers and its minutes (a retry is not an answer)');
select tests.eq((select count(*) from public.child_activity(array[tests.id('f3')], now() - interval '1 day')), 0::bigint,
  'a pupil who did not play has no activity rows');
select tests.eq((select count(*) from public.child_activity(array[tests.id('f1'), tests.id('f2'), tests.id('f3')], now() - interval '1 day')), 4::bigint,
  'one row per pupil and subject with activity');
commit;

begin;
select tests.login('rosa');
select tests.eq((select count(*) from public.child_activity(array[tests.id('f1'), tests.id('f2')], now() - interval '1 day')), 0::bigint,
  'child_activity hides children the caller cannot read (RLS)');
commit;

begin;
select tests.login_anon();
select tests.throws($$select * from public.child_activity(array[gen_random_uuid()], now())$$, '42501', 'anon cannot call child_activity');
select tests.throws($$select * from public.assignment_progress(gen_random_uuid())$$, '42501', 'anon cannot call assignment_progress');
commit;

-- =====================================================================================================================
-- 4. assignment_progress: what each pupil has done of a mission, from the attempts already synced
-- =====================================================================================================================
begin;
select tests.login('tito');
select tests.eq((select count(*) from public.assignment_progress(tests.id('missionT'))), 3::bigint, 'one row per pupil of the class, also those with nothing done');
select tests.eq((select attempts || '/' || correct from public.assignment_progress(tests.id('missionT')) where child_id = tests.id('f2')),
  '5/2', 'the mission skills in the mission period count, and what was played from the mission (graded only, not before the start, not other skills)');
select tests.eq((select attempts from public.assignment_progress(tests.id('missionT')) where child_id = tests.id('f1')), 0::bigint,
  'Lengua answers do not count for a maths mission');
select tests.eq((select attempts from public.assignment_progress(tests.id('missionG')) where child_id = tests.id('f2')), 6::bigint,
  'a mission with no skills counts the maths answers of the period (not English, not Caligrafía)');
select tests.eq((select count(*) from public.assignment_progress(gen_random_uuid())), 0::bigint, 'an unknown mission has no rows');
commit;

begin;
select tests.login('rosa');
select tests.eq((select count(*) from public.assignment_progress(tests.id('missionT'))), 0::bigint, 'a stranger sees nothing of the mission');
commit;

begin;
select tests.login('fe');
select tests.eq((select count(*) from public.assignment_progress(tests.id('missionT'))), 3::bigint, 'the family of the pupils reads their own progress');
commit;

begin;  -- a misread digit (recognition) in a mission round is still an answer given: the child did finish the round
select tests.login('fe');
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, context, created_at)
  values (gen_random_uuid(), tests.id('f2'), 'mul:7x7', 'fact-mul', false, '4', '49', 2000, 'pen', 'recognition',
          jsonb_build_object('activity', 'mission', 'assignmentId', tests.get('missionT')), now());
commit;

begin;
select tests.login('tito');
select tests.eq((select attempts || '/' || correct from public.assignment_progress(tests.id('missionT')) where child_id = tests.id('f2')),
  '6/2', 'a recognition answer counts for the mission (as given, not as right)');
select tests.eq((select attempts || '/' || correct from public.child_stats(array[tests.id('f2')], now() - interval '1 day')),
  '6/2', 'child_stats still leaves recognition out of the maths accuracy');
commit;

-- =====================================================================================================================
-- 5. the functions keep the rigour of 0001: SECURITY INVOKER, empty search_path, signed-in users only
-- =====================================================================================================================
begin;
select tests.eq(
  (select string_agg(p.proname || ':' || p.prosecdef || ':' || coalesce(array_to_string(p.proconfig, ','), ''), ' ' order by p.proname)
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('child_stats', 'child_activity', 'assignment_progress')),
  'assignment_progress:false:search_path="" child_activity:false:search_path="" child_stats:false:search_path=""',
  'the three functions are SECURITY INVOKER with an empty search_path (one version each)');
select tests.ok(has_function_privilege('authenticated', 'public.child_activity(uuid[], timestamptz)', 'execute')
  and has_function_privilege('authenticated', 'public.assignment_progress(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.child_stats(uuid[], timestamptz, timestamptz)', 'execute'),
  'signed-in users can call them');
select tests.ok(not has_function_privilege('anon', 'public.child_activity(uuid[], timestamptz)', 'execute')
  and not has_function_privilege('anon', 'public.assignment_progress(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.child_stats(uuid[], timestamptz, timestamptz)', 'execute'),
  'anon cannot call them');
commit;
