import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_CHILD_SETTINGS, type AttemptRecord, type InkSample, type SkillMastery } from '@/types'
import {
  addInkSample, clearInkSamples, createChild, deleteChild, endSession, exportChildData, getChild, getChildSummary,
  getMastery, getProgress, getRewards, listAttempts, listChildren, listInkSamples, listSessions, markRewardClaimed,
  markRewardUnlocked, recordAttempt, saveMastery, setChestReward, startSession, touchSession, updateChild,
  updateProgress, DataError,
} from '@/data'
import { db, NumeriaDB, SCHEMA_VERSIONS } from '../db'
import { MAX_INK_SAMPLES_PER_DIGIT } from '../rewards'
import { META, getMeta } from '../meta'
import { seedDemo } from '../dev'
import { LUNA, org, resetAll, signIn } from './helpers'

beforeEach(async () => {
  await resetAll()
})

const attempt = (over: Partial<AttemptRecord> & { childId: string }): AttemptRecord => ({
  id: crypto.randomUUID(), sessionId: null, skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42', expected: '42',
  ms: 3000, inputMode: 'pen', hintsUsed: 0, errorType: null, context: {}, createdAt: new Date().toISOString(), ...over,
})

describe('children', () => {
  it('creates a local-only child with defaults, makes it active, and lists it', async () => {
    const c = await createChild({ nickname: '  Inessa ', gender: 'f', grade: 2, companion: LUNA })
    expect(c.orgId).toBeNull()
    expect(c.nickname).toBe('Inessa')
    expect(c.settings).toEqual(DEFAULT_CHILD_SETTINGS)
    expect(await listChildren()).toEqual([c])
    expect(await getMeta(META.activeChildId)).toBe(c.id)
    expect(await db.outbox.count()).toBe(0) // local-only children are not queued for sync
  })

  it('validates input with Spanish messages', async () => {
    await expect(createChild({ nickname: '', gender: 'f', companion: LUNA })).rejects.toThrow('Escribe un nombre')
    await expect(createChild({ nickname: 'Ana', gender: 'f', grade: 9, companion: LUNA })).rejects.toBeInstanceOf(DataError)
    await expect(createChild({ nickname: 'Ana', gender: 'f', companion: { ...LUNA, name: '' } })).rejects.toThrow('compañero')
  })

  it('updates with a strictly newer updatedAt and merges settings', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const u = await updateChild(c.id, { settings: { ...c.settings, sound: false }, companion: { ...c.companion, equipped: ['hat'] } })
    expect(u.settings.sound).toBe(false)
    expect(u.settings.music).toBe(true)
    expect(u.companion.equipped).toEqual(['hat'])
    expect(Date.parse(u.updatedAt)).toBeGreaterThan(Date.parse(c.updatedAt) - 1)
    expect(u.updatedAt).not.toBe(c.updatedAt)
    expect(u.createdAt).toBe(c.createdAt)
  })

  it('scopes the list to the active organization plus local-only children', async () => {
    const local = await createChild({ nickname: 'Local', gender: 'n', companion: LUNA })
    signIn('u1', [org('fam-a'), org('fam-b')])
    const a = await createChild({ nickname: 'De A', gender: 'm', companion: LUNA })
    expect(a.orgId).toBe('fam-a')
    expect((await listChildren()).map((c) => c.nickname)).toEqual(['Local', 'De A'])
    signIn('u1', [org('fam-b'), org('fam-a')]) // active = fam-b
    expect((await listChildren()).map((c) => c.id)).toEqual([local.id])
  })

  it('deleting a local-only child removes it and all its data', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await recordAttempt(attempt({ childId: c.id }))
    await getProgress(c.id)
    await deleteChild(c.id)
    expect(await db.children.get(c.id)).toBeUndefined()
    expect(await db.attempts.count()).toBe(0)
    expect(await db.progress.count()).toBe(0)
    expect(await getMeta(META.activeChildId)).toBeUndefined()
  })

  it('deleting an account child leaves a synced tombstone; guardians may not delete', async () => {
    signIn('u1', [org('fam-a')], 'guardian')
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    await expect(deleteChild(c.id)).rejects.toMatchObject({ code: 'permission' })
    signIn('u1', [org('fam-a')], 'owner')
    await deleteChild(c.id)
    const row = await db.children.get(c.id)
    expect(row?.deletedAt).toBeTruthy()
    expect(await getChild(c.id)).toBeUndefined()
    expect(await listChildren()).toEqual([])
    expect(await db.outbox.where('[table+key]').equals(['children', c.id]).count()).toBe(1)
  })
})

