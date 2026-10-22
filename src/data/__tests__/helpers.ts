import type { Companion, Membership, Organization } from '@/types'
import { __resetAccountForTests } from '../account'
import { wipeLocalDatabase } from '../db'
import { resetAuthStore, setAuth } from '../store'
import { __setSupabaseForTests } from '../supabase'
import { __resetSyncForTests } from '../sync'
import type { FakeSupabase } from './fakeSupabase'

export const LUNA: Companion = { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] }

export async function resetAll(fake?: FakeSupabase): Promise<void> {
  __resetAccountForTests()
  __resetSyncForTests()
  __setSupabaseForTests(fake ? fake.asClient() : undefined)
  await wipeLocalDatabase()
  resetAuthStore()
}

export function org(id: string, kind: Organization['kind'] = 'family', name = 'Familia'): Organization {
  return { id, kind, name, createdBy: 'u1', createdAt: '2026-01-01T00:00:00.000Z', settings: {} }
}

/** Puts the auth store in the signed-in state without going through Supabase Auth. */
export function signIn(userId: string, orgs: Organization[], role: Membership['role'] = 'owner'): void {
  setAuth({
    status: 'signed-in',
    user: { id: userId, email: `${userId}@test.numeria` },
    profile: { id: userId, email: `${userId}@test.numeria`, displayName: userId, locale: 'es-ES', createdAt: '2026-01-01T00:00:00.000Z' },
    memberships: orgs.map((o) => ({ orgId: o.id, userId, role, createdAt: '2026-01-01T00:00:00.000Z' })),
    organizations: orgs,
    activeOrg: orgs[0] ?? null,
    backendAvailable: true,
    offline: false,
  })
}

/** Deterministic PRNG for property tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export async function flushTimers(ms = 10): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}
