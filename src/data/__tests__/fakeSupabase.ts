/* In-memory stand-in for the subset of @supabase/supabase-js the data module uses. Emulates the server behaviour
   that matters for sync (see supabase/migrations/0001_init.sql): last-writer-wins guard, progress versions,
   monotonic sessions, append-only attempts, synced_at cursor, PK conflicts. */
import type { SupabaseClient } from '@supabase/supabase-js'

export type Row = Record<string, unknown>
type Err = { message: string; code?: string; status?: number; details?: string }
type Result = { data: unknown; error: Err | null; status?: number }

const PKS: Record<string, string[]> = {
  children: ['id'], progress: ['child_id'], skill_mastery: ['child_id', 'skill'], attempts: ['id'], sessions: ['id'],
  rewards: ['id'], classes: ['id'], class_enrollments: ['class_id', 'child_id'], assignments: ['id'],
  memberships: ['org_id', 'user_id'], organizations: ['id'], profiles: ['id'],
}
const LWW = new Set(['children', 'skill_mastery', 'rewards'])
const CHILD_SCOPED = new Set(['progress', 'skill_mastery', 'attempts', 'sessions', 'rewards'])

export interface Call {
  table: string
  op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' | 'rpc'
  payload?: unknown
  filters: string[]
}

export class FakeSupabase {
  tables: Record<string, Row[]> = {}
  calls: Call[] = []
  /** Return an error to make a call fail (network or Postgres error). */
  fail: ((call: Call) => Err | null | undefined) | null = null
  rpcs: Record<string, (args: Record<string, unknown>) => Result> = {}
  auth = new FakeAuth(this)
  private clock = Date.parse('2026-01-01T00:00:00.000Z')

  serverNow(): string {
    this.clock += 1
    return new Date(this.clock).toISOString().replace('Z', '+00:00')
  }

  rows(table: string): Row[] {
    return (this.tables[table] ??= [])
  }

  from(table: string): Query {
    return new Query(this, table)
  }

  rpc(name: string, args: Record<string, unknown> = {}): PromiseLike<Result> {
    const call: Call = { table: name, op: 'rpc', payload: args, filters: [] }
    this.calls.push(call)
    const err = this.fail?.(call)
    if (err) return Promise.resolve({ data: null, error: err })
    const h = this.rpcs[name]
    return Promise.resolve(h ? h(args) : { data: null, error: { message: `rpc ${name} not mocked`, code: 'PGRST202' } })
  }

  asClient(): SupabaseClient {
    return this as unknown as SupabaseClient
  }

  /** What a server-side trigger would do with an incoming row. Returns null when the write is skipped. */
  applyWrite(table: string, incoming: Row, existing: Row | undefined): Row | null {
    const row: Row = { ...(existing ?? {}), ...incoming }
    // 0002_erasure_tombstones_rewards.sql: an erased child can never be written again; its data has no parent row (FK).
    const erased = new Set(this.rows('erased_children').map((r) => String(r.child_id)))
    if (table === 'children' && erased.has(String(incoming.id))) throw { message: 'child was erased', code: '42501' }
    if (CHILD_SCOPED.has(table) && erased.has(String(incoming.child_id))) throw { message: 'insert or update violates foreign key constraint', code: '23503' }
    if (existing && LWW.has(table) && Date.parse(String(incoming.updated_at)) < Date.parse(String(existing.updated_at))) return null
    if (table === 'children' && existing?.deleted_at) row.deleted_at = existing.deleted_at // tombstones are permanent
    if (table === 'progress') row.version = existing ? Number(existing.version) + 1 : 1
    if (table === 'sessions' && existing) {
      row.minutes = Math.max(Number(existing.minutes ?? 0), Number(incoming.minutes ?? 0))
      row.ended_at = incoming.ended_at ?? existing.ended_at ?? null
      row.summary = incoming.summary ?? existing.summary ?? null
    }
    if (table === 'attempts' && existing) throw { message: 'attempts are append-only', code: '42501' }
    row.synced_at = this.serverNow()
    return row
  }
}

function pkOf(table: string, row: Row, cols = PKS[table] ?? ['id']): string {
  return cols.map((c) => String(row[c])).join('|')
}

class Query implements PromiseLike<Result> {
  private op: Call['op'] = 'select'
  private payload: unknown
  private onConflict?: string
  private ignoreDuplicates = false
  private returning = false
  private filters: ((r: Row) => boolean)[] = []
  private filterDesc: string[] = []
  private orderBy: { col: string; asc: boolean } | null = null
  private limitN: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private mode: 'many' | 'single' | 'maybe' = 'many'
  private db: FakeSupabase
  private table: string

  constructor(db: FakeSupabase, table: string) {
    this.db = db
    this.table = table
  }

