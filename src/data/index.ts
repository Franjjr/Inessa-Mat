/* PUBLIC API of the data module (agent: data). Offline-first: Dexie (IndexedDB) is the source of truth on the device;
   a sync engine pushes an outbox to Supabase and pulls on login. Local-only mode works with no account at all.
   Consumers (world, adult, ink) import ONLY from '@/data'. Contract signatures are unchanged; implementations live
   in the sibling files. Extras (beyond the original contract) are listed at the end.

   Errors: functions reject with DataError (`code` for logic, Spanish `message` ready to show to adults). */

// ---------------------------------------------------------------- auth & organizations
export type { AuthStatus } from './store'
export type { AuthState } from './auth'
export { AuthProvider, useAuth } from './auth'
export { createOrganization, inviteMember } from './account'

// ---------------------------------------------------------------- children (device + account)
/** useChildren/listChildren: children of the active organization + local-only ones, oldest first. */
export { useChildren, listChildren, getChild, createChild, updateChild, deleteChild } from './children'
/** The child currently playing on this device (persisted locally). */
export { useActiveChild } from './children'

// ---------------------------------------------------------------- progress & mastery
/** getProgress creates the initial progress on first read; updateProgress is an atomic read-modify-write (the
 *  updater must be pure; never decrease `stars`, record spending in `starsSpent`). */
export { useProgress, getProgress, updateProgress, useMastery, getMastery, saveMastery } from './progress'

// ---------------------------------------------------------------- attempts & sessions
/** listAttempts / listSessions return newest first. touchSession is idempotent; minutes only grow. */
export { recordAttempt, listAttempts, startSession, touchSession, endSession, listSessions } from './activity'

// ---------------------------------------------------------------- rewards (parent-defined real-world prize)
export { getRewards, setChestReward, markRewardUnlocked, markRewardClaimed } from './rewards'

// ---------------------------------------------------------------- handwriting samples (local only by default)
export { addInkSample, listInkSamples, clearInkSamples } from './rewards'

// ---------------------------------------------------------------- schools
/** Parent links their child to a teacher's class with the class code (consent): joinClassWithCode.
 *  listAssignmentsForChild: assignments that apply to a child (via enrollments) — "misión de tu profe". */
export {
  listClasses, createClass, archiveClass, joinClassWithCode, listEnrollments, removeEnrollment, getClassOverview,
  listAssignments, createAssignment, listAssignmentsForChild,
} from './schools'

// ---------------------------------------------------------------- dashboards
export { getChildSummary } from './dashboards'

// ---------------------------------------------------------------- adult gate (PIN, stored hashed locally)
/** verifyAdultPin resolves false when no PIN is set (check hasAdultPin first). */
export { hasAdultPin, setAdultPin, verifyAdultPin, readAdultGateLock, writeAdultGateLock } from './pin'

// ---------------------------------------------------------------- sync
export type { SyncStatus } from './sync'
export { useSyncStatus, syncNow } from './sync'

// ---------------------------------------------------------------- privacy
/** GDPR: export everything stored for a child as JSON (download). */
export { exportChildData } from './dashboards'

// ---------------------------------------------------------------- extras (data extensions)
export { DataError } from './errors'
export type { DataErrorCode } from './errors'
/** Auth extras: offline sign-in flag, password-recovery mode, set a new password, invite links, members. */
export { useAuthExtras } from './auth'
export { acceptInvite, createInviteLink, listOrgMembers, updatePassword } from './account'
/** School extras: classes of a child (family view), new join code. */
export { listClassesForChild, regenerateJoinCode } from './schools'
/** GDPR erasure (server + device) and removing the adult PIN. */
export { eraseChild } from './dashboards'
export { clearAdultPin } from './pin'
/** Sync state outside React. */
export { getSyncStatus, subscribeSyncStatus } from './sync'
/** Monotonic progress merge (exposed for tests/tools). */
export { mergeProgress } from './merge'

// ---------------------------------------------------------------- dev helpers (window.__numeriaDev)
import { installDevHelpers } from './dev'
if (import.meta.env.DEV) installDevHelpers()
