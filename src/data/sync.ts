/* Sync engine. Device first: every write lands in Dexie + outbox; when an adult is signed in and online, the
   outbox is pushed (children → progress → mastery → sessions → attempts → rewards) and changes are pulled.
     upserts:      children, mastery, sessions, rewards — last-writer-wins on updatedAt (server trigger guards it)
     append-only:  attempts — insert … on conflict do nothing (idempotent re-sends)
     progress:     monotonic merge + compare-and-swap on the server row version
     erasures:     GDPR tombstones (erased_children) pulled first; an erased child is dropped here and never pushed again
     rewards:      field-level merge: claimedAt / unlockedAt never go back (see mergeReward)
   Triggers: sign-in / org switch, 'online', tab visible, a local write (debounced), every 3 minutes; exponential
   backoff after failures. Only one tab syncs at a time (Web Locks when available). */
import { useSyncExternalStore } from 'react'
import { liveQuery, type Subscription } from 'dexie'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProgressState } from '@/types'
import { db } from './db'
import { isNetworkError } from './errors'
import {
  attemptFromRow, attemptToRow, childFromRow, childToRow, masteryFromRow, masteryToRow, progressFromRow, rewardFromRow,
  rewardToRow, sessionFromRow, sessionToRow,
} from './mappers'
import { eraseLocalChild, isErasedChild } from './erasure'
import { mergeProgress, mergeReward } from './merge'
import { META, getMeta, setMeta } from './meta'
import { ackEntry, enqueue, failEntry, onEnqueued, parseMasteryKey } from './outbox'
import { PAGE_SIZE, casProgress, fetchErasedChildIds, fetchProgress, insertProgress, selectChanged, upsertRows, type Row } from './remote'
import { getAuth, memberOrgIds, scopeOrgId, subscribeAuth, type AuthSnapshot } from './store'
import { getSupabase, isBackendAvailable } from './supabase'
import type { OutboxEntry, SyncTable } from './types'
import { chunk, deepEqual, isAfter, nowIso } from './util'

export interface SyncStatus {
  state: 'local-only' | 'offline' | 'idle' | 'syncing' | 'error'
  pending: number
  lastSyncedAt: string | null
  error?: string
}

// ------------------------------------------------------------------------------------------------ status store

const statusListeners = new Set<() => void>()
let status: SyncStatus = { state: 'local-only', pending: 0, lastSyncedAt: null }
let phase: 'idle' | 'syncing' = 'idle'
let errorKind: 'network' | 'server' | null = null
let errorText: string | undefined
let pending = 0
let dead = 0
let lastSyncedAt: string | null = null

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

const NO_FAMILY_TEXT = 'Tu cuenta todavía no tiene una familia: los niños se guardan solo aquí. Créala en «Familia» para guardarlos en la nube.'

function computeStatus(): SyncStatus {
  const auth = getAuth()
  const base = { pending, lastSyncedAt }
  if (!isBackendAvailable() || auth.status !== 'signed-in') return { state: 'local-only', ...base }
  // Signed in but without a family or school: children stay on this device, so «all saved» would be untrue.
  if (!auth.activeOrg) return { state: 'error', ...base, error: NO_FAMILY_TEXT }
  if (isOffline() || errorKind === 'network') return { state: 'offline', ...base }
  if (phase === 'syncing') return { state: 'syncing', ...base }
  if (errorKind === 'server') return { state: 'error', ...base, error: errorText ?? 'No se han podido guardar algunos cambios en la nube. Lo volveremos a intentar.' }
  if (dead > 0) {
    return { state: 'error', ...base, error: dead === 1 ? 'Hay 1 cambio que la nube no ha aceptado.' : `Hay ${dead} cambios que la nube no ha aceptado.` }
  }
  return { state: 'idle', ...base }
}

function publish(): void {
  const next = computeStatus()
  if (deepEqual(next, status)) return
  status = next
  for (const l of [...statusListeners]) l()
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener)
  return () => statusListeners.delete(listener)
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, getSyncStatus)
}

// ------------------------------------------------------------------------------------------------ push

const PUSH_ORDER: SyncTable[] = ['children', 'progress', 'mastery', 'sessions', 'attempts', 'rewards']
const BATCH = 200

interface UpsertSpec {
  remote: string
  onConflict: string
  ignoreDuplicates?: boolean
  load(key: string): Promise<Row | undefined>
}

