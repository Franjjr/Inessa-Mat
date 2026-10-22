/* Re-asks a wrong item later in the same run (PEDAGOGY 4: "a failed item comes back 2–4 items later in the same
   session, then again in later sessions"). Pure: the runner keeps the queue and asks requeueWrong() after each
   wrong first answer. Limits keep a run short: an item comes back at most once, and a run re-asks at most
   MAX_RETRIES_PER_RUN items. A re-ask is practice: the runner does not report it to mastery and does not count
   it in the stars (the first answer of each planned item is the graded one). */
import type { ID } from '@/types'

export const RETRY_GAPS = [2, 3, 4] as const
export const MAX_RETRIES_PER_RUN = 3

export interface RunSlot<T> {
  item: T
  /** True for a re-ask scheduled after a wrong first answer. */
  retry: boolean
}

export interface RunQueue<T> {
  /** Items in the order they will be asked (planned items plus scheduled re-asks). */
  slots: RunSlot<T>[]
  /** Ids of the items already scheduled for a re-ask in this run. */
  retried: ID[]
}

export function startQueue<T>(items: readonly T[]): RunQueue<T> {
  return { slots: items.map((item) => ({ item, retry: false })), retried: [] }
}

/** Number of planned (non re-ask) items: the count the child is told about and the stars are computed from. */
export function plannedCount<T>(q: RunQueue<T>): number {
  return q.slots.reduce((n, s) => n + (s.retry ? 0 : 1), 0)
}

/**
 * Schedules the item at `pos` (just answered wrongly) to come back 2–4 items later. Returns the new queue, or null
 * when this item must not come back (already a re-ask, already re-asked, or the run has used its re-asks).
 */
export function requeueWrong<T>(
  q: RunQueue<T>,
  pos: number,
  keyOf: (item: T) => ID = (item) => (item as unknown as { id: ID }).id,
): RunQueue<T> | null {
  const slot = q.slots[pos]
  if (!slot || slot.retry) return null
  const id = keyOf(slot.item)
  if (q.retried.includes(id) || q.retried.length >= MAX_RETRIES_PER_RUN) return null
  const gap = RETRY_GAPS[q.retried.length % RETRY_GAPS.length]
  // `gap` items sit between the current one and its re-ask.
  const at = Math.min(pos + gap + 1, q.slots.length)
  const slots = [...q.slots.slice(0, at), { item: slot.item, retry: true }, ...q.slots.slice(at)]
  return { slots, retried: [...q.retried, id] }
}

/** Whether a wrong item may come back in this run (at most once per item, MAX_RETRIES_PER_RUN per run). */
export function mayRequeue(retried: readonly ID[], id: ID): boolean {
  return !retried.includes(id) && retried.length < MAX_RETRIES_PER_RUN
}