  select(_cols?: string): this {
    if (this.op !== 'select') this.returning = true
    return this
  }
  insert(rows: Row | Row[]): this {
    this.op = 'insert'
    this.payload = Array.isArray(rows) ? rows : [rows]
    return this
  }
  upsert(rows: Row | Row[], opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}): this {
    this.op = 'upsert'
    this.payload = Array.isArray(rows) ? rows : [rows]
    this.onConflict = opts.onConflict
    this.ignoreDuplicates = Boolean(opts.ignoreDuplicates)
    return this
  }
  update(patch: Row): this {
    this.op = 'update'
    this.payload = patch
    return this
  }
  delete(): this {
    this.op = 'delete'
    return this
  }
  private f(desc: string, fn: (r: Row) => boolean): this {
    this.filters.push(fn)
    this.filterDesc.push(desc)
    return this
  }
  eq(c: string, v: unknown) { return this.f(`${c}=eq.${v}`, (r) => String(r[c]) === String(v)) }
  neq(c: string, v: unknown) { return this.f(`${c}=neq.${v}`, (r) => String(r[c]) !== String(v)) }
  in(c: string, vs: unknown[]) { return this.f(`${c}=in.(${vs.length})`, (r) => vs.map(String).includes(String(r[c]))) }
  gt(c: string, v: string) { return this.f(`${c}=gt.${v}`, (r) => cmp(r[c], v) > 0) }
  gte(c: string, v: string) { return this.f(`${c}=gte.${v}`, (r) => cmp(r[c], v) >= 0) }
  lt(c: string, v: string) { return this.f(`${c}=lt.${v}`, (r) => cmp(r[c], v) < 0) }
  lte(c: string, v: string) { return this.f(`${c}=lte.${v}`, (r) => cmp(r[c], v) <= 0) }
  is(c: string, v: null) { return this.f(`${c}=is.${v}`, (r) => (r[c] ?? null) === v) }
  like(c: string, pattern: string) {
    const re = new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$')
    return this.f(`${c}=like.${pattern}`, (r) => re.test(String(r[c])))
  }
  order(col: string, opts: { ascending?: boolean } = {}) {
    this.orderBy = { col, asc: opts.ascending !== false }
    return this
  }
  limit(n: number) {
    this.limitN = n
    return this
  }
  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }
  single() {
    this.mode = 'single'
    return this
  }
  maybeSingle() {
    this.mode = 'maybe'
    return this
  }

  then<A = Result, B = never>(onfulfilled?: ((value: Result) => A | PromiseLike<A>) | null, onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.exec()).then(onfulfilled, onrejected)
  }

  private matches(r: Row): boolean {
    return this.filters.every((f) => f(r))
  }

  private shape(rows: Row[]): Result {
    if (this.mode === 'single') {
      if (rows.length !== 1) return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } }
      return { data: { ...rows[0] }, error: null }
    }
    if (this.mode === 'maybe') return { data: rows[0] ? { ...rows[0] } : null, error: null }
    return { data: rows.map((r) => ({ ...r })), error: null }
  }

  private exec(): Result {
    const call: Call = { table: this.table, op: this.op, payload: this.payload, filters: this.filterDesc }
    this.db.calls.push(call)
    const err = this.db.fail?.(call)
    if (err) return { data: null, error: err, status: err.status ?? (err.code ? 400 : 0) }
    const store = this.db.rows(this.table)
    try {
      switch (this.op) {
        case 'select': {
          let rows = store.filter((r) => this.matches(r))
          if (this.orderBy) {
            const { col, asc } = this.orderBy
            rows = [...rows].sort((a, b) => cmp(a[col], b[col]) * (asc ? 1 : -1))
          }
          if (this.rangeFrom !== null) rows = rows.slice(this.rangeFrom, (this.rangeTo ?? rows.length) + 1)
          if (this.limitN !== null) rows = rows.slice(0, this.limitN)
          return this.shape(rows)
        }
        case 'insert': {
          const out: Row[] = []
          for (const r of this.payload as Row[]) {
            const key = pkOf(this.table, r)
            if (store.some((x) => pkOf(this.table, x) === key)) return { data: null, error: { message: 'duplicate key value violates unique constraint', code: '23505' } }
            const row = this.db.applyWrite(this.table, r, undefined)!
            store.push(row)
            out.push(row)
          }
          return this.returning ? this.shape(out) : { data: null, error: null }
        }
        case 'upsert': {
          const cols = this.onConflict ? this.onConflict.split(',').map((s) => s.trim()) : PKS[this.table]
          const out: Row[] = []
          for (const r of this.payload as Row[]) {
            const key = pkOf(this.table, r, cols)
            const i = store.findIndex((x) => pkOf(this.table, x, cols) === key)
            if (i >= 0) {
              if (this.ignoreDuplicates) continue
              const next = this.db.applyWrite(this.table, r, store[i])
              if (next) {
                store[i] = next
                out.push(next)
              }
            } else {
              const row = this.db.applyWrite(this.table, r, undefined)!
              store.push(row)
              out.push(row)
            }
          }
          return this.returning ? this.shape(out) : { data: null, error: null }
        }
        case 'update': {
          const out: Row[] = []
          store.forEach((r, i) => {
            if (!this.matches(r)) return
            const next = this.db.applyWrite(this.table, this.payload as Row, r)
            if (next) {
              store[i] = next
              out.push(next)
            }
          })
          return this.returning ? this.shape(out) : { data: null, error: null }
        }
        case 'delete': {
          const keep = store.filter((r) => !this.matches(r))
          this.db.tables[this.table] = keep
          return { data: null, error: null }
        }
      }
    } catch (e) {
      return { data: null, error: e as Err }
    }
    return { data: null, error: null }
  }
}