const UPSERT_SPECS: Record<Exclude<SyncTable, 'progress'>, UpsertSpec> = {
  children: { remote: 'children', onConflict: 'id', load: async (k) => mapIf(await db.children.get(k), childToRow) },
  mastery: { remote: 'skill_mastery', onConflict: 'child_id,skill', load: async (k) => mapIf(await db.mastery.get(parseMasteryKey(k)), masteryToRow) },
  sessions: { remote: 'sessions', onConflict: 'id', load: async (k) => mapIf(await db.sessions.get(k), sessionToRow) },
  attempts: { remote: 'attempts', onConflict: 'id', ignoreDuplicates: true, load: async (k) => mapIf(await db.attempts.get(k), attemptToRow) },
  rewards: { remote: 'rewards', onConflict: 'id', load: async (k) => mapIf(await db.rewards.get(k), rewardToRow) },
}

function mapIf<T>(v: T | undefined, f: (v: T) => Row): Row | undefined {
  return v === undefined ? undefined : f(v)
}

function errorMessage(e: unknown): string {
  const err = (e ?? {}) as { message?: string; code?: string }
  return [err.code, err.message].filter(Boolean).join(': ') || String(e)
}

/** Errors that say "try again later" rather than "this row is wrong". */
function isTransient(e: unknown): boolean {
  if (isNetworkError(e)) return true
  const err = (e ?? {}) as { code?: string; status?: number; message?: string }
  if (err.status === 401 || err.status === 408 || err.status === 429 || (err.status !== undefined && err.status >= 500)) return true
  if (err.code && /^PGRST30\d$/.test(err.code)) return true // JWT expired / invalid: the client refreshes it
  if (/jwt/i.test(String(err.message ?? ''))) return true
  return false
}

async function pushUpsertTable(sb: SupabaseClient, table: Exclude<SyncTable, 'progress'>, entries: OutboxEntry[]): Promise<void> {
  const spec = UPSERT_SPECS[table]
  const loaded: { entry: OutboxEntry; row: Row }[] = []
  for (const entry of entries) {
    const row = await spec.load(entry.key)
    if (row) loaded.push({ entry, row })
    else await ackEntry(entry) // the local row is gone: nothing to send
  }
  for (const batch of chunk(loaded, BATCH)) {
    try {
      await upsertRows(sb, spec.remote, batch.map((b) => b.row), spec.onConflict, spec.ignoreDuplicates)
      for (const b of batch) await ackEntry(b.entry)
    } catch (e) {
      if (isTransient(e)) throw e
      // Isolate the rejected row(s) so the rest of the batch goes through.
      for (const b of batch) {
        try {
          await upsertRows(sb, spec.remote, [b.row], spec.onConflict, spec.ignoreDuplicates)
          await ackEntry(b.entry)
        } catch (e2) {
          if (isTransient(e2)) throw e2
          console.warn(`[numeria/sync] ${table} ${b.entry.key} rejected:`, e2)
          await failEntry(b.entry, errorMessage(e2))
        }
      }
    }
  }
}

/** Stores the state the server now holds; if the device changed meanwhile, merges instead (entry stays queued). */
async function settleProgress(childId: string, basis: ProgressState, pushed: ProgressState, version: number): Promise<void> {
  await db.transaction('rw', [db.progress, db.meta], async () => {
    const cur = await db.progress.get(childId)
    const next = !cur || deepEqual(cur, basis) ? pushed : mergeProgress(cur, pushed)
    if (!cur || !deepEqual(cur, next)) await db.progress.put(next)
    await db.meta.put({ key: META.progressVersion(childId), value: version })
  })
}

async function pushProgress(sb: SupabaseClient, entry: OutboxEntry): Promise<void> {
  const childId = entry.key
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = await db.progress.get(childId)
    if (!local) {
      await ackEntry(entry)
      return
    }
    const known = await getMeta<number>(META.progressVersion(childId))
    if (typeof known === 'number') {
      // Fast path: the server is still at the version our local state already includes.
      const v = await casProgress(sb, childId, local, known)
      if (v !== null) {
        await settleProgress(childId, local, local, v)
        await ackEntry(entry)
        return
      }
    }
    const remoteRow = await fetchProgress(sb, childId)
    if (!remoteRow) {
      const v = await insertProgress(sb, childId, local)
      if (v === 'conflict') continue
      await settleProgress(childId, local, local, v)
      await ackEntry(entry)
      return
    }
    const remote = progressFromRow(remoteRow)
    const merged = mergeProgress(local, remote.state)
    if (deepEqual(merged, remote.state)) {
      await settleProgress(childId, local, merged, remote.version)
      await ackEntry(entry)
      return
    }
    const v = await casProgress(sb, childId, merged, remote.version)
    if (v === null) continue // another device wrote in between: merge again
    await settleProgress(childId, local, merged, v)
    await ackEntry(entry)
    return
  }
  // Heavy contention: leave the entry queued for the next round.
}

