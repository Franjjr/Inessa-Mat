/* Mapping between local rows (camelCase, see @/types) and Supabase rows (snake_case, see 0001_init.sql).
   Outgoing rows are sanitised to the server CHECK constraints so one odd value cannot block the outbox forever. */
import {
  DEFAULT_CHILD_SETTINGS,
  type Assignment, type AttemptRecord, type ChildProfile, type ClassRoom, type Enrollment, type InputMode,
  type Membership, type Organization, type AdultProfile, type ProgressState, type SkillMastery, type SkillSelector,
} from '@/types'
import type { MasteryRow, RewardRow, SessionRow } from './types'
import { clamp, nowIso, toIso } from './util'

type Row = Record<string, unknown>

const INPUT_MODES: InputMode[] = ['pen', 'touch', 'keyboard', 'keypad', 'tap']

function str(v: unknown, max: number, fallback = ''): string {
  const s = typeof v === 'string' ? v : v === null || v === undefined ? fallback : String(v)
  return s.length > max ? s.slice(0, max) : s
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function int(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.round(clamp(n, min, max)) : fallback
}

function optInt(v: unknown, min: number, max: number): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null
}

function iso(v: unknown, fallback: string = nowIso()): string {
  return toIso(v) ?? fallback
}

// ------------------------------------------------------------------------------------------------ children

/** Nickname stored when a child has none (the child-facing copy uses its own fallback). */
const FALLBACK_NICKNAME = 'Amigo'

export function childToRow(c: ChildProfile): Row {
  return {
    id: c.id,
    org_id: c.orgId,
    nickname: str(c.nickname.trim() || FALLBACK_NICKNAME, 40),
    gender: c.gender === 'f' ? 'f' : 'm',
    birth_year: optInt(c.birthYear, 2005, 2035),
    grade: optInt(c.grade, 1, 6),
    companion: obj(c.companion),
    settings: obj(c.settings),
    created_at: iso(c.createdAt),
    updated_at: iso(c.updatedAt),
    deleted_at: toIso(c.deletedAt),
  }
}

export function childFromRow(r: Row): ChildProfile {
  const companion = obj(r.companion) as unknown as ChildProfile['companion']
  return {
    id: String(r.id),
    orgId: (r.org_id as string | null) ?? null,
    nickname: String(r.nickname ?? ''),
    gender: r.gender === 'f' ? 'f' : 'm', // legacy 'n' rows read as masculine
    ...(r.birth_year !== null && r.birth_year !== undefined ? { birthYear: Number(r.birth_year) } : {}),
    ...(r.grade !== null && r.grade !== undefined ? { grade: Number(r.grade) } : {}),
    companion: {
      species: companion.species ?? 'cat',
      name: companion.name ?? '',
      gender: companion.gender === 'f' ? 'f' : 'm',
      colorway: companion.colorway ?? 'default',
      equipped: Array.isArray(companion.equipped) ? companion.equipped : [],
    },
    settings: { ...DEFAULT_CHILD_SETTINGS, ...(obj(r.settings) as Partial<ChildProfile['settings']>) },
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    deletedAt: toIso(r.deleted_at),
  }
}

// ------------------------------------------------------------------------------------------------ progress

export function progressFromRow(r: Row): { state: ProgressState; version: number } {
  const state = obj(r.state) as unknown as ProgressState
  return {
    state: {
      ...state,
      childId: String(r.child_id),
      worlds: (state.worlds ?? {}) as ProgressState['worlds'],
      stickers: state.stickers ?? [],
      accessoriesOwned: state.accessoriesOwned ?? [],
      daysPlayed: state.daysPlayed ?? [],
      flags: state.flags ?? {},
      stars: state.stars ?? 0,
      starsSpent: state.starsSpent ?? 0,
      chestOpened: state.chestOpened ?? false,
      seasonId: state.seasonId ?? 's1',
      updatedAt: toIso(state.updatedAt) ?? iso(r.updated_at),
    },
    version: Number(r.version ?? 1),
  }
}

// ------------------------------------------------------------------------------------------------ mastery

export function masteryToRow(m: MasteryRow): Row {
  const { childId, ...data } = m
  return { child_id: childId, skill: str(m.skill, 64), data, updated_at: iso(m.updatedAt) }
}

export function masteryFromRow(r: Row): MasteryRow {
  const data = obj(r.data) as unknown as SkillMastery
  return { ...data, skill: String(r.skill), childId: String(r.child_id), updatedAt: toIso(data.updatedAt) ?? iso(r.updated_at) }
}

// ------------------------------------------------------------------------------------------------ attempts

export function attemptToRow(a: AttemptRecord): Row {
  return {
    id: a.id,
    child_id: a.childId,
    session_id: a.sessionId ?? null,
    skill: str(a.skill, 64, 'unknown') || 'unknown',
    kind: str(a.kind, 32, 'unknown') || 'unknown',
    correct: Boolean(a.correct),
    given: str(a.given, 200),
    expected: str(a.expected, 200),
    ms: int(a.ms, 0, 86_400_000),
    input_mode: INPUT_MODES.includes(a.inputMode) ? a.inputMode : 'tap',
    hints_used: int(a.hintsUsed, 0, 50),
    error_type: a.errorType ? str(a.errorType, 32) : null,
    recognition_fixes: int(a.recognitionFixes ?? 0, 0, 500),
    context: obj(a.context),
    created_at: iso(a.createdAt),
  }
}

