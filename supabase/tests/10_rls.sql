-- RLS / RPC suite for 0001_init.sql. Run with: supabase/tests/run.sh  (see supabase/README.md)
--
-- Cast:
--   ana   owner of family A          abu   Ana's mother, invited to family A as guardian
--   bruno owner of family B          olga  signed-in adult with no organization
--   sara  owner of school S          tere  teacher in S (class 3ºB)   toni  teacher in S (class 3ºA)
--   uma   signed up but e-mail not confirmed
-- Children: a1 (family A), b1 (family B), s1 (owned by school S)

-- =====================================================================================================================
-- 1. profiles are created by the auth trigger
-- =====================================================================================================================
begin;
select tests.create_user('ana');
select tests.create_user('abu');
select tests.create_user('bruno');
select tests.create_user('olga');
select tests.create_user('sara');
select tests.create_user('tere');
select tests.create_user('toni');
select tests.create_user('uma', false);
select tests.eq((select count(*) from public.profiles), 8::bigint, 'a profile row exists for every auth user');
select tests.eq((select display_name from public.profiles where id = tests.uid('ana')), 'Ana', 'display_name comes from sign-up metadata');
commit;

begin;
select tests.login('ana');
select tests.eq(tests.rows('select * from public.profiles'), 1::bigint, 'ana only sees her own profile while she shares no org');
select tests.eq(tests.affected($$update public.profiles set display_name = 'x' where id = tests.uid('bruno')$$), 0::bigint, 'ana cannot edit another profile');
select tests.eq(tests.affected($$update public.profiles set display_name = 'Ana M.' where id = tests.uid('ana')$$), 1::bigint, 'ana can edit her profile');
select tests.throws($$insert into public.profiles (id) values (gen_random_uuid())$$, '42501', 'profiles cannot be inserted by clients');
commit;

-- =====================================================================================================================
-- 2. organizations and memberships
-- =====================================================================================================================
begin;
select tests.login('ana');
select tests.set('famA', (public.create_organization('family', 'Familia de Ana')).id::text);
select tests.eq((select role from public.memberships where org_id = tests.id('famA') and user_id = tests.uid('ana')), 'owner', 'create_organization makes the caller owner');
select tests.throws($$select public.create_organization('club', 'x')$$, '22023', 'organization kind must be family or school');
select tests.throws($$insert into public.organizations (kind, name) values ('family', 'direct')$$, '42501', 'organizations cannot be inserted directly');
update public.organizations set kind = 'school', name = 'Familia Martín' where id = tests.id('famA');
select tests.eq((select kind || ':' || name from public.organizations where id = tests.id('famA')), 'family:Familia Martín', 'owner can rename the org but its kind is immutable');
commit;

begin;
select tests.login('bruno');
select tests.set('famB', (public.create_organization('family', 'Familia de Bruno')).id::text);
select tests.eq(tests.rows($$select * from public.organizations where id = tests.id('famA')$$), 0::bigint, 'bruno cannot see family A');
select tests.eq(tests.rows($$select * from public.memberships where org_id = tests.id('famA')$$), 0::bigint, 'bruno cannot see family A members');
select tests.throws($$insert into public.memberships (org_id, user_id, role) values (tests.id('famA'), tests.uid('bruno'), 'admin')$$, '42501', 'bruno cannot add himself to family A');
select tests.eq(tests.affected($$update public.organizations set name = 'hacked' where id = tests.id('famA')$$), 0::bigint, 'bruno cannot rename family A');
select tests.eq(tests.affected($$delete from public.organizations where id = tests.id('famA')$$), 0::bigint, 'bruno cannot delete family A');
commit;

begin;
select tests.login('sara');
select tests.set('school', (public.create_organization('school', 'CEIP Numeria')).id::text);
commit;

begin;
select tests.login('olga');
select tests.eq(tests.rows('select * from public.organizations'), 0::bigint, 'an adult without org sees no organizations');
select tests.eq(tests.rows('select * from public.memberships'), 0::bigint, 'an adult without org sees no memberships');
commit;

