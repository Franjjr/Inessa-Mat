/* PUBLIC API of the data module (agent: data). Offline-first: Dexie (IndexedDB) is the source of truth on the device;
   a sync engine pushes an outbox to Supabase and pulls on login. Local-only mode works with no account at all.
   Consumers (world, adult, ink) import ONLY from '@/data'. Stub bodies exist only so the app compiles. */
import type { ReactNode } from 'react'
import type {
  AdultProfile, AttemptRecord, ChildProfile, ClassOverview, ClassRoom, ChildSummary, Enrollment, InkSample, MasteryMap,
  Membership, NewChildInput, Organization, OrgKind, ProgressState, Reward, SessionRecord, SkillMastery, Assignment,
} from '@/types'

// ---------------------------------------------------------------- auth & organizations
export type AuthStatus = 'loading' | 'anonymous' | 'local-only' | 'signed-in'

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

export function AuthProvider({ children }: { children: ReactNode }) { return children }
export function useAuth(): AuthState {
  const noop = async () => {}
  return {
    status: 'local-only', user: null, profile: null, memberships: [], organizations: [], activeOrg: null, backendAvailable: false,
    setActiveOrg() {}, signInWithPassword: noop, signUp: noop, sendMagicLink: noop, resetPassword: noop, signOut: noop,
    continueLocalOnly() {}, claimLocalData: async () => ({ children: 0 }),
  }
}

export async function createOrganization(_kind: OrgKind, _name: string): Promise<Organization> { throw new Error('not implemented') }
export async function inviteMember(_orgId: string, _email: string, _role: Membership['role']): Promise<void> { throw new Error('not implemented') }

// ---------------------------------------------------------------- children (device + account)
export function useChildren(): ChildProfile[] | undefined { return [] }
export async function listChildren(): Promise<ChildProfile[]> { return [] }
export async function getChild(_id: string): Promise<ChildProfile | undefined> { return undefined }
export async function createChild(_input: NewChildInput): Promise<ChildProfile> { throw new Error('not implemented') }
export async function updateChild(_id: string, _patch: Partial<Omit<ChildProfile, 'id'>>): Promise<ChildProfile> { throw new Error('not implemented') }
export async function deleteChild(_id: string): Promise<void> {}

/** The child currently playing on this device (persisted locally). */
export function useActiveChild(): { child: ChildProfile | null; loading: boolean; setActiveChild(id: string | null): void } {
  return { child: null, loading: false, setActiveChild() {} }
}

// ---------------------------------------------------------------- progress & mastery
export function useProgress(_childId: string | null | undefined): ProgressState | undefined { return undefined }
export async function getProgress(_childId: string): Promise<ProgressState> { throw new Error('not implemented') }
/** Atomic read-modify-write; the updater must be pure. */
export async function updateProgress(_childId: string, _updater: (s: ProgressState) => ProgressState): Promise<ProgressState> { throw new Error('not implemented') }

export function useMastery(_childId: string | null | undefined): MasteryMap | undefined { return undefined }
export async function getMastery(_childId: string): Promise<MasteryMap> { return {} }
export async function saveMastery(_childId: string, _items: SkillMastery[]): Promise<void> {}

// ---------------------------------------------------------------- attempts & sessions
export async function recordAttempt(_attempt: AttemptRecord): Promise<void> {}
export async function listAttempts(_childId: string, _opts?: { since?: string; limit?: number }): Promise<AttemptRecord[]> { return [] }
export async function startSession(_childId: string): Promise<SessionRecord> { throw new Error('not implemented') }
/** Call on activity end / visibility hidden; idempotent. */
export async function touchSession(_sessionId: string, _patch: Partial<SessionRecord>): Promise<void> {}
export async function endSession(_sessionId: string, _summary: SessionRecord['summary']): Promise<void> {}
export async function listSessions(_childId: string, _opts?: { since?: string }): Promise<SessionRecord[]> { return [] }

// ---------------------------------------------------------------- rewards (parent-defined real-world prize)
export async function getRewards(_childId: string): Promise<Reward[]> { return [] }
export async function setChestReward(_childId: string, _title: string, _description?: string): Promise<Reward> { throw new Error('not implemented') }
export async function markRewardUnlocked(_rewardId: string): Promise<void> {}
export async function markRewardClaimed(_rewardId: string): Promise<void> {}

// ---------------------------------------------------------------- handwriting samples (local only by default)
export async function addInkSample(_sample: InkSample): Promise<void> {}
export async function listInkSamples(_childId: string): Promise<InkSample[]> { return [] }
export async function clearInkSamples(_childId: string): Promise<void> {}

// ---------------------------------------------------------------- schools
export async function listClasses(_orgId: string): Promise<ClassRoom[]> { return [] }
export async function createClass(_orgId: string, _name: string, _grade: number | null): Promise<ClassRoom> { throw new Error('not implemented') }
export async function archiveClass(_classId: string): Promise<void> {}
/** Parent links their child to a teacher's class with the class code (consent). */
export async function joinClassWithCode(_code: string, _childId: string): Promise<ClassRoom> { throw new Error('not implemented') }
export async function listEnrollments(_classId: string): Promise<Enrollment[]> { return [] }
export async function removeEnrollment(_classId: string, _childId: string): Promise<void> {}
export async function getClassOverview(_classId: string): Promise<ClassOverview> { throw new Error('not implemented') }
export async function listAssignments(_classId: string): Promise<Assignment[]> { return [] }
export async function createAssignment(_a: Omit<Assignment, 'id' | 'createdBy'>): Promise<Assignment> { throw new Error('not implemented') }
/** Assignments that apply to a child (via enrollments) — the game shows them as "misión de tu profe". */
export async function listAssignmentsForChild(_childId: string): Promise<Assignment[]> { return [] }

// ---------------------------------------------------------------- dashboards
export async function getChildSummary(_childId: string): Promise<ChildSummary> { throw new Error('not implemented') }

// ---------------------------------------------------------------- adult gate (PIN, stored hashed locally)
export async function hasAdultPin(): Promise<boolean> { return false }
export async function setAdultPin(_pin: string): Promise<void> {}
export async function verifyAdultPin(_pin: string): Promise<boolean> { return true }

// ---------------------------------------------------------------- sync
export interface SyncStatus { state: 'local-only' | 'offline' | 'idle' | 'syncing' | 'error'; pending: number; lastSyncedAt: string | null; error?: string }
export function useSyncStatus(): SyncStatus { return { state: 'local-only', pending: 0, lastSyncedAt: null } }
export async function syncNow(): Promise<void> {}

// ---------------------------------------------------------------- privacy
/** GDPR: export everything stored for a child as JSON (download). */
export async function exportChildData(_childId: string): Promise<Blob> { return new Blob(['{}'], { type: 'application/json' }) }