describe('progress & mastery', () => {
  it('creates progress on first read with world 1 unlocked', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const p = await getProgress(c.id)
    expect(p.childId).toBe(c.id)
    expect(p.worlds.w1.unlocked).toBe(true)
    expect(await db.progress.get(c.id)).toEqual(p)
  })

  it('does not persist progress for an unknown child', async () => {
    const p = await getProgress('not-on-this-device')
    expect(p.worlds.w1.unlocked).toBe(true)
    expect(await db.progress.count()).toBe(0)
  })

  it('updateProgress is an atomic read-modify-write with a bumped updatedAt', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const before = await getProgress(c.id)
    await Promise.all(Array.from({ length: 10 }, () => updateProgress(c.id, (s) => ({ ...s, stars: s.stars + 1 }))))
    const after = await getProgress(c.id)
    expect(after.stars).toBe(10)
    expect(Date.parse(after.updatedAt)).toBeGreaterThan(Date.parse(before.updatedAt))
  })

  it('saveMastery stores a map and keeps updatedAt increasing per skill', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const t = '2026-01-01T00:00:00.000Z'
    const m: SkillMastery = { skill: 'mul:6x7', box: 2, attempts: 3, correct: 2, streak: 1, avgMs: 3000, lastSeenAt: t, dueAt: t, updatedAt: t }
    await saveMastery(c.id, [m, { ...m, skill: 'mul:6x8', box: 1 }])
    await saveMastery(c.id, [{ ...m, box: 3 }]) // same (stale) updatedAt
    const map = await getMastery(c.id)
    expect(Object.keys(map).sort()).toEqual(['mul:6x7', 'mul:6x8'])
    expect(map['mul:6x7'].box).toBe(3)
    expect(Date.parse(map['mul:6x7'].updatedAt)).toBeGreaterThan(Date.parse(t))
    expect('childId' in map['mul:6x7']).toBe(false)
  })
})

describe('attempts & sessions', () => {
  it('lists attempts newest first with since/limit', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    for (let i = 0; i < 5; i++) await recordAttempt(attempt({ childId: c.id, createdAt: `2026-03-0${i + 1}T10:00:00.000Z` }))
    const all = await listAttempts(c.id)
    expect(all.map((a) => a.createdAt.slice(0, 10))).toEqual(['2026-03-05', '2026-03-04', '2026-03-03', '2026-03-02', '2026-03-01'])
    expect((await listAttempts(c.id, { since: '2026-03-03T00:00:00.000Z' })).length).toBe(3)
    expect((await listAttempts(c.id, { limit: 2 })).map((a) => a.createdAt.slice(0, 10))).toEqual(['2026-03-05', '2026-03-04'])
  })

  it('sessions: start records the day played; minutes only grow; end is idempotent', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const s = await startSession(c.id)
    expect(s.endedAt).toBeNull()
    expect((await getProgress(c.id)).daysPlayed.length).toBe(1)
    await touchSession(s.id, { minutes: 4 })
    await touchSession(s.id, { minutes: 2 })
    expect((await listSessions(c.id))[0].minutes).toBe(4)
    await endSession(s.id, { attempts: 3, correct: 2, starsEarned: 1, nodesCompleted: [] })
    const ended = (await listSessions(c.id))[0]
    await endSession(s.id, null)
    const again = (await listSessions(c.id))[0]
    expect(again.endedAt).toBe(ended.endedAt)
    expect(again.summary).toEqual({ attempts: 3, correct: 2, starsEarned: 1, nodesCompleted: [] })
    expect('updatedAt' in again).toBe(false)
  })
})