async function pushAll(sb: SupabaseClient, auth: AuthSnapshot): Promise<void> {
  const orgs = memberOrgIds(auth)
  const now = Date.now()
  const entries = (await db.outbox.toArray()).filter((e) => !e.dead && e.nextTryAt <= now)
  if (!entries.length) return
  const ids = [...new Set(entries.map((e) => e.childId))]
  const kids = await db.children.bulkGet(ids)
  const orgOf = new Map<string, string | null>()
  kids.forEach((c, i) => {
    if (c) orgOf.set(ids[i], c.orgId)
  })
  const erased = new Set<string>()
  for (const id of ids) if (await isErasedChild(id)) erased.add(id)
  for (const e of entries) {
    if (!orgOf.has(e.childId) || erased.has(e.childId)) await ackEntry(e) // gone from this device, or erased
  }
  const eligible = entries.filter((e) => {
    if (erased.has(e.childId)) return false
    const org = orgOf.get(e.childId)
    return Boolean(org && orgs.has(org))
  })
  for (const table of PUSH_ORDER) {
    const group = eligible.filter((e) => e.table === table)
    if (!group.length) continue
    if (table === 'progress') {
      for (const e of group) {
        try {
          await pushProgress(sb, e)
        } catch (err) {
          if (isTransient(err)) throw err
          console.warn('[numeria/sync] progress rejected:', err)
          await failEntry(e, errorMessage(err))
        }
      }
    } else {
      await pushUpsertTable(sb, table, group)
    }
  }
}

// ------------------------------------------------------------------------------------------------ pull

const OVERLAP_MS = 60_000
const FIRST_PULL_DAYS = 90

function minusOverlap(ts: string): string {
  const t = Date.parse(ts)
  return Number.isFinite(t) ? new Date(t - OVERLAP_MS).toISOString() : ts
}

/** Pages through rows changed since `since`; returns the max synced_at seen (raw server string). */
async function pullPaged(
  sb: SupabaseClient,
  table: string,
  column: string,
  values: string[],
  since: string | null,
  apply: (rows: Row[]) => Promise<void>,
  window?: { column: string; days: number },
): Promise<string | null> {
  let start = since
  let maxSeen: string | null = null
  const createdSince = !since && window ? new Date(Date.now() - window.days * 86_400_000).toISOString() : undefined
  for (let page = 0; page < 400; page++) {
    const rows = await selectChanged(sb, table, column, values, start, window && createdSince ? { createdColumn: window.column, createdSince } : {})
    if (rows.length) await apply(rows)
    for (const r of rows) {
      const s = String(r.synced_at ?? '')
      if (s && (!maxSeen || s > maxSeen)) maxSeen = s
    }
    if (rows.length < PAGE_SIZE) break
    const first = String(rows[0].synced_at ?? '')
    const last = String(rows[rows.length - 1].synced_at ?? '')
    if (!last || first === last) break // cannot advance (pathological tie); the overlap re-reads it next time
    start = last
  }
  return maxSeen
}

async function dropLocalChildData(childId: string): Promise<void> {
  await db.outbox.where('childId').equals(childId).and((e) => e.table !== 'children').delete()
  await Promise.all([
    db.progress.delete(childId),
    db.mastery.where('childId').equals(childId).delete(),
    db.attempts.where('childId').equals(childId).delete(),
    db.sessions.where('childId').equals(childId).delete(),
    db.rewards.where('childId').equals(childId).delete(),
    db.inkSamples.where('childId').equals(childId).delete(),
  ])
  const active = await db.meta.get(META.activeChildId)
  if (active?.value === childId) await db.meta.delete(META.activeChildId)
}

