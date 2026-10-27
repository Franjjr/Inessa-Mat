import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AttemptRecord, ProgressState } from '@/types'
import {
  createChild, getProgress, getRewards, listChildren, markRewardClaimed, recordAttempt, saveMastery, setChestReward, startSession,
  updateChild, updateProgress,
} from '@/data'
import { db } from '../db'
import { META, getMeta } from '../meta'
import { MAX_ENTRY_TRIES } from '../outbox'
import { PAGE_SIZE } from '../remote'
import { getSyncStatus, runSync, syncNow } from '../sync'
import { FakeSupabase, type Row } from './fakeSupabase'
import { LUNA, org, resetAll, signIn } from './helpers'

let fake: FakeSupabase
const FAM = org('fam-a')

beforeEach(async () => {
  fake = new FakeSupabase()
  await resetAll(fake)
  signIn('u1', [FAM])
})

afterEach(() => {
  vi.restoreAllMocks()
})

const attempt = (childId: string, over: Partial<AttemptRecord> = {}): AttemptRecord => ({
  id: crypto.randomUUID(), childId, sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42',
  expected: '42', ms: 3200, inputMode: 'pen', hintsUsed: 0, errorType: null, context: { worldId: 'w3' },
  createdAt: new Date().toISOString(), ...over,
})

async function playABit() {
  const c = await createChild({ nickname: 'Inessa', gender: 'f', grade: 2, companion: LUNA })
  const s = await startSession(c.id)
  await recordAttempt(attempt(c.id, { sessionId: s.id }))
  await recordAttempt(attempt(c.id, { sessionId: s.id, correct: false, given: '48', errorType: 'fact' }))
  const t = new Date().toISOString()
  await saveMastery(c.id, [{ skill: 'mul:6x7', box: 2, attempts: 2, correct: 1, streak: 0, avgMs: 3200, lastSeenAt: t, dueAt: t, updatedAt: t }])
  await updateProgress(c.id, (p) => ({ ...p, stars: 3 }))
  await setChestReward(c.id, 'Una tarde de cine')
  return c
}