-- =====================================================================================================================
-- 3. invites
-- =====================================================================================================================
begin;
select tests.login('ana');
select tests.set('tok_abu', public.create_invite(tests.id('famA'), '  ABU@test.numeria ', 'guardian'));
select tests.ok(length(tests.get('tok_abu')) = 64, 'create_invite returns a 64-char token');
select tests.eq((select email from public.org_invites where token = tests.get('tok_abu')), 'abu@test.numeria', 'invite e-mail is normalised');
select tests.throws($$select public.create_invite(tests.id('famA'), 'x@test.numeria', 'teacher')$$, '22023', 'a family cannot invite teachers');
select tests.throws($$select public.create_invite(tests.id('famA'), 'x@test.numeria', 'owner')$$, '22023', 'nobody can be invited as owner');
commit;

begin;
select tests.login('bruno');
select tests.throws($$select public.create_invite(tests.id('famA'), 'bruno2@test.numeria', 'admin')$$, '42501', 'bruno cannot invite into family A');
select tests.eq(tests.rows('select * from public.org_invites'), 0::bigint, 'bruno sees no invites of other families');
select tests.throws($$select public.accept_invite(tests.get('tok_abu'))$$, '42501', 'an invite cannot be accepted with another e-mail');
commit;

begin;
select tests.login('abu');
select tests.eq((public.accept_invite(tests.get('tok_abu'))).role, 'guardian', 'abu accepts the invite and becomes guardian');
select tests.throws($$select public.accept_invite(tests.get('tok_abu'))$$, 'P0002', 'an invite can only be used once');
select tests.eq(tests.rows($$select * from public.organizations where id = tests.id('famA')$$), 1::bigint, 'abu now sees family A');
select tests.eq(tests.rows('select * from public.profiles'), 2::bigint, 'co-members see each other''s profile');
select tests.eq(tests.rows('select * from public.org_invites'), 0::bigint, 'guardians cannot list invites');
commit;

begin;
select tests.login('sara');
select tests.set('tok_tere', public.create_invite(tests.id('school'), 'tere@test.numeria', 'teacher'));
select tests.set('tok_toni', public.create_invite(tests.id('school'), 'toni@test.numeria', 'teacher'));
select tests.set('tok_uma', public.create_invite(tests.id('school'), 'uma@test.numeria', 'teacher'));
select tests.set('tok_old', public.create_invite(tests.id('school'), 'olga@test.numeria', 'teacher'));
select tests.throws($$select public.create_invite(tests.id('school'), 'x@test.numeria', 'guardian')$$, '22023', 'a school cannot invite guardians');
select tests.eq(tests.rows('select * from public.org_invites'), 4::bigint, 'the school owner lists her pending invites');
commit;

begin;  -- the invite for olga expires
update public.org_invites set expires_at = now() - interval '1 day' where token = tests.get('tok_old');
commit;

begin;
select tests.login('tere');
select tests.eq(public.claim_invites(), 1, 'claim_invites accepts invites addressed to the signed-in e-mail');
select tests.eq((select role from public.memberships where user_id = tests.uid('tere')), 'teacher', 'tere is a teacher of the school');
commit;

begin;
select tests.login('toni');
select tests.eq((public.accept_invite(tests.get('tok_toni'))).role, 'teacher', 'toni accepts his invite by token');
commit;

begin;
select tests.login('uma');
select tests.eq(public.claim_invites(), 0, 'unconfirmed e-mails cannot claim invites');
select tests.throws($$select public.accept_invite(tests.get('tok_uma'))$$, '42501', 'unconfirmed e-mails cannot accept invites');
commit;

begin;
select tests.login('olga');
select tests.throws($$select public.accept_invite(tests.get('tok_old'))$$, 'P0002', 'expired invites are rejected');
select tests.eq(public.claim_invites(), 0, 'expired invites are not claimed');
commit;

