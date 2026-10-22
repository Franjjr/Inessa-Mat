# Numeria · Supabase backend

Migrations run in order: `migrations/0001_init.sql` (the schema), then `migrations/0002_erasure_tombstones_rewards.sql`
(GDPR erasure tombstones and monotonic reward claims). Each one is idempotent and must be applied on top of the previous.

## Apply it to a project

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste the whole content of each migration not yet applied, in order, and press **Run** → *Success. No rows returned*.
3. The scripts are idempotent: running them again on the same project is safe.

The app needs only the public URL and anon (publishable) key at build time:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Without them the app runs fully local-only.
Never put the `service_role` key in the app.

## Data model

| Table | What | Who can read | Who can write |
|---|---|---|---|
| `profiles` | adult profile, 1:1 with `auth.users` (trigger) | self + co-members | self |
| `organizations` | `family` or `school` | members | owner/admin (create via `create_organization`) |
| `memberships` | adult ↔ org, role `owner/admin/teacher/guardian` | members | owner/admin (guarded: one owner minimum, only owners grant ownership, roles fit the org kind) |
| `org_invites` | e-mail invites with token, 14-day expiry | owner/admin | via `create_invite` |
| `children` | nickname, gender, grade, companion, settings; soft delete | org members; class staff (enrolled) | org members (delete: owner/admin) |
| `classes` | school class with unique 6-char `join_code` | school members; families of enrolled children | owner/admin, or the teacher for their own class |
| `class_enrollments` | child ↔ class | class staff; the child's family | families via `join_class(code)`; school staff for school-owned children |
| `progress` | `ProgressState` JSON + `version` | org + class staff | org members |
| `skill_mastery` | Leitner box per skill | org + class staff | org members |
| `attempts` | every answer (append-only) | org + class staff | org members (insert only) |
| `sessions` | play sessions (monotonic: minutes only grow) | org + class staff | org members |
| `rewards` | the family's real-world prize | org members only | org members |
| `assignments` | teacher missions for a class | class staff; families of enrolled children | class staff |

"Class staff" = the class teacher (while still a member of the school) or an owner/admin of the school, and only
while the class is not archived. Teachers can **read** learning data of enrolled children but never modify it.
Nobody sees other organizations. `anon` has no access to anything.

### RPCs (all `SECURITY DEFINER` with explicit checks unless noted)

- `create_organization(p_kind, p_name)` → org; the caller becomes owner (atomic).
- `create_invite(p_org_id, p_email, p_role)` → token. `accept_invite(p_token)` (e-mail must match and be confirmed).
  `claim_invites()` accepts every pending invite for the signed-in e-mail (called by the app at sign-in).
- `join_class(p_code, p_child_id)` → class or `null` for an unknown code (20 failures/hour rate limit). This is the
  parent's consent step.
- `regenerate_join_code(p_class_id)`, `erase_child(p_child_id)` (GDPR hard delete, owner/admin).
- `child_stats(p_child_ids, p_since, p_errors_since)` — dashboard aggregates; `SECURITY INVOKER`, so RLS decides
  which children are returned. Accuracy ignores `recognition` errors.

### Sync conventions (see `src/data/sync.ts`)

- Ids of child-scoped rows are generated on the device (offline creation).
- `updated_at` is the client edit time: last-writer-wins guard in `tg_sync_lww` (stale writes are skipped; future
  clocks are clamped to now + 10 min). `synced_at` is the server change time (`clock_timestamp()`) used as the pull
  cursor.
- `progress` is merged monotonically on the client and written with compare-and-swap on `version`.
- `attempts` are inserted with `on conflict do nothing` (idempotent re-sends).

## Verify it locally (automated RLS suite)

No Docker or Supabase account needed: the suite boots a throw-away Postgres 16 (Python package `pgserver`),
creates a minimal stand-in of Supabase's `auth` schema and API roles (`tests/00_supabase_stub.sql`, including
Supabase's permissive default privileges), applies the migration **twice** (idempotency), runs the scenarios and
re-applies the migration once more on the populated database.

```bash
supabase/tests/run.sh          # first run creates supabase/.venv (needs Python 3.9–3.12)
supabase/tests/run.sh --keep   # keep the database running afterwards and print its URI
```

`tests/10_rls.sql` (158 checks) covers: profile trigger; org creation and isolation between two families;
invites (wrong e-mail, unconfirmed e-mail, expired, single use, role/kind rules); children CRUD, CHECK constraints,
id hijacking through upsert, last-writer-wins and clock clamping; learning data isolation; append-only attempts;
monotonic sessions; progress versions; a school with two teachers (each sees only their class's enrolled children,
cannot edit them, cannot assign work to a colleague's class); join codes (case-insensitive, idempotent, archived
classes, unknown codes); teacher access ends when the class is archived, the parent withdraws consent or the teacher
leaves the school; membership management (last owner, admins vs owners); GDPR erasure cascades; anonymous access.

Each scenario impersonates a user like PostgREST does (`request.jwt.claims` + `set role authenticated`), see
`tests/01_test_helpers.sql`. To add a check, append a `begin; select tests.login('…'); … commit;` block.
