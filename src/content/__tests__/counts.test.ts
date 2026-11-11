/* What an activity promises (its count) is what it can deliver: a session never gives more than MAX_ITEMS rounds,
   so a larger count would show «de 20» and then stop at 12. */
import { describe, expect, it } from 'vitest'
import { MAX_ITEMS } from '@/activities/facts/shared/items'
import { allActivities } from './helpers'

describe('activity counts', () => {
  it('no race promises more rounds than a session gives', () => {
    const races = allActivities().filter((a) => a.config.kind === 'race')
    expect(races.length).toBeGreaterThan(0)
    for (const a of races) expect(a.config.count ?? 0, a.where).toBeLessThanOrEqual(MAX_ITEMS)
  })
})