-- =====================================================================================================================
-- 4. children
-- =====================================================================================================================
begin;
select tests.login('ana');
select tests.set('a1', gen_random_uuid()::text);
insert into public.children (id, org_id, nickname, gender, grade, companion, settings, created_at, updated_at)
values (tests.id('a1'), tests.id('famA'), 'Inessa', 'f', 2, '{"species":"cat","name":"Luna"}', '{}', now(), now() - interval '1 hour');
select tests.eq((select created_by from public.children where id = tests.id('a1')), tests.uid('ana'), 'created_by is set by the server');
select tests.eq(tests.affected($$update public.children set nickname = 'Old' , updated_at = now() - interval '2 hours' where id = tests.id('a1')$$), 0::bigint, 'a stale write (older updated_at) is skipped');
select tests.eq((select nickname from public.children where id = tests.id('a1')), 'Inessa', 'stale write left the row untouched');
update public.children set nickname = 'Ine', updated_at = now() + interval '1 year', created_by = tests.uid('bruno') where id = tests.id('a1');
select tests.ok((select updated_at <= now() + interval '11 minutes' from public.children where id = tests.id('a1')), 'updated_at from a clock in the future is clamped');
select tests.eq((select created_by from public.children where id = tests.id('a1')), tests.uid('ana'), 'created_by is immutable');
update public.children set nickname = 'Inessa', updated_at = now() + interval '11 minutes' where id = tests.id('a1');
select tests.throws($$insert into public.children (org_id, nickname, gender) values (tests.id('famA'), '', 'f')$$, '23514', 'CHECK: nickname cannot be empty');
select tests.throws($$insert into public.children (org_id, nickname, gender) values (tests.id('famA'), 'X', 'x')$$, '23514', 'CHECK: gender is f, m or n');
select tests.throws($$insert into public.children (org_id, nickname, gender, grade) values (tests.id('famA'), 'X', 'f', 9)$$, '23514', 'CHECK: grade is 1..6');
commit;

begin;
select tests.login('bruno');
select tests.set('b1', gen_random_uuid()::text);
insert into public.children (id, org_id, nickname, gender) values (tests.id('b1'), tests.id('famB'), 'Leo', 'm');
select tests.eq(tests.rows('select * from public.children'), 1::bigint, 'bruno only sees his own child');
select tests.throws($$insert into public.children (org_id, nickname, gender) values (tests.id('famA'), 'Intruso', 'm')$$, '42501', 'bruno cannot create children in family A');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('a1'), tests.id('famB'), 'Robado', 'f')
                      on conflict (id) do update set nickname = excluded.nickname, org_id = excluded.org_id$$, '42501', 'bruno cannot hijack a child id with an upsert');
select tests.eq(tests.affected($$update public.children set nickname = 'x' where id = tests.id('a1')$$), 0::bigint, 'bruno cannot update a child of family A');
select tests.eq(tests.affected($$delete from public.children where id = tests.id('a1')$$), 0::bigint, 'bruno cannot delete a child of family A');
commit;

begin;
select tests.login('abu');
select tests.eq(tests.rows('select * from public.children'), 1::bigint, 'the guardian sees the family child');
select tests.eq(tests.affected($$update public.children set settings = '{"sound":false}', updated_at = now() + interval '12 minutes' where id = tests.id('a1')$$), 1::bigint, 'the guardian can edit the child');
select tests.throws($$update public.children set deleted_at = now(), updated_at = now() + interval '13 minutes' where id = tests.id('a1')$$, '42501', 'a guardian cannot delete a child');
select tests.eq(tests.affected($$delete from public.children where id = tests.id('a1')$$), 0::bigint, 'a guardian cannot hard-delete a child');
commit;

begin;
select tests.login('olga');
select tests.eq(tests.rows('select * from public.children'), 0::bigint, 'an outsider sees no children');
select tests.throws($$insert into public.children (org_id, nickname, gender) values (tests.id('famB'), 'X', 'f')$$, '42501', 'an outsider cannot create children');
commit;

-- =====================================================================================================================
-- 5. learning data (progress, mastery, attempts, sessions) and rewards
-- =====================================================================================================================
begin;
select tests.login('ana');
insert into public.progress (child_id, state, updated_at) values (tests.id('a1'), '{"stars": 3}', now());
select tests.eq((select version from public.progress where child_id = tests.id('a1')), 1::bigint, 'progress starts at version 1');
select tests.eq(tests.affected($$update public.progress set state = '{"stars": 5}', updated_at = now() where child_id = tests.id('a1') and version = 1$$), 1::bigint, 'compare-and-swap on the current version succeeds');
select tests.eq((select version from public.progress where child_id = tests.id('a1')), 2::bigint, 'every write bumps the version');
select tests.eq(tests.affected($$update public.progress set state = '{"stars": 1}' where child_id = tests.id('a1') and version = 1$$), 0::bigint, 'compare-and-swap on an old version touches nothing');
select tests.eq(tests.affected($$update public.progress set version = 99 where child_id = tests.id('a1')$$), 1::bigint, 'a client may try to forge the version…');
select tests.eq((select version from public.progress where child_id = tests.id('a1')), 3::bigint, '…but the trigger keeps counting');
insert into public.skill_mastery (child_id, skill, data, updated_at) values (tests.id('a1'), 'mul:6x7', '{"box": 2}', now());
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, created_at)
values (gen_random_uuid(), tests.id('a1'), 'mul:6x7', 'fact-mul', true, '42', '42', 3200, 'pen', null, now()),
       (gen_random_uuid(), tests.id('a1'), 'mul:6x8', 'fact-mul', false, '46', '48', 5100, 'pen', 'fact', now()),
       (gen_random_uuid(), tests.id('a1'), 'mul:6x8', 'fact-mul', false, '43', '48', 5100, 'pen', 'recognition', now());
