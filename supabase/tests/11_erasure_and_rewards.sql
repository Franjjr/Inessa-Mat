-- RLS / trigger suite for 0002_erasure_tombstones_rewards.sql: GDPR tombstones and monotonic reward claims.
-- Run with: supabase/tests/run.sh
--
-- Cast:  ivo owner of family I   ema guardian of family I (accepted invite)   rita owner of family R (stranger)
-- Children: k1 (family I, erased below)   k2 (family I, rewards)

-- =====================================================================================================================
-- 1. fixtures
-- =====================================================================================================================
begin;
select tests.create_user('ivo');
select tests.create_user('ema');
select tests.create_user('rita');
commit;

begin;
select tests.login('ivo');
select tests.set('org_ivo', (public.create_organization('family', 'Familia Ivo')).id::text);
select tests.set('tok_ema', public.create_invite(tests.id('org_ivo'), 'ema@test.numeria', 'guardian'));
select tests.set('k1', gen_random_uuid()::text);
select tests.set('k2', gen_random_uuid()::text);
insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Erasable', 'f');
insert into public.children (id, org_id, nickname, gender) values (tests.id('k2'), tests.id('org_ivo'), 'Vera', 'f');
commit;

begin;
select tests.login('ema');
select public.accept_invite(tests.get('tok_ema'));
select tests.eq(tests.rows('select * from public.children'), 2::bigint, 'the guardian sees both children before any erasure');
commit;

begin;
select tests.login('rita');
select tests.set('org_rita', (public.create_organization('family', 'Familia Rita')).id::text);
commit;

-- =====================================================================================================================
-- 2. erasure leaves a tombstone
-- =====================================================================================================================
begin;
select tests.login('ema');
select tests.throws($$select public.erase_child(tests.id('k1'))$$, '42501', 'a guardian cannot erase a child');
commit;

begin;
select tests.eq((select count(*) from public.erased_children where child_id = tests.id('k1')), 0::bigint, 'a refused erasure leaves no tombstone');
commit;

begin;
select tests.login('ivo');
select public.erase_child(tests.id('k1'));
select tests.eq((select count(*) from public.children where id = tests.id('k1')), 0::bigint, 'the owner erases the child');
select tests.eq((select count(*) from public.erased_children where child_id = tests.id('k1') and org_id = tests.id('org_ivo')), 1::bigint, 'erasure leaves a tombstone with the child id and org');
select public.erase_child(tests.id('k1'));
select tests.eq((select count(*) from public.erased_children where child_id = tests.id('k1')), 1::bigint, 'erasing again is a no-op (one tombstone)');
select tests.eq((select string_agg(column_name::text, ',' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'erased_children'),
  'child_id,org_id,erased_at', 'the tombstone holds no personal data');
commit;

-- =====================================================================================================================
-- 3. tombstones propagate to family members only
-- =====================================================================================================================
begin;
select tests.login('ema');
select tests.eq(tests.rows($$select * from public.erased_children where child_id = tests.id('k1')$$), 1::bigint, 'a guardian of the family can read the tombstone (devices learn about erasures)');
select tests.throws($$insert into public.erased_children (child_id, org_id) values (gen_random_uuid(), tests.id('org_ivo'))$$, '42501', 'clients cannot write tombstones');
select tests.throws($$update public.erased_children set erased_at = now()$$, '42501', 'clients cannot change tombstones');
select tests.throws($$delete from public.erased_children$$, '42501', 'clients cannot delete tombstones');
commit;

begin;
select tests.login('rita');
select tests.eq(tests.rows($$select * from public.erased_children where child_id = tests.id('k1')$$), 0::bigint, 'a stranger sees no tombstones');
commit;

-- =====================================================================================================================
-- 4. an erased id can never be written again, by any role
-- =====================================================================================================================
begin;  -- the owner: plain insert and the upsert shape the sync engine sends
select tests.login('ivo');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')$$, '42501', 'owner: re-insert of an erased child is rejected');
select tests.throws($$insert into public.children (id, org_id, nickname, gender, companion) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f', '{}')
  on conflict (id) do update set nickname = excluded.nickname$$, '42501', 'owner: upsert of an erased child is rejected');
commit;

begin;  -- a guardian (sibling device of the family)
select tests.login('ema');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')$$, '42501', 'guardian: re-insert of an erased child is rejected');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')
  on conflict (id) do update set nickname = excluded.nickname$$, '42501', 'guardian: upsert of an erased child is rejected');