function cmp(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  const ta = typeof a === 'string' ? Date.parse(a) : NaN
  const tb = typeof b === 'string' ? Date.parse(b) : NaN
  if (!Number.isNaN(ta) && !Number.isNaN(tb) && /\d{4}-\d\d-\d\dT/.test(String(a)) && /\d{4}-\d\d-\d\dT/.test(String(b))) return ta - tb
  return String(a ?? '').localeCompare(String(b ?? ''))
}

// ------------------------------------------------------------------------------------------------ auth

interface FakeUser {
  id: string
  email: string
  created_at: string
  user_metadata: Record<string, unknown>
  identities: unknown[]
}

export class FakeAuth {
  users: (FakeUser & { password: string })[] = []
  session: { user: FakeUser; access_token: string } | null = null
  /** When true, signUp does not return a session (e-mail confirmation required). */
  requireConfirmation = false
  /** When true, getUser and updateUser fail as if the server could not be reached. */
  unreachable = false
  private listeners: ((event: string, session: unknown) => void)[] = []
  private parent: FakeSupabase

  constructor(parent: FakeSupabase) {
    this.parent = parent
  }

  private emit(event: string) {
    for (const l of this.listeners) l(event, this.session)
  }

  addUser(email: string, password: string, meta: Record<string, unknown> = {}): FakeUser {
    const user = { id: crypto.randomUUID(), email, password, created_at: new Date().toISOString(), user_metadata: meta, identities: [{}] }
    this.users.push(user)
    this.parent.rows('profiles').push({ id: user.id, email, display_name: String(meta.display_name ?? ''), locale: 'es-ES', created_at: user.created_at })
    return user
  }

  onAuthStateChange(cb: (event: string, session: unknown) => void) {
    this.listeners.push(cb)
    setTimeout(() => cb('INITIAL_SESSION', this.session), 0)
    return { data: { subscription: { unsubscribe: () => (this.listeners = this.listeners.filter((l) => l !== cb)) } } }
  }

  async getSession() {
    return { data: { session: this.session }, error: null }
  }

  async getUser() {
    if (this.unreachable) return { data: { user: null }, error: { message: 'Failed to fetch', status: 0 } }
    return { data: { user: this.session?.user ?? null }, error: null }
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const u = this.users.find((x) => x.email === email && x.password === password)
    if (!u) return { data: { user: null, session: null }, error: { message: 'Invalid login credentials', code: 'invalid_credentials', status: 400 } }
    this.session = { user: u, access_token: 'token' }
    this.emit('SIGNED_IN')
    return { data: { user: u, session: this.session }, error: null }
  }

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    if (this.users.some((x) => x.email === email)) return { data: { user: { identities: [] }, session: null }, error: null }
    const u = this.addUser(email, password, options?.data ?? {})
    if (this.requireConfirmation) return { data: { user: u, session: null }, error: null }
    this.session = { user: u, access_token: 'token' }
    this.emit('SIGNED_IN')
    return { data: { user: u, session: this.session }, error: null }
  }

  async updateUser({ data }: { data?: Record<string, unknown>; password?: string }) {
    if (this.unreachable) return { data: { user: null }, error: { message: 'Failed to fetch', status: 0 } }
    if (this.session && data) this.session.user.user_metadata = { ...this.session.user.user_metadata, ...data }
    return { data: { user: this.session?.user ?? null }, error: null }
  }

  async signOut() {
    this.session = null
    this.emit('SIGNED_OUT')
    return { error: null }
  }

  async signInWithOtp() {
    return { data: {}, error: null }
  }

  async resetPasswordForEmail() {
    return { data: {}, error: null }
  }
}