describe('push (outbox flush)', () => {
  it('pushes every table in dependency order and empties the outbox', async () => {
    const c = await playABit()
    expect(await db.outbox.count()).toBeGreaterThan(5)
    await runSync({ pull: false })
    expect(await db.outbox.count()).toBe(0)

    const writes = fake.calls.filter((x) => x.op !== 'select' && x.op !== 'rpc').map((x) => x.table)
    const order = ['children', 'progress', 'skill_mastery', 'sessions', 'attempts', 'rewards']
    const firstIndex = order.map((t) => writes.indexOf(t))
    expect(firstIndex.every((i) => i >= 0)).toBe(true)
    expect([...firstIndex].sort((a, b) => a - b)).toEqual(firstIndex)

    expect(fake.rows('children')[0]).toMatchObject({ id: c.id, org_id: 'fam-a', nickname: 'Inessa', gender: 'f', grade: 2 })
    expect(fake.rows('attempts')).toHaveLength(2)
    expect(fake.rows('skill_mastery')[0]).toMatchObject({ child_id: c.id, skill: 'mul:6x7' })
    expect((fake.rows('skill_mastery')[0].data as Row).box).toBe(2)
    expect((fake.rows('progress')[0].state as ProgressState).stars).toBe(3)
    expect(fake.rows('sessions')).toHaveLength(1)
    expect(fake.rows('rewards')[0]).toMatchObject({ title: 'Una tarde de cine', kind: 'chest' })
    expect(await getMeta(META.progressVersion(c.id))).toBe(1)

    const status = getSyncStatus()
    expect(status.state).toBe('idle')
    expect(status.lastSyncedAt).toBeTruthy()
  })

  it('never pushes local-only children', async () => {
    signIn('u1', []) // signed in without org → new children are local-only
    await createChild({ nickname: 'Local', gender: 'f', companion: LUNA })
    signIn('u1', [FAM])
    await runSync({ pull: false })
    expect(fake.rows('children')).toHaveLength(0)
  })

  it('re-sending attempts is idempotent (append-only, on conflict do nothing)', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const a = attempt(c.id)
    await recordAttempt(a)
    await runSync({ pull: false })
    await recordAttempt(a) // e.g. an app crash before the ack: the same attempt is queued again
    await runSync({ pull: false })
    expect(fake.rows('attempts')).toHaveLength(1)
    const upserts = fake.calls.filter((x) => x.table === 'attempts' && x.op === 'upsert')
    expect(upserts).toHaveLength(2)
  })

  it('progress: merges monotonically with what another device already uploaded', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: false })
    // Another tablet won the crystal of world 1 and saved it first.
    const remote = fake.rows('progress')[0]
    const other = structuredClone(remote.state) as ProgressState
    other.worlds.w1 = { ...other.worlds.w1, crystal: true, letter: 'V' }
    other.stickers = ['s-owl']
    other.updatedAt = new Date(Date.now() + 1000).toISOString()
    remote.state = other
    remote.version = Number(remote.version) + 1
    // Meanwhile this device earned stars offline.
    await updateProgress(c.id, (p) => ({ ...p, stars: 12, stickers: ['s-forest'] }))
    await runSync({ pull: false })

    const server = fake.rows('progress')[0].state as ProgressState
    expect(server.worlds.w1.crystal).toBe(true)
    expect(server.worlds.w1.letter).toBe('V')
    expect(server.stars).toBe(12)
    expect(server.stickers).toEqual(['s-forest', 's-owl'])
    const local = await getProgress(c.id)
    expect(local.worlds.w1.crystal).toBe(true) // the device now shows the crystal too
    expect(await db.outbox.count()).toBe(0)
  })

  it('progress: compare-and-swap retries when another device writes in between', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: false })
    await updateProgress(c.id, (p) => ({ ...p, stars: 5 }))
    let raced = false
    fake.fail = (call) => {
      // Right before our conditional update lands, another device bumps the row.
      if (!raced && call.table === 'progress' && call.op === 'update') {
        raced = true
        const row = fake.rows('progress')[0]
        const st = structuredClone(row.state) as ProgressState
        st.accessoriesOwned = ['hat']
        row.state = st
        row.version = Number(row.version) + 1
      }
      return null
    }
    await runSync({ pull: false })
    const server = fake.rows('progress')[0].state as ProgressState
    expect(server.stars).toBe(5)
    expect(server.accessoriesOwned).toEqual(['hat'])
    expect((await getProgress(c.id)).accessoriesOwned).toEqual(['hat'])
  })

  it('network failure: keeps the outbox, reports offline, recovers later', async () => {
    await playABit()
    const before = await db.outbox.count()
    fake.fail = () => ({ message: 'TypeError: Failed to fetch', code: '' })
    await runSync({ pull: false })
    expect(await db.outbox.count()).toBe(before)
    expect(getSyncStatus().state).toBe('offline')
    fake.fail = null
    await runSync({ pull: false })
    expect(await db.outbox.count()).toBe(0)
    expect(getSyncStatus().state).toBe('idle')
  })

  it('a server without the erasure table (migration 0002 not applied) still syncs everything else', async () => {
    const c = await playABit()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    fake.fail = (call) => (call.table === 'erased_children'
      ? { message: "Could not find the table 'public.erased_children' in the schema cache", code: 'PGRST205', status: 404 }
      : null)
    await runSync({ pull: true })
    expect(fake.rows('children').map((r) => r.id)).toEqual([c.id])
    expect(await db.outbox.count()).toBe(0)
    expect(getSyncStatus().state).toBe('idle')
  })

  it('a signed-in adult with no family says so instead of «all saved»', async () => {
    signIn('u2', [])
    await runSync({ pull: true })
    const status = getSyncStatus()
    expect(status.state).toBe('error')
    expect(status.error).toMatch(/familia/)
  })

  it('does not even try when the browser says it is offline', async () => {
    await playABit()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await runSync({ pull: false })
    expect(fake.calls).toHaveLength(0)
    expect(getSyncStatus().state).toBe('offline')
  })

  it('a rejected row does not block the others; it backs off and eventually is marked dead', async () => {
    const good = await createChild({ nickname: 'Buena', gender: 'f', companion: LUNA })
    const bad = await createChild({ nickname: 'Mala', gender: 'f', companion: LUNA })
    fake.fail = (call) => {
      const rows = (call.payload as Row[] | undefined) ?? []
      if (call.table === 'children' && Array.isArray(rows) && rows.some((r) => r.nickname === 'Mala')) {
        return { message: 'new row violates row-level security policy', code: '42501' }
      }
      return null
    }
    await runSync({ pull: false })
    expect(fake.rows('children').map((r) => r.id)).toEqual([good.id])
    const entry = await db.outbox.where('[table+key]').equals(['children', bad.id]).first()
    expect(entry?.tries).toBe(1)
    expect(entry?.nextTryAt).toBeGreaterThan(Date.now())
    for (let i = 1; i < MAX_ENTRY_TRIES; i++) {
      await db.outbox.update(entry!.seq!, { nextTryAt: 0 })
      await runSync({ pull: false })
    }
    const deadEntry = await db.outbox.get(entry!.seq!)
    expect(deadEntry?.dead).toBe(true)
    expect(deadEntry?.lastError).toContain('42501')
    // syncNow (manual) revives it; once the server accepts it, it is gone.
    fake.fail = null
    await syncNow()
    expect(await db.outbox.count()).toBe(0)
    expect(fake.rows('children')).toHaveLength(2)
  })

  it('an edit made while a push is in flight stays queued', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    let edited = false
    fake.fail = (call) => {
      if (!edited && call.table === 'children' && call.op === 'upsert') {
        edited = true
        void updateChild(c.id, { nickname: 'Ine' })
      }
      return null
    }
    await runSync({ pull: false })
    await new Promise((r) => setTimeout(r, 20))
    expect(await db.outbox.where('[table+key]').equals(['children', c.id]).count()).toBe(1)
    fake.fail = null
    await runSync({ pull: false })
    expect(fake.rows('children')[0].nickname).toBe('Ine')
  })
})

