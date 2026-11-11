/* Persistent storage. A child without an account exists only in this device's IndexedDB, and the browser may evict
   that data under pressure unless the origin asks to keep it (navigator.storage.persist). The request is best effort:
   browsers may refuse it, and the answer is remembered in the meta table so the adult area can explain it later. */
import { META, getMeta, setMeta } from './meta'

export type PersistenceState = 'granted' | 'denied' | 'unsupported' | 'unknown'

async function remember(state: PersistenceState): Promise<PersistenceState> {
  try {
    await setMeta(META.persistence, state)
  } catch {
    // Storage itself is failing (private window, blocked site data): the answer is still returned to the caller.
  }
  return state
}

/** Asks the browser to keep this origin's data. Never throws; resolves with what the browser answered. */
export async function requestPersistentStorage(): Promise<PersistenceState> {
  try {
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (!storage || typeof storage.persist !== 'function') return remember('unsupported')
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return remember('granted')
    return remember((await storage.persist()) ? 'granted' : 'denied')
  } catch {
    return 'unknown'
  }
}

/** The last answer of requestPersistentStorage on this device ('unknown' when never asked or unreadable). */
export async function getPersistenceState(): Promise<PersistenceState> {
  try {
    return (await getMeta<PersistenceState>(META.persistence)) ?? 'unknown'
  } catch {
    return 'unknown'
  }
}
