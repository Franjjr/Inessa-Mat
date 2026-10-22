import { describe, expect, it } from 'vitest'
import { MAX_RETRIES_PER_RUN, plannedCount, requeueWrong, startQueue } from './requeue'

const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ({ id }))

describe('requeueWrong', () => {
  it('brings a wrong item back 2 to 4 items later, not straight away', () => {
    const q = requeueWrong(startQueue(items), 1)!
    const at = q.slots.findIndex((s, i) => i > 1 && s.retry)
    expect(q.slots[at].item.id).toBe('b')
    expect(at - 1 - 1).toBeGreaterThanOrEqual(2) // items between the wrong one (index 1) and its re-ask
    expect(at - 1 - 1).toBeLessThanOrEqual(4)
  })

  it('keeps the planned count: re-asks are extra items only', () => {
    const q = requeueWrong(startQueue(items), 0)!
    expect(q.slots.length).toBe(items.length + 1)
    expect(plannedCount(q)).toBe(items.length)
  })

  it('never re-asks an item twice', () => {
    const once = requeueWrong(startQueue(items), 0)!
    // The re-ask is answered wrongly again: it must not come back a second time.
    const reask = once.slots.findIndex((s) => s.retry)
    expect(requeueWrong(once, reask)).toBeNull()
  })

  it('does not re-ask a re-ask', () => {
    const q = requeueWrong(startQueue(items), 0)!
    expect(requeueWrong(q, q.slots.findIndex((s) => s.retry))).toBeNull()
  })

  it('stops after MAX_RETRIES_PER_RUN re-asks so a run stays short', () => {
    let q = startQueue(items)
    for (let i = 0; i < MAX_RETRIES_PER_RUN; i++) q = requeueWrong(q, i)!
    expect(q.retried.length).toBe(MAX_RETRIES_PER_RUN)
    expect(requeueWrong(q, MAX_RETRIES_PER_RUN)).toBeNull()
  })

  it('places a re-ask at the end when the run is nearly over', () => {
    const q = requeueWrong(startQueue(items.slice(0, 2)), 1)!
    expect(q.slots.map((s) => s.item.id)).toEqual(['a', 'b', 'b'])
    expect(q.slots[2].retry).toBe(true)
  })
})