select tests.set('att1', (select id::text from public.attempts where child_id = tests.id('a1') and correct));
select tests.set('sess1', gen_random_uuid()::text);
insert into public.sessions (id, child_id, started_at, minutes, updated_at) values (tests.id('sess1'), tests.id('a1'), now() - interval '20 minutes', 12, now());
select tests.set('rew1', gen_random_uuid()::text);
insert into public.rewards (id, child_id, kind, title, updated_at) values (tests.id('rew1'), tests.id('a1'), 'chest', 'Tarde de cine', now());
select tests.eq((select created_by from public.rewards where id = tests.id('rew1')), tests.uid('ana'), 'rewards remember their creator');
insert into public.rewards (id, child_id, kind, title, created_by, updated_at) values (tests.id('rew1'), tests.id('a1'), 'chest', 'Tarde de cine y palomitas', null, now() + interval '1 second')
  on conflict (id) do update set title = excluded.title, created_by = excluded.created_by, updated_at = excluded.updated_at;
select tests.eq((select created_by::text || ':' || title from public.rewards where id = tests.id('rew1')), tests.uid('ana')::text || ':Tarde de cine y palomitas', 'an upsert with created_by null keeps the creator');

select tests.eq(tests.affected($$update public.attempts set correct = false where id = tests.id('att1')$$), 0::bigint, 'attempts cannot be updated (no policy)');
select tests.eq(tests.affected($$delete from public.attempts where id = tests.id('att1')$$), 0::bigint, 'attempts cannot be deleted');
select tests.eq(tests.affected($$insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at)
  values (tests.id('att1'), tests.id('a1'), 'mul:6x7', 'fact-mul', true, 'pen', now()) on conflict (id) do nothing$$), 0::bigint, 're-sending an attempt is an idempotent no-op');
select tests.throws($$insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at)
  values (gen_random_uuid(), tests.id('a1'), 'mul:6x7', 'fact-mul', true, 'mouse', now())$$, '23514', 'CHECK: input_mode is a known value');

insert into public.sessions (id, child_id, started_at, minutes, updated_at) values (tests.id('sess1'), tests.id('a1'), now(), 3, now())
  on conflict (id) do update set minutes = excluded.minutes, started_at = excluded.started_at, ended_at = excluded.ended_at, updated_at = excluded.updated_at;
select tests.eq((select minutes from public.sessions where id = tests.id('sess1')), 12.00::numeric, 'session minutes never decrease');
update public.sessions set ended_at = now(), summary = '{"attempts": 3}' where id = tests.id('sess1');
update public.sessions set ended_at = null, summary = null where id = tests.id('sess1');
select tests.ok((select ended_at is not null and summary is not null from public.sessions where id = tests.id('sess1')), 'an ended session stays ended and keeps its summary');
-- 0003: an ungraded retry row (context graded = false) adds no accuracy and no top error to child_stats
select tests.set('stats_before', (select attempts || '/' || correct from public.child_stats(array[tests.id('a1')], now() - interval '1 day')));
insert into public.attempts (id, child_id, skill, kind, correct, given, expected, ms, input_mode, error_type, context, created_at)
  values (gen_random_uuid(), tests.id('a1'), 'mul:6x7', 'fact-mul', true, '42', '42', 2000, 'pen', null, '{"retries": 1, "graded": false}', now()),
         (gen_random_uuid(), tests.id('a1'), 'mul:6x7', 'fact-mul', false, '40', '42', 2000, 'pen', 'carry-forgot', '{"retries": 1, "graded": false}', now());
