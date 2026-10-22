/* Internal row types of the data module (never exported through '@/data'). */
import type { ISODate, Reward, SessionRecord, SkillMastery } from '@/types'

/** Tables whose rows are pushed to Supabase. */
export type SyncTable = 'children' | 'progress' | 'mastery' | 'attempts' | 'sessions' | 'rewards'

/** One pending change. The payload is NOT stored: the current local row is read at push time, so several edits of
 *  the same row coalesce into one entry (unique [table+key]). */
export interface OutboxEntry {
  seq?: number
  table: SyncTable
  /** Row key: child id, `${childId}|${skill}`, attempt id, session id, reward id. */
  key: string
  childId: string
  /** Bumped on every re-enqueue so a push that raced with a newer edit does not delete the entry. */
  rev: number
  createdAt: ISODate
  tries: number
  /** Epoch ms before which the entry is not retried (per-entry backoff after a rejected write). */
  nextTryAt: number
  lastError?: string | null
  /** Rejected too many times: kept for diagnostics/export, no longer retried automatically. */
  dead?: boolean
}

export interface MetaRow {
  key: string
  value: unknown
}

export interface MasteryRow extends SkillMastery {
  childId: string
}

/** Sessions and rewards carry an internal edit timestamp for last-writer-wins. */
export interface SessionRow extends SessionRecord {
  updatedAt: ISODate
}

export interface RewardRow extends Reward {
  updatedAt: ISODate
}
