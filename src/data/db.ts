/* Dexie (IndexedDB) schema. The device database is the source of truth; Supabase is a replica for signed-in adults.
   Versions are append-only: never edit a published version, add a new one with an upgrade function. */
import Dexie, { type EntityTable, type Table, type Transaction } from 'dexie'
import { DEFAULT_CHILD_SETTINGS, type AttemptRecord, type ChildProfile, type InkSample, type ProgressState } from '@/types'
import type { MasteryRow, MetaRow, OutboxEntry, RewardRow, SessionRow } from './types'

export const DB_NAME = 'numeria'

export interface SchemaVersion {
  version: number
  stores: Record<string, string | null>
  upgrade?: (tx: Transaction) => Promise<void> | void
}

/** Ordered schema history. */
export const SCHEMA_VERSIONS: SchemaVersion[] = [
  {
    version: 1,
    stores: {
      children: 'id, orgId, updatedAt',
      progress: 'childId',
      mastery: '[childId+skill], childId',
      attempts: 'id, childId, [childId+createdAt], sessionId',
      sessions: 'id, childId, [childId+startedAt]',
      rewards: 'id, childId',
      inkSamples: 'id, childId, [childId+digit]',
      outbox: '++seq, &[table+key], childId',
      meta: 'key',
    },
  },
  {
    // v2: children settings are normalised against DEFAULT_CHILD_SETTINGS (new settings keys get their default);
    // per-digit ink sample pruning needs createdAt in the compound index.
    version: 2,
    stores: {
      inkSamples: 'id, childId, [childId+digit], [childId+digit+createdAt]',
    },
    upgrade: async (tx) => {
      await tx.table('children').toCollection().modify((c: ChildProfile) => {
        c.settings = { ...DEFAULT_CHILD_SETTINGS, ...(c.settings ?? {}) }
        if (c.deletedAt === undefined) c.deletedAt = null
      })
    },
  },
]

export class NumeriaDB extends Dexie {
  declare children: EntityTable<ChildProfile, 'id'>
  declare progress: EntityTable<ProgressState, 'childId'>
  declare mastery: Table<MasteryRow, [string, string]>
  declare attempts: EntityTable<AttemptRecord, 'id'>
  declare sessions: EntityTable<SessionRow, 'id'>
  declare rewards: EntityTable<RewardRow, 'id'>
  declare inkSamples: EntityTable<InkSample, 'id'>
  declare outbox: EntityTable<OutboxEntry, 'seq'>
  declare meta: EntityTable<MetaRow, 'key'>

  constructor(name = DB_NAME, versions: SchemaVersion[] = SCHEMA_VERSIONS) {
    super(name)
    for (const v of versions) {
      const version = this.version(v.version).stores(v.stores)
      if (v.upgrade) version.upgrade(v.upgrade)
    }
  }
}

export const db = new NumeriaDB()

/** Every table that holds data of a child (for export / wipe). */
export const CHILD_TABLES = ['progress', 'mastery', 'attempts', 'sessions', 'rewards', 'inkSamples', 'outbox'] as const

/** Clears every local table (dev reset, "borrar datos de este dispositivo", tests). */
export async function wipeLocalDatabase(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
}
