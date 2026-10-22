/* React side of auth: <AuthProvider> starts auth + sync once for the app; useAuth() reads the shared store. */
import { useEffect, useMemo, type ReactNode } from 'react'
import type { Membership, Organization, OrgKind, AdultProfile } from '@/types'
import {
  claimLocalData, continueLocalOnly, resetPassword, sendMagicLink, setActiveOrg, signInWithPassword, signOut, signUp,
  startAuth,
} from './account'
import { useAuthSnapshot, type AuthStatus } from './store'

export interface AuthState {
  status: AuthStatus
  user: { id: string; email: string | null } | null
  profile: AdultProfile | null
  memberships: Membership[]
  organizations: Organization[]
  activeOrg: Organization | null
  /** true when Supabase env vars are missing → app runs local-only. */
  backendAvailable: boolean
  setActiveOrg(orgId: string): void
  signInWithPassword(email: string, password: string): Promise<void>
  signUp(input: { email: string; password: string; displayName: string; orgKind: OrgKind; orgName: string }): Promise<void>
  sendMagicLink(email: string): Promise<void>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
  /** Use the app without an account (data stays on this device; can be upgraded later). */
  continueLocalOnly(): void
  /** Upload local-only children/progress to the signed-in account's active org. */
  claimLocalData(): Promise<{ children: number }>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => startAuth(), [])
  return children
}

export function useAuth(): AuthState {
  const s = useAuthSnapshot()
  return useMemo<AuthState>(
    () => ({
      status: s.status,
      user: s.user,
      profile: s.profile,
      memberships: s.memberships,
      organizations: s.organizations,
      activeOrg: s.activeOrg,
      backendAvailable: s.backendAvailable,
      setActiveOrg,
      signInWithPassword,
      signUp,
      sendMagicLink,
      resetPassword,
      signOut,
      continueLocalOnly,
      claimLocalData,
    }),
    [s],
  )
}

/** Extra state not in AuthState: offline sign-in and password-recovery mode. */
export function useAuthExtras(): { offline: boolean; passwordRecovery: boolean } {
  const s = useAuthSnapshot()
  return useMemo(() => ({ offline: s.offline, passwordRecovery: s.passwordRecovery }), [s.offline, s.passwordRecovery])
}