async function applyChildren(rows: Row[]): Promise<void> {
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.inkSamples, db.outbox, db.meta], async () => {
    for (const r of rows) {
      const remote = childFromRow(r)
      if (await isErasedChild(remote.id)) continue // erased: never bring it back
      const local = await db.children.get(remote.id)
      if (local?.deletedAt && !remote.deletedAt) continue // our tombstone wins (it is queued for push)
      const tombstone = Boolean(remote.deletedAt && !local?.deletedAt)
      if (local && !tombstone && !isAfter(remote.updatedAt, local.updatedAt)) continue
      if (local && deepEqual(local, remote)) continue
      await db.children.put(remote)
      await db.outbox.where('[table+key]').equals(['children', remote.id]).delete() // local edit is older
      if (remote.deletedAt && !local?.deletedAt) await dropLocalChildData(remote.id)
    }
  })
}

async function applyProgressRows(rows: Row[]): Promise<void> {
  for (const r of rows) {
    const { state: remote, version } = progressFromRow(r)
    const childId = remote.childId
    await db.transaction('rw', [db.progress, db.children, db.outbox, db.meta], async () => {
      const local = await db.progress.get(childId)
      const merged = local ? mergeProgress(local, remote) : remote
      if (!local || !deepEqual(local, merged)) await db.progress.put(merged)
      await db.meta.put({ key: META.progressVersion(childId), value: version })
      if (!deepEqual(merged, remote)) await enqueue('progress', childId, childId)
    })
  }
}

async function applyMasteryRows(rows: Row[]): Promise<void> {
  await db.transaction('rw', [db.mastery, db.outbox], async () => {
    for (const r of rows) {
      const remote = masteryFromRow(r)
      const local = await db.mastery.get([remote.childId, remote.skill])
      if (local && !isAfter(remote.updatedAt, local.updatedAt)) continue
      await db.mastery.put(remote)
      await db.outbox.where('[table+key]').equals(['mastery', `${remote.childId}|${remote.skill}`]).delete()
    }
  })
}

async function applySessionRows(rows: Row[]): Promise<void> {
  await db.transaction('rw', db.sessions, async () => {
    for (const r of rows) {
      const remote = sessionFromRow(r)
      const local = await db.sessions.get(remote.id)
      if (!local) {
        await db.sessions.put(remote)
        continue
      }
      const merged = {
        ...local,
        minutes: Math.max(local.minutes, remote.minutes),
        endedAt: local.endedAt ?? remote.endedAt,
        summary: local.summary ?? remote.summary,
        updatedAt: isAfter(remote.updatedAt, local.updatedAt) ? remote.updatedAt : local.updatedAt,
      }
      if (!deepEqual(merged, local)) await db.sessions.put(merged)
    }
  })
}

async function applyAttemptRows(rows: Row[]): Promise<void> {
  const attempts = rows.map(attemptFromRow)
  await db.transaction('rw', db.attempts, async () => {
    const existing = await db.attempts.bulkGet(attempts.map((a) => a.id))
    const missing = attempts.filter((_, i) => !existing[i])
    if (missing.length) await db.attempts.bulkPut(missing)
  })
}

/** Rewards merge field by field (mergeReward): a claim or unlock is never reverted by an edit that did not see it. */
async function applyRewardRows(rows: Row[]): Promise<void> {
  await db.transaction('rw', [db.rewards, db.children, db.outbox, db.meta], async () => {
    for (const r of rows) {
      const remote = rewardFromRow(r)
      if (await isErasedChild(remote.childId)) continue
      const local = await db.rewards.get(remote.id)
      if (!local) {
        await db.rewards.put(remote)
        continue
      }
      const merged = mergeReward(local, remote)
      if (!deepEqual(merged, local)) await db.rewards.put(merged)
      if (deepEqual(merged, remote)) {
        await db.outbox.where('[table+key]').equals(['rewards', remote.id]).delete() // the server already has all of it
      } else {
        await enqueue('rewards', remote.id, merged.childId) // this device knows more (a claim): send the merge back
      }
    }
  })
}

interface PullSpec {
  table: SyncTable
  remote: string
  apply: (rows: Row[]) => Promise<void>
  window?: { column: string; days: number }
}

const LEARNING_PULLS: PullSpec[] = [
  { table: 'progress', remote: 'progress', apply: applyProgressRows },
  { table: 'mastery', remote: 'skill_mastery', apply: applyMasteryRows },
  { table: 'sessions', remote: 'sessions', apply: applySessionRows, window: { column: 'started_at', days: FIRST_PULL_DAYS } },
  { table: 'attempts', remote: 'attempts', apply: applyAttemptRows, window: { column: 'created_at', days: FIRST_PULL_DAYS } },
  { table: 'rewards', remote: 'rewards', apply: applyRewardRows },
]

