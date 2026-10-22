import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AttemptRecord, ProgressState } from '@/types'
import {
  createChild, createOrganization, getProgress, inviteMember, joinClassWithCode, listAssignmentsForChild, listChildren,
  recordAttempt, setChestReward, startSession, updateProgress, DataError,
} from '@/data'
import { continueLocalOnly, signInWithPassword, signOut, signUp, claimLocalData, setActiveOrg, startAuth, createInviteLink } from '../account'
import { db } from '../db'
import { META, setMeta } from '../meta'
import { getAuth } from '../store'
import { AUTH_STORAGE_KEY } from '../supabase'
import { runSync } from '../sync'
import { FakeSupabase, type Row } from './fakeSupabase'
import { LUNA, flushTimers, resetAll } from './helpers'

let fake: FakeSupabase
let stop: (() => void) | null = null

function installRpcs(f: FakeSupabase) {
  f.rpcs.claim_invites = () => ({ data: 0, error: null })
  f.rpcs.create_organization = (args) => {
    const uid = f.auth.session!.user.id
    const o = { id: crypto.randomUUID(), kind: args.p_kind, name: args.p_name, created_by: uid, settings: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    f.rows('organizations').push(o)
    f.rows('memberships').push({ org_id: o.id, user_id: uid, role: 'owner', created_at: o.created_at })
    return { data: o, error: null }
  }
  f.rpcs.create_invite = (args) => ({ data: `tok-${String(args.p_email)}`, error: null })
}

async function boot(): Promise<void> {
  stop = startAuth()
  await flushTimers(20)
}

beforeEach(async () => {
  fake = new FakeSupabase()
  installRpcs(fake)
  await resetAll(fake)
  localStorage.clear()
})

afterEach(async () => {
  stop?.()
  stop = null
  await flushTimers(5)
})

describe('auth', () => {
  it('starts anonymous with a backend and no session; continueLocalOnly persists the choice', async () => {
    expect(getAuth().status).toBe('loading')
    await boot()
    expect(getAuth().status).toBe('anonymous')
    expect(getAuth().backendAvailable).toBe(true)
    continueLocalOnly()
    expect(getAuth().status).toBe('local-only')
    expect((await db.meta.get(META.mode))?.value).toBe('local-only')
  })

  it('signUp with an immediate session creates the organization chosen at sign-up', async () => {
    await boot()
    await signUp({ email: 'Ana@Correo.es ', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia Martín' })
    const a = getAuth()
    expect(a.status).toBe('signed-in')
    expect(a.user?.email).toBe('ana@correo.es')
    expect(a.organizations.map((o) => o.name)).toEqual(['Familia Martín'])
    expect(a.activeOrg?.kind).toBe('family')
    expect(a.memberships[0].role).toBe('owner')
    expect(fake.auth.session?.user.user_metadata.org_name).toBeNull() // cleared after use
  })

  it('signUp needing e-mail confirmation stays anonymous; the org is created at the first sign-in', async () => {
    fake.auth.requireConfirmation = true
    await boot()
    await signUp({ email: 'sara@cole.es', password: 'secreto123', displayName: 'Sara', orgKind: 'school', orgName: 'CEIP Numeria' })
    expect(getAuth().status).toBe('anonymous')
    expect(fake.rows('organizations')).toHaveLength(0)
    await signInWithPassword('sara@cole.es', 'secreto123')
    expect(getAuth().status).toBe('signed-in')
    expect(getAuth().activeOrg?.name).toBe('CEIP Numeria')
    expect(fake.rows('organizations')).toHaveLength(1)
    await flushTimers(20) // the SIGNED_IN event must not create a second organization
    expect(fake.rows('organizations')).toHaveLength(1)
  })

  it('maps auth errors to Spanish messages', async () => {
    await boot()
    fake.auth.addUser('ana@correo.es', 'bien12345')
    await expect(signInWithPassword('ana@correo.es', 'mal')).rejects.toMatchObject({ code: 'invalid-credentials', message: 'El correo o la contraseña no son correctos.' })
    await expect(signInWithPassword('no-es-un-correo', 'x')).rejects.toBeInstanceOf(DataError)
    await expect(signUp({ email: 'ana@correo.es', password: 'otra12345', displayName: 'Ana', orgKind: 'family', orgName: 'F' })).rejects.toMatchObject({ code: 'email-taken' })
    await expect(signUp({ email: 'x@y.es', password: 'corta', displayName: 'X', orgKind: 'family', orgName: 'F' })).rejects.toMatchObject({ code: 'weak-password' })
  })

  it('offline start with a stored session uses the cached account (kids keep playing)', async () => {
    const userId = 'u-offline'
    await setMeta(META.lastUserId, userId)
    await setMeta(META.authCache(userId), {
      profile: { id: userId, email: 'ana@correo.es', displayName: 'Ana', locale: 'es-ES', createdAt: '2026-01-01T00:00:00.000Z' },
      memberships: [{ orgId: 'fam', userId, role: 'owner', createdAt: '2026-01-01T00:00:00.000Z' }],
      organizations: [{ id: 'fam', kind: 'family', name: 'Familia', createdBy: userId, createdAt: '2026-01-01T00:00:00.000Z', settings: {} }],
      activeOrgId: 'fam',
    })
    localStorage.setItem(AUTH_STORAGE_KEY, '{"expired":true}')
    await boot() // INITIAL_SESSION arrives with null (token could not be refreshed)
    const a = getAuth()
    expect(a.status).toBe('signed-in')
    expect(a.activeOrg?.id).toBe('fam')
    expect(a.offline).toBe(true)
  })

  it('signOut hides the organization children and returns to anonymous', async () => {
    await boot()
    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    expect(await listChildren()).toHaveLength(1)
    await signOut()
    expect(getAuth().status).toBe('anonymous')
    expect(await listChildren()).toHaveLength(0)
  })

  it('remembers the active organization per user', async () => {
    await boot()
    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    const school = await createOrganization('school', 'Cole')
    expect(getAuth().organizations).toHaveLength(2)
    expect(getAuth().activeOrg?.kind).toBe('family') // creating a second org does not switch
    setActiveOrg(school.id)
    expect(getAuth().activeOrg?.id).toBe(school.id)
    await flushTimers(20) // the choice is persisted fire-and-forget; let the IndexedDB write land before signing out
    await signOut()
    await signInWithPassword('ana@correo.es', 'secreto123')
    expect(getAuth().activeOrg?.id).toBe(school.id)
  })

  it('invites return a shareable link', async () => {
    await boot()
    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    const orgId = getAuth().activeOrg!.id
    await inviteMember(orgId, 'Abuela@Correo.es', 'guardian')
    const link = await createInviteLink(orgId, 'tio@correo.es', 'guardian')
    expect(link).toMatch(/\/login\?invite=tok-tio%40correo\.es$/)
    const call = fake.calls.find((c) => c.op === 'rpc' && c.table === 'create_invite')
    expect((call?.payload as Row).p_email).toBe('abuela@correo.es')
    await expect(inviteMember(orgId, 'x@y.es', 'owner')).rejects.toBeInstanceOf(DataError)
  })
})

describe('local-only → account (claimLocalData)', () => {
  const attempt = (childId: string, i: number): AttemptRecord => ({
    id: crypto.randomUUID(), childId, sessionId: null, skill: 'mul:6x8', kind: 'fact-mul', correct: i % 2 === 0, given: '48',
    expected: '48', ms: 3000, inputMode: 'pen', hintsUsed: 0, errorType: i % 2 ? 'fact' : null, context: {},
    createdAt: new Date(Date.now() - i * 60_000).toISOString(),
  })

  it('uploads every local child with its progress, attempts, sessions and rewards', async () => {
    await boot()
    continueLocalOnly()
    const c = await createChild({ nickname: 'Inessa', gender: 'f', grade: 2, companion: LUNA })
    await startSession(c.id)
    for (let i = 0; i < 25; i++) await recordAttempt(attempt(c.id, i))
    await updateProgress(c.id, (p: ProgressState) => ({ ...p, stars: 17, stickers: ['s-owl'] }))
    await setChestReward(c.id, 'Ir al zoo')
    expect(await db.outbox.count()).toBe(0) // nothing queued while local-only

    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    expect(await listChildren()).toHaveLength(1) // local child still visible after sign-in
    const res = await claimLocalData()
    expect(res).toEqual({ children: 1 })
    await runSync({ pull: true })

    const orgId = getAuth().activeOrg!.id
    expect(fake.rows('children')).toHaveLength(1)
    expect(fake.rows('children')[0]).toMatchObject({ id: c.id, org_id: orgId, nickname: 'Inessa' })
    expect(fake.rows('attempts')).toHaveLength(25)
    expect(fake.rows('sessions')).toHaveLength(1)
    expect((fake.rows('progress')[0].state as ProgressState).stars).toBe(17)
    expect(fake.rows('rewards')[0]).toMatchObject({ title: 'Ir al zoo', created_by: getAuth().user!.id })
    expect(await db.outbox.count()).toBe(0)
    expect((await db.children.get(c.id))?.orgId).toBe(orgId)
    expect((await getProgress(c.id)).stars).toBe(17)
    // Claiming twice is harmless.
    expect(await claimLocalData()).toEqual({ children: 0 })
  })

  it('requires an account with an organization', async () => {
    await boot()
    await expect(claimLocalData()).rejects.toMatchObject({ code: 'not-signed-in' })
  })
})

describe('schools (online)', () => {
  it('joinClassWithCode pushes the child first, then links it; unknown codes get a friendly error', async () => {
    fake.rpcs.join_class = (args) => {
      if (args.p_code !== 'K7M2QP') return { data: null, error: null }
      const childExists = fake.rows('children').some((r) => r.id === args.p_child_id)
      if (!childExists) return { data: null, error: { message: 'violates foreign key', code: '23503' } }
      return { data: { id: 'class-1', org_id: 'school', name: '3ºB', grade: 3, join_code: 'K7M2QP', teacher_id: 't1', created_at: new Date().toISOString(), archived_at: null }, error: null }
    }
    await boot()
    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    const cls = await joinClassWithCode(' k7m-2qp ', c.id)
    expect(cls).toMatchObject({ id: 'class-1', name: '3ºB', joinCode: 'K7M2QP' })
    await expect(joinClassWithCode('AAAAAA', c.id)).rejects.toMatchObject({ code: 'invalid-code' })
    await expect(joinClassWithCode('ABC', c.id)).rejects.toMatchObject({ code: 'invalid-code' })
  })

  it('assignments for a child are cached for offline play', async () => {
    await boot()
    await signUp({ email: 'ana@correo.es', password: 'secreto123', displayName: 'Ana', orgKind: 'family', orgName: 'Familia' })
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    fake.rows('class_enrollments').push({ class_id: 'class-1', child_id: c.id, added_by: 'u', created_at: new Date().toISOString() })
    fake.rows('assignments').push(
      { id: 'a1', class_id: 'class-1', title: 'Tabla del 7', selector: { tables: [7] }, starts_at: new Date(Date.now() - 86_400_000).toISOString(), due_at: null, created_by: 't1' },
      { id: 'a2', class_id: 'class-1', title: 'Futura', selector: {}, starts_at: new Date(Date.now() + 86_400_000).toISOString(), due_at: null, created_by: 't1' },
    )
    const list = await listAssignmentsForChild(c.id)
    expect(list.map((a) => a.title)).toEqual(['Tabla del 7'])
    fake.fail = () => ({ message: 'TypeError: Failed to fetch', code: '' })
    expect((await listAssignmentsForChild(c.id)).map((a) => a.title)).toEqual(['Tabla del 7'])
  })

  it('without an account, school lists are empty and writes explain why', async () => {
    await boot()
    continueLocalOnly()
    const c = await createChild({ nickname: 'Inessa', gender: 'f', companion: LUNA })
    expect(await listAssignmentsForChild(c.id)).toEqual([])
    await expect(joinClassWithCode('K7M2QP', c.id)).rejects.toMatchObject({ code: 'not-signed-in' })
  })
})