commit;

begin;  -- a stranger owner of another family
select tests.login('rita');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_rita'), 'Back', 'f')$$, '42501', 'stranger: re-insert of an erased child is rejected');
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')$$, '42501', 'stranger into the erased family: rejected');
commit;

begin;  -- the database owner (no RLS) and the service role (bypasses RLS): the trigger still applies
grant usage on schema tests to service_role;
grant execute on all functions in schema tests to service_role;
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')$$, '42501', 'superuser: re-insert of an erased child is rejected');
set local role service_role;
select tests.throws($$insert into public.children (id, org_id, nickname, gender) values (tests.id('k1'), tests.id('org_ivo'), 'Back', 'f')$$, '42501', 'service_role: re-insert of an erased child is rejected');
reset role;
commit;

begin;  -- late learning data of the erased child cannot be stored either (the child row is gone: foreign key)
select tests.throws($$insert into public.progress (child_id, state) values (tests.id('k1'), '{"stars": 9}')$$, null, 'progress of an erased child cannot be written');
select tests.throws($$insert into public.attempts (id, child_id, skill, kind, correct, input_mode, created_at) values (gen_random_uuid(), tests.id('k1'), 'mul:2x2', 'fact-mul', true, 'pen', now())$$, null, 'attempts of an erased child cannot be written');
commit;

begin;  -- the other child of the family is unaffected
select tests.login('ema');
select tests.eq(tests.rows('select * from public.children'), 1::bigint, 'the family keeps its other children');
commit;

-- =====================================================================================================================
-- 5. monotonic reward claims (a later edit from a device that never saw the claim cannot revert it)
-- =====================================================================================================================
begin;
select tests.login('ivo');
select tests.set('r1', gen_random_uuid()::text);
insert into public.rewards (id, child_id, kind, title, unlocked_at, claimed_at, updated_at)
values (tests.id('r1'), tests.id('k2'), 'chest', 'Gran Cofre', now() - interval '2 hours', now() - interval '1 hour', now() - interval '1 hour');
select tests.eq(tests.affected($$update public.rewards set title = 'Cine', claimed_at = null, unlocked_at = null, updated_at = now() + interval '5 minutes' where id = tests.id('r1')$$), 1::bigint, 'a newer title edit with no claim is accepted');
select tests.eq((select title from public.rewards where id = tests.id('r1')), 'Cine', 'the title is taken from the newer edit');
select tests.ok((select claimed_at is not null from public.rewards where id = tests.id('r1')), 'the claim survives an edit that does not know about it');
select tests.ok((select unlocked_at is not null from public.rewards where id = tests.id('r1')), 'the unlock survives an edit that does not know about it');
select tests.ok((select claimed_at <= now() - interval '1 hour' + interval '1 second' from public.rewards where id = tests.id('r1')), 'the claim keeps the earliest time');
update public.rewards set claimed_at = now() where id = tests.id('r1');
select tests.ok((select claimed_at <= now() - interval '59 minutes' from public.rewards where id = tests.id('r1')), 'a later claim time never moves the claim forward');
commit;

begin;
select tests.login('ivo');
select tests.eq(tests.affected($$update public.rewards set title = 'Vieja', updated_at = now() - interval '1 day' where id = tests.id('r1')$$), 0::bigint, 'a stale write is still skipped');
select tests.ok((select claimed_at is not null from public.rewards where id = tests.id('r1')), 'the claim is still there after a stale write');
commit;

begin;  -- a reward that was not yet unlocked gets its unlock time from the first device that sets it
insert into public.rewards (id, child_id, kind, title, updated_at) values (gen_random_uuid(), tests.id('k2'), 'chest', 'Pizza', now());
update public.rewards set unlocked_at = now(), updated_at = now() + interval '1 minute' where title = 'Pizza';
select tests.ok((select unlocked_at is not null from public.rewards where title = 'Pizza'), 'a first unlock is stored');
update public.rewards set unlocked_at = null, updated_at = now() + interval '2 minutes' where title = 'Pizza';
select tests.ok((select unlocked_at is not null from public.rewards where title = 'Pizza'), 'an unlock cannot be undone by a later write');
commit;
