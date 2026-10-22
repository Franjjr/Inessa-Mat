-- Tiny assertion framework for the RLS suite. Every passing check prints "NOTICE:  ok - <message>"; a failing
-- check raises "FAIL: <message>". run.py counts both.
--
-- Impersonation works like PostgREST: tests.login('<name>') sets request.jwt.claims and switches to the
-- `authenticated` role for the rest of the current transaction, so each scenario is wrapped in begin … commit.

create schema if not exists tests;

create table if not exists tests.users (name text primary key, id uuid not null unique);
create table if not exists tests.vals (name text primary key, val text);

grant usage on schema tests to anon, authenticated;
grant select, insert, update on tests.users, tests.vals to anon, authenticated;

create or replace function tests.create_user(p_name text, p_confirmed boolean default true)
returns uuid language plpgsql as $$
declare
  v uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values (v, p_name || '@test.numeria', case when p_confirmed then now() end,
          jsonb_build_object('display_name', initcap(p_name)));
  insert into tests.users (name, id) values (p_name, v);
  return v;
end;
$$;

create or replace function tests.login(p_name text)
returns void language plpgsql as $$
declare
  v uuid;
begin
  execute 'reset role';
  select id into strict v from tests.users where name = p_name;
  perform set_config('request.jwt.claim.sub', v::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
end;
$$;

create or replace function tests.login_anon()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  execute 'set local role anon';
end;
$$;

create or replace function tests.logout()
returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create or replace function tests.uid(p_name text)
returns uuid language sql stable as $$ select id from tests.users where name = p_name $$;

create or replace function tests.set(p_name text, p_val text)
returns text language sql as $$
  insert into tests.vals (name, val) values (p_name, p_val)
  on conflict (name) do update set val = excluded.val
  returning val;
$$;

create or replace function tests.get(p_name text)
returns text language plpgsql stable as $$
declare
  v text;
begin
  select val into strict v from tests.vals where name = p_name;
  return v;
end;
$$;

create or replace function tests.id(p_name text)
returns uuid language sql stable as $$ select tests.get(p_name)::uuid $$;

create or replace function tests.ok(p_cond boolean, p_msg text)
returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FAIL: %', p_msg;
  end if;
  raise notice 'ok - %', p_msg;
end;
$$;

create or replace function tests.eq(p_got anyelement, p_want anyelement, p_msg text)
returns void language plpgsql as $$
begin
  if p_got is distinct from p_want then
    raise exception 'FAIL: % (got %, want %)', p_msg, p_got, p_want;
  end if;
  raise notice 'ok - %', p_msg;
end;
$$;

-- Runs p_sql and expects it to fail with SQLSTATE p_state (any error when p_state is null).
create or replace function tests.throws(p_sql text, p_state text, p_msg text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if p_state is null or sqlstate = p_state then
      raise notice 'ok - % [%]', p_msg, sqlstate;
      return;
    end if;
    raise exception 'FAIL: % (expected SQLSTATE %, got %: %)', p_msg, p_state, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: % (no error was raised)', p_msg;
end;
$$;

-- Runs a DML statement and returns the number of affected rows.
create or replace function tests.affected(p_sql text)
returns bigint language plpgsql as $$
declare
  n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Number of rows a query returns for the current role.
create or replace function tests.rows(p_sql text)
returns bigint language plpgsql as $$
declare
  n bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into n;
  return n;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;
