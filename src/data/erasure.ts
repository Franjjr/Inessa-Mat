/* GDPR erasure on this device. A child erased anywhere in the family (server tombstone, pulled on sync) or on this
   device is dropped completely here, and a marker keeps any late local write or queued upload for that id from
   bringing it back. The marker holds only the child id. */
import { db } from './db'
import { META } from './meta'

/** True when this device has been told that the child was erased. */
export async function isErasedChild(childId: string): Promise<boolean> {
  return (await db.meta.get(META.erased(childId)))?.value === true
}

/** Deletes every local trace of the child (profile, learning data, handwriting, unsent changes) and sets the marker.
 *  Idempotent. The caller decides whether the server must be told (eraseChild does it through the RPC first). */
export async function eraseLocalChild(childId: string): Promise<void> {
  await db.transaction('rw', [db.children, db.progress, db.mastery, db.attempts, db.sessions, db.rewards, db.inkSamples, db.outbox, db.meta], async () => {
    await Promise.all([
      db.children.delete(childId),
      db.progress.delete(childId),
      db.mastery.where('childId').equals(childId).delete(),
      db.attempts.where('childId').equals(childId).delete(),
      db.sessions.where('childId').equals(childId).delete(),
      db.rewards.where('childId').equals(childId).delete(),
      db.inkSamples.where('childId').equals(childId).delete(),
      db.outbox.where('childId').equals(childId).delete(),
      db.meta.delete(META.progressVersion(childId)),
      db.meta.delete(META.assignmentsCache(childId)),
    ])
    const active = await db.meta.get(META.activeChildId)
    if (active?.value === childId) await db.meta.delete(META.activeChildId)
    await db.meta.put({ key: META.erased(childId), value: true })
  })
}
