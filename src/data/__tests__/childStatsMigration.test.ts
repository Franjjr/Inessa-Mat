/* Migration 0004: the dashboard aggregates leave calig: (handwriting) attempts out, like lng: ones. */
import { describe, expect, it } from 'vitest'
import sql from '../../../supabase/migrations/0004_caligrafia_stats.sql?raw'

describe('0004_caligrafia_stats.sql', () => {
  it('leaves the handwriting attempts out of the child_stats aggregates', () => {
    expect(sql.split("not like 'calig:%'").length - 1).toBe(2)
  })

  it('keeps the Lengua filter as well', () => {
    expect(sql.split("not like 'lng:%'").length - 1).toBe(2)
  })
})