describe('rewards & ink', () => {
  it('one chest reward per child; unlock and claim are idempotent', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const r1 = await setChestReward(c.id, 'Una tarde de cine')
    const r2 = await setChestReward(c.id, 'Ir al zoo', 'Con la abuela')
    expect(r2.id).toBe(r1.id)
    await markRewardUnlocked(r1.id)
    const unlocked = (await getRewards(c.id))[0].unlockedAt
    await markRewardUnlocked(r1.id)
    await markRewardClaimed(r1.id)
    const [r] = await getRewards(c.id)
    expect(r.title).toBe('Ir al zoo')
    expect(r.description).toBe('Con la abuela')
    expect(r.unlockedAt).toBe(unlocked)
    expect(r.claimedAt).toBeTruthy()
    await expect(setChestReward(c.id, '   ')).rejects.toBeInstanceOf(DataError)
  })

  it('ink samples stay on the device and are capped per digit, keeping calibration samples', async () => {
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const sample = (i: number, source: InkSample['source']): InkSample => ({
      id: `s${i}`, childId: c.id, digit: 7, embedding: [i], source, createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
    })
    for (let i = 0; i < 5; i++) await addInkSample(sample(i, 'calibration'))
    for (let i = 5; i < MAX_INK_SAMPLES_PER_DIGIT + 10; i++) await addInkSample(sample(i, 'confirmed'))
    const list = await listInkSamples(c.id)
    expect(list.length).toBe(MAX_INK_SAMPLES_PER_DIGIT)
    expect(list.filter((s) => s.source === 'calibration').length).toBe(5)
    expect(await db.outbox.count()).toBe(0)
    await clearInkSamples(c.id)
    expect(await listInkSamples(c.id)).toEqual([])
  })
})

describe('dashboards & privacy', () => {
  it('summarises the seeded demo child (fact grid, minutes, accuracy without recognition errors)', async () => {
    const { childId } = await seedDemo()
    const s = await getChildSummary(childId)
    expect(s.nickname).toBe('Inessa')
    expect(s.companionSpecies).toBe('cat')
    expect(s.factGrid).toHaveLength(10)
    expect(s.factGrid[1][4]).toBe(5) // 2×5 mastered
    expect(s.factGrid[4][1]).toBe(5) // mirror
    expect(s.minutesLast7Days).toBeGreaterThan(30)
    expect(s.accuracyLast7Days).toBeGreaterThan(0.4)
    expect(s.accuracyLast7Days).toBeLessThan(1)
    expect(s.topErrors[0].errorType).toBe('fact')
    expect(s.topErrors.some((e) => e.errorType === 'recognition')).toBe(false)
    expect(s.worldsCompleted).toBeGreaterThanOrEqual(1)
    expect(s.currentWorld).toBe('w2')
    expect(s.lastPlayedAt).toBeTruthy()
  })

  it('exports everything stored for a child as JSON', async () => {
    const { childId } = await seedDemo()
    await addInkSample({ id: 'ink1', childId, digit: 3, embedding: [0.1, 0.2], source: 'calibration', createdAt: new Date().toISOString() })
    const blob = await exportChildData(childId)
    expect(blob.type).toBe('application/json')
    const doc = JSON.parse(await blob.text())
    expect(doc.format).toBe('numeria-child-export')
    expect(doc.child.nickname).toBe('Inessa')
    expect(doc.progress.childId).toBe(childId)
    expect(doc.attempts.length).toBeGreaterThan(50)
    expect(doc.sessions.length).toBe(6)
    expect(doc.handwritingSamples).toHaveLength(1)
    expect(doc.rewards[0].title).toBe('Una tarde de cine contigo')
  })
})

describe('schema migrations', () => {
  it('upgrades a version-1 database (children settings normalised)', async () => {
    const name = `numeria-upgrade-${Math.random()}`
    const v1 = new NumeriaDB(name, SCHEMA_VERSIONS.slice(0, 1))
    await v1.children.put({
      id: 'old', orgId: null, nickname: 'Vieja', gender: 'f', companion: LUNA,
      settings: { sound: false } as never, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z',
    })
    v1.close()
    const v2 = new NumeriaDB(name)
    const c = await v2.children.get('old')
    expect(c?.settings).toEqual({ ...DEFAULT_CHILD_SETTINGS, sound: false })
    expect(c?.deletedAt).toBeNull()
    expect(v2.verno).toBe(SCHEMA_VERSIONS.at(-1)!.version)
    v2.close()
    await Dexie.delete(name)
  })
})