export function attemptFromRow(r: Row): AttemptRecord {
  return {
    id: String(r.id),
    childId: String(r.child_id),
    sessionId: (r.session_id as string | null) ?? null,
    skill: String(r.skill),
    kind: r.kind as AttemptRecord['kind'],
    correct: Boolean(r.correct),
    given: String(r.given ?? ''),
    expected: String(r.expected ?? ''),
    ms: Number(r.ms ?? 0),
    inputMode: r.input_mode as InputMode,
    hintsUsed: Number(r.hints_used ?? 0),
    errorType: (r.error_type as AttemptRecord['errorType']) ?? null,
    recognitionFixes: Number(r.recognition_fixes ?? 0),
    context: obj(r.context) as AttemptRecord['context'],
    createdAt: iso(r.created_at),
  }
}

// ------------------------------------------------------------------------------------------------ sessions

export function sessionToRow(s: SessionRow): Row {
  return {
    id: s.id,
    child_id: s.childId,
    started_at: iso(s.startedAt),
    ended_at: toIso(s.endedAt),
    minutes: Math.round(clamp(Number(s.minutes) || 0, 0, 1440) * 100) / 100,
    summary: s.summary ? obj(s.summary) : null,
    updated_at: iso(s.updatedAt),
  }
}

export function sessionFromRow(r: Row): SessionRow {
  return {
    id: String(r.id),
    childId: String(r.child_id),
    startedAt: iso(r.started_at),
    endedAt: toIso(r.ended_at),
    minutes: Number(r.minutes ?? 0),
    summary: (r.summary as SessionRow['summary']) ?? null,
    updatedAt: iso(r.updated_at),
  }
}

// ------------------------------------------------------------------------------------------------ rewards

export function rewardToRow(w: RewardRow): Row {
  return {
    id: w.id,
    child_id: w.childId,
    kind: w.kind === 'world' ? 'world' : 'chest',
    world_id: w.worldId ? str(w.worldId, 16) : null,
    title: str(w.title.trim() || 'Sorpresa', 120),
    description: w.description ? str(w.description, 500) : null,
    created_by: w.createdBy ?? null,
    unlocked_at: toIso(w.unlockedAt),
    claimed_at: toIso(w.claimedAt),
    updated_at: iso(w.updatedAt),
  }
}

export function rewardFromRow(r: Row): RewardRow {
  return {
    id: String(r.id),
    childId: String(r.child_id),
    kind: r.kind === 'world' ? 'world' : 'chest',
    worldId: (r.world_id as string | null) ?? null,
    title: String(r.title ?? ''),
    description: (r.description as string | null) ?? null,
    createdBy: (r.created_by as string | null) ?? null,
    unlockedAt: toIso(r.unlocked_at),
    claimedAt: toIso(r.claimed_at),
    updatedAt: iso(r.updated_at),
  }
}

// ------------------------------------------------------------------------------------------------ orgs & schools

export function profileFromRow(r: Row): AdultProfile {
  return {
    id: String(r.id),
    email: (r.email as string | null) ?? null,
    displayName: String(r.display_name ?? ''),
    locale: String(r.locale ?? 'es-ES'),
    createdAt: iso(r.created_at),
  }
}

export function organizationFromRow(r: Row): Organization {
  return {
    id: String(r.id),
    kind: r.kind === 'school' ? 'school' : 'family',
    name: String(r.name ?? ''),
    createdBy: String(r.created_by ?? ''),
    createdAt: iso(r.created_at),
    settings: obj(r.settings),
  }
}

export function membershipFromRow(r: Row): Membership {
  return {
    orgId: String(r.org_id),
    userId: String(r.user_id),
    role: r.role as Membership['role'],
    createdAt: iso(r.created_at),
  }
}

export function classFromRow(r: Row): ClassRoom {
  return {
    id: String(r.id),
    orgId: String(r.org_id),
    name: String(r.name ?? ''),
    grade: r.grade === null || r.grade === undefined ? null : Number(r.grade),
    joinCode: String(r.join_code ?? ''),
    teacherId: String(r.teacher_id ?? ''),
    createdAt: iso(r.created_at),
    archivedAt: toIso(r.archived_at),
  }
}

export function enrollmentFromRow(r: Row): Enrollment {
  return {
    classId: String(r.class_id),
    childId: String(r.child_id),
    addedBy: String(r.added_by ?? ''),
    createdAt: iso(r.created_at),
  }
}

export function assignmentFromRow(r: Row): Assignment {
  return {
    id: String(r.id),
    classId: String(r.class_id),
    title: String(r.title ?? ''),
    selector: obj(r.selector) as SkillSelector,
    startsAt: iso(r.starts_at),
    dueAt: toIso(r.due_at),
    createdBy: String(r.created_by ?? ''),
  }
}

/** Strip internal fields before handing rows to consumers. */
export function publicSession(s: SessionRow): import('@/types').SessionRecord {
  const { updatedAt: _u, ...rest } = s
  return rest
}

export function publicReward(w: RewardRow): import('@/types').Reward {
  const { updatedAt: _u, ...rest } = w
  return rest
}

export function publicMastery(m: MasteryRow): SkillMastery {
  const { childId: _c, ...rest } = m
  return rest
}
