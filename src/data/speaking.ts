/* «Ahora dilo tú» results, kept on this device only (the Dexie meta table, which never syncs). One record per result:
   the word, its stars (1–3) and the time. No audio, no score, no mastery: the report reads the words that were hard to say.
   Erasing the child removes them (eraseLocalChild). */
import type { SpeakingRecord } from '@/engine'
import { db } from './db'
import { isErasedChild } from './erasure'
import { getMeta, META } from './meta'
import { nowIso } from './util'

/** The most recent results kept per child: the report only needs the latest result of each word. */
export const SPEAKING_KEEP = 200

export async function listSpeaking(childId: string): Promise<SpeakingRecord[]> {
  return (await getMeta<SpeakingRecord[]>(META.speaking(childId))) ?? []
}

/** Appends one result (word, stars, time). Erased children store nothing. */
export async function recordSpeaking(childId: string, word: string, stars: 1 | 2 | 3): Promise<void> {
  await db.transaction('rw', [db.meta], async () => {
    if (await isErasedChild(childId)) return
    const key = META.speaking(childId)
    const list = (await getMeta<SpeakingRecord[]>(key)) ?? []
    const next = [...list, { word, stars, at: nowIso() }].slice(-SPEAKING_KEEP)
    await db.meta.put({ key, value: next })
  })
}