select tests.eq((select attempts || '/' || correct from public.child_stats(array[tests.id('a1')], now() - interval '1 day')), tests.get('stats_before'), 'ungraded retry rows do not change attempts or correct in child_stats');
select tests.eq((select count(*) from public.child_stats(array[tests.id('a1')], now() - interval '1 day') s, jsonb_array_elements(s.top_errors) e where e ->> 'errorType' = 'carry-forgot'), 0::bigint, 'an ungraded wrong retry is not a top error');
commit;

begin;
select tests.login('bruno');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 0::bigint, 'bruno cannot read progress of family A');
select tests.eq(tests.rows('select * from public.skill_mastery'), 0::bigint, 'bruno cannot read mastery of family A');
select tests.eq(tests.rows('select * from public.attempts'), 0::bigint, 'bruno cannot read attempts of family A');
select tests.eq(tests.rows('select * from public.sessions'), 0::bigint, 'bruno cannot read sessions of family A');
select tests.eq(tests.rows('select * from public.rewards'), 0::bigint, 'bruno cannot read rewards of family A');
select tests.throws($$insert into public.skill_mastery (child_id, skill, data) values (tests.id('a1'), 'mul:2x2', '{}')$$, '42501', 'bruno cannot write mastery for family A');
select tests.throws($$insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at)
  values (gen_random_uuid(), tests.id('a1'), 'mul:2x2', 'fact-mul', true, 'pen', now())$$, '42501', 'bruno cannot write attempts for family A');
select tests.eq(tests.affected($$update public.progress set state = '{}' where child_id = tests.id('a1')$$), 0::bigint, 'bruno cannot overwrite progress of family A');
commit;

begin;
select tests.login('abu');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 1::bigint, 'the guardian reads the family child progress');
insert into public.skill_mastery (child_id, skill, data, updated_at) values (tests.id('a1'), 'mul:7x8', '{"box": 1}', now());
select tests.ok(true, 'the guardian can write mastery (plays on her own tablet)');
commit;

-- =====================================================================================================================
-- 6. schools and classes
-- =====================================================================================================================
begin;
select tests.login('tere');
insert into public.classes (org_id, name, grade) values (tests.id('school'), '3ºB', 3);
select tests.set('class1', (select id::text from public.classes where name = '3ºB'));
select tests.set('code1', (select join_code from public.classes where name = '3ºB'));
select tests.ok(tests.get('code1') ~ '^[A-HJ-NP-Z2-9]{6}$', 'classes get a 6-character join code without ambiguous characters');
select tests.eq((select teacher_id from public.classes where id = tests.id('class1')), tests.uid('tere'), 'the creating teacher teaches the class');
select tests.throws($$insert into public.classes (org_id, name, teacher_id) values (tests.id('school'), 'Otra', tests.uid('toni'))$$, '42501', 'a teacher cannot create classes for another teacher');
commit;

begin;
select tests.login('toni');
insert into public.classes (org_id, name, grade) values (tests.id('school'), '3ºA', 3);
select tests.set('class2', (select id::text from public.classes where name = '3ºA'));
select tests.set('code2', (select join_code from public.classes where name = '3ºA'));
select tests.eq(tests.rows('select * from public.classes'), 2::bigint, 'teachers see the classes of their school');
select tests.eq(tests.affected($$update public.classes set name = 'Mía' where id = tests.id('class1')$$), 0::bigint, 'a teacher cannot edit a colleague''s class');
select tests.eq(tests.affected($$delete from public.classes where id = tests.id('class1')$$), 0::bigint, 'a teacher cannot delete a colleague''s class');
commit;

begin;
select tests.login('ana');
select tests.throws($$insert into public.classes (org_id, name) values (tests.id('famA'), 'Clase en casa')$$, '22023', 'classes only exist in schools');
-- (the class guard trigger runs before the RLS check, so the denial surfaces as 22023 "teacher must belong to the school")
select tests.throws($$insert into public.classes (org_id, name) values (tests.id('school'), 'Intrusa')$$, '22023', 'a parent cannot create classes in a school');
select tests.throws($$insert into public.classes (org_id, name, teacher_id) values (tests.id('school'), 'Intrusa', tests.uid('tere'))$$, '42501', 'a parent cannot create classes even naming a real teacher');
select tests.eq(tests.rows('select * from public.classes'), 0::bigint, 'a parent sees no classes before joining one');
commit;

