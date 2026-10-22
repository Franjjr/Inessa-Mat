import type { ID, ISODate } from './common'
import type { SkillSelector } from './exercise'

export type OrgKind = 'family' | 'school'

/** Roles of ADULT users inside an organization. Children never have accounts. */
export type OrgRole = 'owner' | 'admin' | 'teacher' | 'guardian'

export interface AdultProfile {
  id: ID              // = auth.users.id
  email: string | null
  displayName: string
  locale: string      // 'es-ES'
  createdAt: ISODate
}

export interface Organization {
  id: ID
  kind: OrgKind
  name: string
  createdBy: ID
  createdAt: ISODate
  settings: Record<string, unknown>
}

export interface Membership {
  orgId: ID
  userId: ID
  role: OrgRole
  createdAt: ISODate
}

export interface ClassRoom {
  id: ID
  orgId: ID           // school org
  name: string        // "3ºB"
  grade: number | null
  /** 6-character code parents type to link their child to this class (consent). */
  joinCode: string
  teacherId: ID
  createdAt: ISODate
  archivedAt?: ISODate | null
}

export interface Enrollment {
  classId: ID
  childId: ID
  addedBy: ID
  createdAt: ISODate
}

/** Real-world reward the adult promises inside the chest (Gran Cofre). */
export interface Reward {
  id: ID
  childId: ID
  kind: 'chest' | 'world'
  worldId?: string | null
  title: string        // "Una tarde de cine contigo"
  description?: string | null
  createdBy: ID | null
  unlockedAt?: ISODate | null
  claimedAt?: ISODate | null
}

/** Teacher assignment: focus practice for a class (e.g. "tabla del 7 esta semana"). */
export interface Assignment {
  id: ID
  classId: ID
  title: string
  selector: SkillSelector
  startsAt: ISODate
  dueAt: ISODate | null
  createdBy: ID
}

/** Aggregated view for dashboards. */
export interface ChildSummary {
  childId: ID
  nickname: string
  companionSpecies: string
  worldsCompleted: number
  currentWorld: string | null
  minutesLast7Days: number
  accuracyLast7Days: number | null
  /** 10×10 matrix: mastery box 0..5 per multiplication fact (index [a-1][b-1]), -1 = never seen. */
  factGrid: number[][]
  topErrors: { errorType: string; count: number }[]
  lastPlayedAt: ISODate | null
  /** Subtraction methods over the last 30 days: the child's favourite and the results per method (undefined = no data). */
  subtractionMethods?: {
    preferred: import('./exercise').SubMethod
    byMethod: { method: import('./exercise').SubMethod; attempts: number; correct: number }[]
  }
}

export interface ClassOverview {
  classRoom: ClassRoom
  children: ChildSummary[]
}
