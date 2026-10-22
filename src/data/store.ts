/* Module-level auth/scope state shared by repositories, the sync engine and React hooks
   (useSyncExternalStore). AuthProvider drives it; reading it never requires React. */
import { useSyncExternalStore } from 'react'
import type { AdultProfile, Membership, Organization } from '@/types'
import { isBackendAvailable } from './supabase'

export type AuthStatus = 'loading' | 'anonymous' | 'local-only' | 'signed-in'

export interface AuthSnapshot {
  status: AuthStatus
  user: { id: string; email: string | null } | null
  profile: AdultProfile | null
  memberships: Membership[]
  organizations: Organization[]
  activeOrg: Organization | null
  backendAvailable: boolean
  /** Signed in from the cached session while the network is down (tokens refresh when back online). */
  offline: boolean
  /** The user opened a password-reset link: show the "new password" form. */
  passwordRecovery: boolean
}

function initialSnapshot(): AuthSnapshot {
  const backendAvailable = isBackendAvailable()
  return {
    status: backendAvailable ? 'loading' : 'local-only',
    user: null,
    profile: null,
    memberships: [],
    organizations: [],
    activeOrg: null,
    backendAvailable,
    offline: false,
    passwordRecovery: false,
  }
}

let snapshot: AuthSnapshot = initialSnapshot()
const listeners = new Set<() => void>()

export function getAuth(): AuthSnapshot {
  return snapshot
}

export function setAuth(patch: Partial<AuthSnapshot>): void {
  const next = { ...snapshot, ...patch }
  const changed = (Object.keys(patch) as (keyof AuthSnapshot)[]).some((k) => snapshot[k] !== next[k])
  if (!changed) return
  snapshot = next
  for (const l of [...listeners]) l()
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAuthSnapshot(): AuthSnapshot {
  return useSyncExternalStore(subscribeAuth, getAuth, getAuth)
}

/** Tests / dev reset. */
export function resetAuthStore(patch: Partial<AuthSnapshot> = {}): void {
  snapshot = { ...initialSnapshot(), ...patch }
  for (const l of [...listeners]) l()
}

/** The organization whose children this device shows (null = only local-only children). */
export function scopeOrgId(s: AuthSnapshot = snapshot): string | null {
  return s.status === 'signed-in' ? (s.activeOrg?.id ?? null) : null
}

/** Ids of the organizations the signed-in adult belongs to (the sync engine only pushes their children). */
export function memberOrgIds(s: AuthSnapshot = snapshot): Set<string> {
  return new Set(s.status === 'signed-in' ? s.memberships.map((m) => m.orgId) : [])
}

export function roleIn(orgId: string | null | undefined, s: AuthSnapshot = snapshot): Membership['role'] | null {
  if (!orgId) return null
  return s.memberships.find((m) => m.orgId === orgId)?.role ?? null
}