-- =====================================================================================================================
-- 7. enrollment with the class code (parental consent) and teacher read-only access
-- =====================================================================================================================
begin;
select tests.login('bruno');
select tests.throws($$select public.join_class(tests.get('code1'), tests.id('a1'))$$, '42501', 'bruno cannot enrol a child of family A');
select tests.ok((public.join_class('ZZZZZZ', tests.id('b1'))).id is null, 'an unknown code returns no class');
commit;

begin;
select tests.login('ana');
select tests.eq((public.join_class(lower(tests.get('code1')), tests.id('a1'))).id, tests.id('class1'), 'ana links Inessa to 3ºB with the code (case-insensitive)');
select tests.eq((public.join_class(tests.get('code1'), tests.id('a1'))).id, tests.id('class1'), 'joining twice is idempotent');
select tests.eq(tests.rows('select * from public.classes'), 1::bigint, 'the parent now sees that class (and only that one)');
select tests.throws($$insert into public.class_enrollments (class_id, child_id) values (tests.id('class2'), tests.id('a1'))$$, '42501', 'a parent cannot enrol without the code');
commit;

begin;
select tests.login('tere');
select tests.eq(tests.rows($$select * from public.children where id = tests.id('a1')$$), 1::bigint, 'the teacher sees the enrolled child');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 1::bigint, 'the teacher reads progress of the enrolled child');
select tests.eq(tests.rows($$select * from public.skill_mastery where child_id = tests.id('a1')$$), 2::bigint, 'the teacher reads mastery of the enrolled child');
select tests.eq(tests.rows($$select * from public.attempts where child_id = tests.id('a1')$$), 3::bigint, 'the teacher reads attempts of the enrolled child');
select tests.eq(tests.rows($$select * from public.sessions where child_id = tests.id('a1')$$), 1::bigint, 'the teacher reads sessions of the enrolled child');
select tests.eq(tests.rows($$select * from public.rewards where child_id = tests.id('a1')$$), 0::bigint, 'the teacher cannot see family rewards');
select tests.eq(tests.affected($$update public.children set nickname = 'x', updated_at = now() + interval '1 hour' where id = tests.id('a1')$$), 0::bigint, 'the teacher cannot edit the child');
select tests.eq(tests.affected($$update public.progress set state = '{}' where child_id = tests.id('a1')$$), 0::bigint, 'the teacher cannot modify progress');
select tests.eq(tests.affected($$update public.skill_mastery set data = '{}' where child_id = tests.id('a1')$$), 0::bigint, 'the teacher cannot modify mastery');
select tests.eq(tests.affected($$update public.sessions set minutes = 0 where child_id = tests.id('a1')$$), 0::bigint, 'the teacher cannot modify sessions');
select tests.throws($$insert into public.skill_mastery (child_id, skill, data) values (tests.id('a1'), 'mul:9x9', '{}')$$, '42501', 'the teacher cannot add mastery');
select tests.throws($$insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at)
  values (gen_random_uuid(), tests.id('a1'), 'mul:9x9', 'fact-mul', true, 'pen', now())$$, '42501', 'the teacher cannot add attempts');
select tests.throws($$insert into public.sessions (id, child_id, started_at) values (gen_random_uuid(), tests.id('a1'), now())$$, '42501', 'the teacher cannot add sessions');
select tests.throws($$insert into public.class_enrollments (class_id, child_id) values (tests.id('class1'), tests.id('b1'))$$, '42501', 'the teacher cannot enrol a family child without consent');
select tests.eq(tests.rows($$select * from public.children where id = tests.id('b1')$$), 0::bigint, 'the teacher cannot see non-enrolled children');
select tests.eq(
  (select attempts || '/' || correct || '/' || minutes::int || '/' || (top_errors -> 0 ->> 'errorType')
   from public.child_stats(array[tests.id('a1'), tests.id('b1')], now() - interval '7 days')),
  '2/1/12/fact', 'child_stats aggregates readable children only and ignores recognition errors');