/** Applies the family's GDPR tombstones before anything else, so a child erased on another device disappears here
 *  and cannot be re-created by the children pull or by a queued change. */
async function pullErasures(sb: SupabaseClient, auth: AuthSnapshot): Promise<void> {
  const ids = await fetchErasedChildIds(sb, [...memberOrgIds(auth)])
  for (const id of ids) {
    if ((await isErasedChild(id)) && !(await db.children.get(id)) && !(await db.outbox.where('childId').equals(id).count())) continue
    await eraseLocalChild(id)
  }
}

async function pullAll(sb: SupabaseClient, auth: AuthSnapshot): Promise<void> {
  const orgId = scopeOrgId(auth)
  if (!orgId) return
  await pullErasures(sb, auth)
  const knownBefore = new Set((await db.children.where('orgId').equals(orgId).primaryKeys()) as string[])

  const childCursorKey = META.cursor(orgId, 'children')
  const childCursor = await getMeta<string>(childCursorKey)
  const seenChildren = await pullPaged(sb, 'children', 'org_id', [orgId], childCursor ? minusOverlap(childCursor) : null, applyChildren)
  if (seenChildren && (!childCursor || seenChildren > childCursor)) await setMeta(childCursorKey, seenChildren)

  const live = (await db.children.where('orgId').equals(orgId).toArray()).filter((c) => !c.deletedAt).map((c) => c.id)
  const known = live.filter((id) => knownBefore.has(id))
  const fresh = live.filter((id) => !knownBefore.has(id))

  for (const spec of LEARNING_PULLS) {
    const key = META.cursor(orgId, spec.table)
    const cursor = await getMeta<string>(key)
    let maxSeen: string | null = null
    for (const ids of chunk(known, 40)) {
      const seen = await pullPaged(sb, spec.remote, 'child_id', ids, cursor ? minusOverlap(cursor) : null, spec.apply, spec.window)
      if (seen && (!maxSeen || seen > maxSeen)) maxSeen = seen
    }
    // Children that just appeared on this device: full history (within the window), regardless of the cursor.
    for (const ids of chunk(fresh, 40)) {
      const seen = await pullPaged(sb, spec.remote, 'child_id', ids, null, spec.apply, spec.window)
      if (seen && (!maxSeen || seen > maxSeen)) maxSeen = seen
    }
    if (maxSeen && (!cursor || maxSeen > cursor)) await setMeta(key, maxSeen)
  }
}

// ------------------------------------------------------------------------------------------------ engine

let timer: ReturnType<typeof setTimeout> | null = null
let timerAt = Infinity
let timerPull = false
let running: Promise<void> | null = null
let rerun: { pull: boolean } | null = null
let failures = 0

function schedule(delayMs: number, pull: boolean): void {
  const at = Date.now() + delayMs
  timerPull = timerPull || pull
  if (timer && timerAt <= at) return
  if (timer) clearTimeout(timer)
  timerAt = at
  timer = setTimeout(() => {
    const p = timerPull
    timer = null
    timerAt = Infinity
    timerPull = false
    void runSync({ pull: p })
  }, Math.max(0, delayMs))
}

function backoffMs(n: number): number {
  const base = Math.min(5 * 60_000, 5_000 * 2 ** Math.max(0, n - 1))
  return base * (0.75 + Math.random() * 0.5)
}

async function withSyncLock(fn: () => Promise<void>): Promise<void> {
  const locks = (typeof navigator !== 'undefined' ? (navigator as Navigator & { locks?: LockManager }).locks : undefined)
  if (!locks?.request) return fn()
  await locks.request('numeria-sync', { ifAvailable: true }, async (lock) => {
    if (lock) await fn()
  })
}

async function runOnce(pull: boolean): Promise<void> {
  const auth = getAuth()
  if (!isBackendAvailable() || auth.status !== 'signed-in' || !auth.user) {
    publish()
    return
  }
  if (isOffline()) {
    errorKind = 'network'
    publish()
    return
  }
  const sb = await getSupabase()
  if (!sb) return
  phase = 'syncing'
  publish()
  try {
    await withSyncLock(async () => {
      await pushAll(sb, auth)
      if (pull) {
        await pullAll(sb, auth)
        await pushAll(sb, auth) // merges made during the pull
      }
    })
    failures = 0
    errorKind = null
    errorText = undefined
    lastSyncedAt = nowIso()
    await setMeta(META.lastSyncedAt, lastSyncedAt)
  } catch (e) {
    failures++
    if (isTransient(e)) {
      errorKind = 'network'
    } else {
      errorKind = 'server'
      errorText = undefined
      console.warn('[numeria/sync] sync failed:', e)
    }
    schedule(backoffMs(failures), true)
  } finally {
    phase = 'idle'
    publish()
  }
}