describe('pull', () => {
  const remoteChild = (id: string, over: Row = {}): Row => ({
    id, org_id: 'fam-a', nickname: 'Leo', gender: 'm', birth_year: null, grade: 3,
    companion: { species: 'dog', name: 'Rex', gender: 'm', colorway: 'default', equipped: [] }, settings: { sound: false },
    created_at: '2026-01-01T10:00:00+00:00', updated_at: '2026-01-01T10:00:00+00:00', deleted_at: null, synced_at: fake.serverNow(), ...over,
  })

  it('brings children and their learning data created on another device', async () => {
    const id = crypto.randomUUID()
    fake.rows('children').push(remoteChild(id))
    fake.rows('progress').push({ child_id: id, state: { childId: id, seasonId: 's1', worlds: { w1: { unlocked: true, crystal: true, nodes: {} } }, stars: 9, starsSpent: 0, stickers: [], accessoriesOwned: [], chestOpened: false, daysPlayed: [], flags: {}, updatedAt: '2026-01-02T10:00:00.000Z' }, version: 4, updated_at: '2026-01-02T10:00:00+00:00', synced_at: fake.serverNow() })
    fake.rows('skill_mastery').push({ child_id: id, skill: 'mul:8x8', data: { skill: 'mul:8x8', box: 3, attempts: 5, correct: 4, streak: 2, avgMs: 2500, lastSeenAt: null, dueAt: null, updatedAt: '2026-01-02T10:00:00.000Z' }, updated_at: '2026-01-02T10:00:00+00:00', synced_at: fake.serverNow() })
    for (let i = 0; i < 3; i++) {
      fake.rows('attempts').push({ id: crypto.randomUUID(), child_id: id, session_id: null, skill: 'mul:8x8', kind: 'fact-mul', correct: true, given: '64', expected: '64', ms: 2000, input_mode: 'keypad', hints_used: 0, error_type: null, recognition_fixes: 0, context: {}, created_at: new Date().toISOString(), synced_at: fake.serverNow() })
    }
    await runSync({ pull: true })
    const kids = await listChildren()
    expect(kids.map((k) => k.nickname)).toEqual(['Leo'])
    expect(kids[0].settings.sound).toBe(false)
    expect(kids[0].settings.music).toBe(true) // defaults filled in
    expect((await getProgress(id)).stars).toBe(9)
    expect(await getMeta(META.progressVersion(id))).toBe(4)
    expect((await db.mastery.get([id, 'mul:8x8']))?.box).toBe(3)
    expect(await db.attempts.where('childId').equals(id).count()).toBe(3)
    expect(await db.outbox.count()).toBe(0) // nothing to push back
  })

  it('last-writer-wins: a newer local edit survives, an older one is replaced', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: false })
    // server copy edited later by another adult
    Object.assign(fake.rows('children')[0], { nickname: 'Inés', updated_at: new Date(Date.now() + 60_000).toISOString(), synced_at: fake.serverNow() })
    await runSync({ pull: true })
    expect((await db.children.get(c.id))?.nickname).toBe('Inés')
    // now a local edit newer than the server
    await updateChild(c.id, { nickname: 'Ine' })
    Object.assign(fake.rows('children')[0], { nickname: 'Vieja', updated_at: '2026-01-01T00:00:00+00:00', synced_at: fake.serverNow() })
    await runSync({ pull: true })
    expect((await db.children.get(c.id))?.nickname).toBe('Ine')
  })

  it('pages through large histories and stores a cursor', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: true })
    const n = PAGE_SIZE * 2 + 37
    for (let i = 0; i < n; i++) {
      fake.rows('attempts').push({ id: crypto.randomUUID(), child_id: c.id, session_id: null, skill: 'mul:7x7', kind: 'fact-mul', correct: i % 3 > 0, given: '49', expected: '49', ms: 2000, input_mode: 'pen', hints_used: 0, error_type: null, recognition_fixes: 0, context: {}, created_at: new Date().toISOString(), synced_at: fake.serverNow() })
    }
    await runSync({ pull: true })
    expect(await db.attempts.where('childId').equals(c.id).count()).toBe(n)
    expect(await getMeta(META.cursor('fam-a', 'attempts'))).toBeTruthy()
    const pages = fake.calls.filter((x) => x.table === 'attempts' && x.op === 'select').length
    expect(pages).toBeGreaterThanOrEqual(3)
  })

  it('a tombstone from the server removes the child from this device', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await recordAttempt(attempt(c.id))
    await runSync({ pull: false })
    Object.assign(fake.rows('children')[0], { deleted_at: new Date().toISOString(), updated_at: new Date(Date.now() + 60_000).toISOString(), synced_at: fake.serverNow() })
    await runSync({ pull: true })
    expect(await listChildren()).toEqual([])
    expect(await db.attempts.count()).toBe(0)
  })

  it('deletions are sticky: an older tombstone still beats a newer local edit, and a local tombstone is kept', async () => {
    const a = await createChild({ nickname: 'A', gender: 'f', companion: LUNA })
    const b = await createChild({ nickname: 'B', gender: 'm', companion: LUNA })
    await runSync({ pull: false })
    await updateChild(a.id, { nickname: 'A2' }) // newer local edit…
    Object.assign(fake.rows('children').find((r) => r.id === a.id)!, { deleted_at: '2026-01-01T00:00:00+00:00', updated_at: '2026-01-01T00:00:00+00:00', synced_at: fake.serverNow() })
    await db.children.update(b.id, { deletedAt: new Date().toISOString() }) // …and a local deletion not pushed yet
    Object.assign(fake.rows('children').find((r) => r.id === b.id)!, { nickname: 'B2', updated_at: new Date(Date.now() + 60_000).toISOString(), synced_at: fake.serverNow() })
    await runSync({ pull: true })
    expect((await db.children.get(a.id))?.deletedAt).toBeTruthy()
    expect((await db.children.get(b.id))?.deletedAt).toBeTruthy()
    expect(await listChildren()).toEqual([])
  })

  it('merges pulled progress with unsynced local progress and pushes the union', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await runSync({ pull: true })
    await updateProgress(c.id, (p) => ({ ...p, stickers: ['local'] }))
    const row = fake.rows('progress')[0]
    row.state = { ...(row.state as ProgressState), stickers: ['remote'], updatedAt: new Date(Date.now() + 5000).toISOString() }
    row.version = Number(row.version) + 1
    row.synced_at = fake.serverNow()
    await runSync({ pull: true })
    expect((await getProgress(c.id)).stickers).toEqual(['local', 'remote'])
    expect((fake.rows('progress')[0].state as ProgressState).stickers).toEqual(['local', 'remote'])
  })
})

describe('rewards pull (sync-4)', () => {
  it('a newer edit from a device that never saw the claim does not revert the claim, and the merge goes back up', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const reward = await setChestReward(c.id, 'Gran Cofre')
    await runSync({ pull: false })
    await markRewardClaimed(reward.id)
    await runSync({ pull: false }) // the server has the claim
    // A copy written without the claim (before the server kept claims monotonic) arrives with a newer title edit.
    const row = fake.rows('rewards')[0]
    Object.assign(row, { title: 'Una tarde de cine', claimed_at: null, unlocked_at: null, updated_at: new Date(Date.now() + 60_000).toISOString(), synced_at: fake.serverNow() })
    await runSync({ pull: true })
    const local = (await getRewards(c.id))[0]
    expect(local.title).toBe('Una tarde de cine')
    expect(local.claimedAt).toBeTruthy()
    expect(fake.rows('rewards')[0].claimed_at).toBeTruthy()
    expect(await db.outbox.count()).toBe(0)
  })
})