select tests.eq((select count(*) from public.child_stats(array[tests.id('a1'), tests.id('b1')], now() - interval '7 days')), 1::bigint, 'child_stats hides children the caller cannot read');
-- school-owned child on a classroom tablet
select tests.set('s1', gen_random_uuid()::text);
insert into public.children (id, org_id, nickname, gender) values (tests.id('s1'), tests.id('school'), 'Marta', 'f');
insert into public.class_enrollments (class_id, child_id) values (tests.id('class1'), tests.id('s1'));
insert into public.skill_mastery (child_id, skill, data) values (tests.id('s1'), 'mul:6x6', '{"box":1}');
select tests.ok(true, 'school staff can create, enrol and write data of school-owned children');
insert into public.assignments (class_id, title, selector) values (tests.id('class1'), 'Tabla del 7', '{"tables":[7]}');
select tests.ok(true, 'the class teacher creates an assignment');
commit;

begin;
select tests.login('toni');
select tests.eq(tests.rows($$select * from public.children where id = tests.id('a1')$$), 0::bigint, 'another teacher of the same school cannot see the child');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 0::bigint, 'another teacher cannot read the child progress');
select tests.eq(tests.rows($$select * from public.class_enrollments where class_id = tests.id('class1') and child_id = tests.id('a1')$$), 0::bigint, 'another teacher cannot list the class enrollments');
select tests.throws($$insert into public.assignments (class_id, title) values (tests.id('class1'), 'X')$$, '42501', 'another teacher cannot assign work to 3ºB');
commit;

begin;
select tests.login('sara');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 1::bigint, 'the school owner can read enrolled children (oversight)');
select tests.eq(tests.affected($$update public.progress set state = '{}' where child_id = tests.id('a1')$$), 0::bigint, 'the school owner cannot modify a family child');
commit;

begin;
select tests.login('ana');
select tests.eq(tests.rows($$select * from public.assignments where class_id = tests.id('class1')$$), 1::bigint, 'parents of enrolled children see the class assignments');
select tests.eq(tests.affected($$update public.assignments set title = 'x' where class_id = tests.id('class1')$$), 0::bigint, 'parents cannot edit assignments');
commit;

begin;
select tests.login('bruno');
select tests.eq(tests.rows('select * from public.assignments'), 0::bigint, 'other families do not see the assignments');
select tests.eq(tests.rows('select * from public.class_enrollments'), 0::bigint, 'other families do not see enrollments');
commit;

-- archiving a class ends teacher access; parents can withdraw consent at any time
begin;
select tests.login('tere');
update public.classes set archived_at = now() where id = tests.id('class1');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 0::bigint, 'archived classes no longer grant access');
commit;

begin;
select tests.login('ana');
select tests.ok((public.join_class(tests.get('code1'), tests.id('a1'))).id is null, 'the code of an archived class does not work');
commit;

begin;
select tests.login('tere');
update public.classes set archived_at = null where id = tests.id('class1');
select tests.eq(tests.rows($$select * from public.progress where child_id = tests.id('a1')$$), 1::bigint, 'restoring the class restores access');
select tests.ok(public.regenerate_join_code(tests.id('class1')) <> tests.get('code1'), 'the teacher can regenerate the join code');
commit;

begin;
select tests.login('ana');
select tests.eq(tests.affected($$delete from public.class_enrollments where child_id = tests.id('a1')$$), 1::bigint, 'the parent withdraws consent');
commit;

begin;
select tests.login('tere');
select tests.eq(tests.rows($$select * from public.children where id = tests.id('a1')$$), 0::bigint, 'after withdrawal the teacher cannot see the child');
select tests.eq(tests.rows($$select * from public.attempts where child_id = tests.id('a1')$$), 0::bigint, 'after withdrawal the teacher cannot read attempts');
commit;

-- =====================================================================================================================
-- 8. membership management
-- =====================================================================================================================
begin;
select tests.login('abu');
select tests.eq(tests.affected($$update public.memberships set role = 'owner' where user_id = tests.uid('abu')$$), 0::bigint, 'a guardian cannot promote herself');
select tests.eq(tests.affected($$delete from public.memberships where user_id = tests.uid('ana')$$), 0::bigint, 'a guardian cannot remove the owner');
commit;