/** Runs a sync (single-flight: concurrent calls coalesce into one follow-up run). */
export function runSync(opts: { pull?: boolean } = {}): Promise<void> {
  const pull = opts.pull ?? true
  if (running) {
    rerun = { pull: (rerun?.pull ?? false) || pull }
    return running
  }
  running = (async () => {
    try {
      await runOnce(pull)
      while (rerun) {
        const r = rerun
        rerun = null
        await runOnce(r.pull)
      }
    } finally {
      running = null
    }
  })()
  return running
}

/** Manual "sincronizar ahora": also retries changes the server rejected before. */
export async function syncNow(): Promise<void> {
  await db.outbox.toCollection().modify((e) => {
    if (e.dead || e.nextTryAt > Date.now()) {
      e.dead = false
      e.tries = 0
      e.nextTryAt = 0
    }
  })
  failures = 0
  await runSync({ pull: true })
}

let engineRefs = 0
let disposeEngine: (() => void) | null = null
const SYNC_INTERVAL_MS = 3 * 60_000

/** Starts listeners (idempotent, ref-counted). Returns a disposer. */
export function startSyncEngine(): () => void {
  engineRefs++
  if (engineRefs === 1) disposeEngine = attach()
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    engineRefs--
    if (engineRefs === 0) {
      disposeEngine?.()
      disposeEngine = null
    }
  }
}

function attach(): () => void {
  const disposers: (() => void)[] = []
  void getMeta<string>(META.lastSyncedAt).then((v) => {
    lastSyncedAt = v ?? null
    publish()
  })

  const sub: Subscription = liveQuery(async () => {
    let p = 0
    let d = 0
    await db.outbox.each((e) => {
      if (e.dead) d++
      else p++
    })
    return { p, d }
  }).subscribe({
    next: ({ p, d }) => {
      pending = p
      dead = d
      publish()
    },
    error: () => {},
  })
  disposers.push(() => sub.unsubscribe())

  disposers.push(onEnqueued(() => schedule(2_000, false)))

  let lastKey = ''
  disposers.push(
    subscribeAuth(() => {
      const a = getAuth()
      const key = `${a.status}|${a.user?.id ?? ''}|${a.activeOrg?.id ?? ''}|${a.memberships.length}`
      if (key !== lastKey) {
        lastKey = key
        if (a.status === 'signed-in') schedule(0, true)
      }
      publish()
    }),
  )

  if (typeof window !== 'undefined') {
    const onOnline = () => {
      errorKind = null
      failures = 0
      publish()
      schedule(500, true)
    }
    const onOffline = () => publish()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') schedule(500, true)
      else void runSync({ pull: false }) // best effort before the tab is frozen
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisibility)
    const interval = setInterval(() => {
      if (document.visibilityState !== 'hidden') schedule(0, true)
    }, SYNC_INTERVAL_MS)
    disposers.push(() => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(interval)
    })
  }

  const a = getAuth()
  lastKey = `${a.status}|${a.user?.id ?? ''}|${a.activeOrg?.id ?? ''}|${a.memberships.length}`
  if (a.status === 'signed-in') schedule(0, true)
  publish()

  return () => {
    for (const d of disposers) d()
    if (timer) clearTimeout(timer)
    timer = null
    timerAt = Infinity
    timerPull = false
  }
}

/** Tests: reset module state. */
export function __resetSyncForTests(): void {
  if (timer) clearTimeout(timer)
  timer = null
  timerAt = Infinity
  timerPull = false
  running = null
  rerun = null
  failures = 0
  phase = 'idle'
  errorKind = null
  errorText = undefined
  pending = 0
  dead = 0
  lastSyncedAt = null
  status = { state: 'local-only', pending: 0, lastSyncedAt: null }
}

/** Push the given child's profile right away (needed before server-side operations that reference it). */
export async function pushChildNow(childId: string): Promise<void> {
  const auth = getAuth()
  const sb = await getSupabase()
  if (!sb || auth.status !== 'signed-in') return
  if (await isErasedChild(childId)) return
  const entries = await db.outbox.where('childId').equals(childId).and((e) => e.table === 'children').toArray()
  if (entries.length) await pushUpsertTable(sb, 'children', entries)
}