begin;
select tests.login('ana');
select tests.throws($$delete from public.memberships where user_id = tests.uid('ana') and org_id = tests.id('famA')$$, 'P0001', 'the last owner cannot leave');
select tests.throws($$update public.memberships set role = 'teacher' where user_id = tests.uid('abu')$$, '22023', 'family members cannot be teachers');
select tests.eq(tests.affected($$update public.memberships set role = 'admin' where user_id = tests.uid('abu')$$), 1::bigint, 'the owner promotes the guardian to admin');
commit;

begin;
select tests.login('abu');
select tests.throws($$update public.memberships set role = 'guardian' where user_id = tests.uid('ana')$$, '42501', 'an admin cannot demote the owner');
select tests.throws($$delete from public.memberships where user_id = tests.uid('ana')$$, '42501', 'an admin cannot remove the owner');
select tests.throws($$update public.memberships set role = 'owner' where user_id = tests.uid('abu')$$, '42501', 'an admin cannot make herself owner');
commit;

begin;
select tests.login('sara');
select tests.eq(tests.affected($$delete from public.memberships where user_id = tests.uid('toni')$$), 1::bigint, 'the school owner removes a teacher');
commit;

begin;
select tests.login('toni');
select tests.eq(tests.rows('select * from public.classes'), 0::bigint, 'a removed teacher loses access to the school classes');
select tests.eq(tests.rows($$select * from public.children where id = tests.id('s1')$$), 0::bigint, 'a removed teacher loses access to school children');
commit;

-- =====================================================================================================================
-- 9. deletion and GDPR erasure
-- =====================================================================================================================
begin;
select tests.login('bruno');
select tests.throws($$select public.erase_child(tests.id('a1'))$$, '42501', 'bruno cannot erase a child of family A');
commit;

begin;
select tests.login('ana');
select tests.eq(tests.affected($$update public.children set deleted_at = now(), updated_at = now() + interval '20 minutes' where id = tests.id('a1')$$), 1::bigint, 'the owner can soft-delete a child');
update public.children set deleted_at = null, nickname = 'Revivida', updated_at = now() + interval '30 minutes' where id = tests.id('a1');
select tests.ok((select deleted_at is not null from public.children where id = tests.id('a1')), 'a later write from an old copy cannot resurrect a deleted child');
select public.erase_child(tests.id('a1'));
commit;

begin;  -- as postgres (no RLS): everything about a1 is gone
select tests.eq((select count(*) from public.children where id = tests.id('a1')), 0::bigint, 'erase_child removes the child');
select tests.eq((select count(*) from public.progress where child_id = tests.id('a1')) + (select count(*) from public.skill_mastery where child_id = tests.id('a1'))
  + (select count(*) from public.attempts where child_id = tests.id('a1')) + (select count(*) from public.sessions where child_id = tests.id('a1'))
  + (select count(*) from public.rewards where child_id = tests.id('a1')), 0::bigint, 'erase_child cascades to all learning data');
insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at)
  values (gen_random_uuid(), tests.id('s1'), 'mul:6x6', 'fact-mul', true, 'pen', now());
select tests.throws($$update public.attempts set correct = false where child_id = tests.id('s1')$$, '42501', 'attempts stay append-only even for direct SQL');
commit;

begin;
select tests.login('bruno');
delete from public.organizations where id = tests.id('famB');
commit;

begin;
select tests.eq((select count(*) from public.memberships where org_id = tests.id('famB')), 0::bigint, 'deleting an organization cascades (no last-owner error)');
select tests.eq((select count(*) from public.children where id = tests.id('b1')), 0::bigint, 'deleting an organization deletes its children');
commit;

-- =====================================================================================================================
-- 10. anonymous requests
-- =====================================================================================================================
begin;
select tests.login_anon();
select tests.throws('select * from public.children', '42501', 'anon cannot read children');
select tests.throws('select * from public.progress', '42501', 'anon cannot read progress');
select tests.throws('select * from public.profiles', '42501', 'anon cannot read profiles');
select tests.throws($$select public.create_organization('family', 'x')$$, '42501', 'anon cannot create organizations');
select tests.throws($$select public.join_class('ABCDEF', gen_random_uuid())$$, '42501', 'anon cannot use class codes');
select tests.throws($$select * from public.child_stats(array[]::uuid[], now())$$, '42501', 'anon cannot call child_stats');
commit;

begin;
select tests.login('olga');
select tests.throws('select * from public.join_code_failures', '42501', 'nobody can read the rate-limit table');
commit;
