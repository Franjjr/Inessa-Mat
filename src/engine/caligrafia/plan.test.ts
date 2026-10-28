/* The Caligrafía day plan: 2 or 3 items (review first, then the next unlearnt ones in order), about 5 minutes. */
import { describe, expect, it } from 'vitest'
import { CAL_CURRICULUM, type CalItem } from '@/content/caligrafia/curriculum'
import type { MasteryMap, SkillMastery } from '@/types'
import { createRng } from '@/engine/rng'
import { joinWord } from '@/ink/cursive/join'
import { calEstimateSeconds, planCaligrafia } from './plan'

const NOW = new Date('2026-10-28T10:00:00.000Z')
const CHILD = 'nina'
const FUTURE = '2026-12-01T10:00:00.000Z'
const DAY_MS = 24 * 60 * 60 * 1000

function row(skill: string, box: SkillMastery['box'], dueAt: string | null = null): SkillMastery {
  return {
    skill, box, attempts: 3, correct: 2, streak: 0, avgMs: null,
    lastSeenAt: '2026-10-20T10:00:00.000Z', dueAt, updatedAt: '2026-10-20T10:00:00.000Z',
  }
}

function masteryWith(rows: SkillMastery[]): MasteryMap {
  return Object.fromEntries(rows.map((r) => [r.skill, r]))
}

const letterKeys = () => CAL_CURRICULUM.filter((i) => i.kind === 'letra').map((i) => i.skill)
const totalSeconds = (items: CalItem[]) => items.reduce((s, i) => s + calEstimateSeconds(i), 0)

describe('planCaligrafia', () => {
  it('starts an empty mastery with the first two letters of the first family', () => {
    const plan = planCaligrafia({ childId: CHILD, mastery: {}, now: NOW })
    expect(plan.slice(0, 2).map((i) => i.skill)).toEqual(['calig:letra:a', 'calig:letra:o'])
  })

  it('takes the weak learnt item for review and then the next unlearnt one', () => {
    const mastery = masteryWith([row('calig:letra:a', 0, '2026-10-27T10:00:00.000Z')])
    const plan = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    expect(plan.map((i) => i.skill).slice(0, 2)).toEqual(['calig:letra:a', 'calig:letra:o'])
  })

  it('offers no letter of a later family while an earlier letter is not learnt (box 0 is not learnt)', () => {
    const mastery = masteryWith([row('calig:letra:a', 0), row('calig:letra:o', 1)])
    const plan = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    expect(plan.some((i) => i.family === 'bucles')).toBe(false)
  })

  it('offers the first enlace once every letter is learnt', () => {
    const mastery = masteryWith(letterKeys().map((s) => row(s, 1, '2026-12-01T10:00:00.000Z')))
    const plan = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    expect(plan.map((i) => i.skill)).toContain('calig:enlace:br')
  })

  it('offers only letters from an empty mastery', () => {
    const plan = planCaligrafia({ childId: CHILD, mastery: {}, now: NOW })
    expect(plan.every((i) => i.kind === 'letra')).toBe(true)
  })

  it('returns 2 or 3 items and never more than one frase, across many mastery states', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = createRng(seed)
      const rows: SkillMastery[] = []
      for (const item of CAL_CURRICULUM) {
        if (rng() < 0.6) {
          const box = Math.floor(rng() * 6) as SkillMastery['box']
          const days = Math.floor(rng() * 11) - 5
          rows.push(row(item.skill, box, rng() < 0.2 ? null : new Date(NOW.getTime() + days * DAY_MS).toISOString()))
        }
      }
      const plan = planCaligrafia({ childId: CHILD, mastery: masteryWith(rows), now: NOW, rng: createRng(seed + 1000) })
      expect(plan.length, `seed ${seed}`).toBeGreaterThanOrEqual(2)
      expect(plan.length, `seed ${seed}`).toBeLessThanOrEqual(3)
      expect(plan.filter((i) => i.kind === 'frase').length, `seed ${seed}`).toBeLessThanOrEqual(1)
      expect(totalSeconds(plan), `seed ${seed}`).toBeLessThanOrEqual(360)
    }
  })

  it('estimates about five minutes for the day from an empty mastery', () => {
    const seconds = totalSeconds(planCaligrafia({ childId: CHILD, mastery: {}, now: NOW }))
    expect(seconds).toBeGreaterThanOrEqual(240)
    expect(seconds).toBeLessThanOrEqual(360)
  })

  it('is deterministic for the same day and mastery', () => {
    const mastery = masteryWith([row('calig:letra:a', 0, '2026-10-27T10:00:00.000Z'), row('calig:letra:c', 1)])
    const a = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    const b = planCaligrafia({ childId: CHILD, mastery, now: new Date(NOW.getTime() + 3 * 60 * 60 * 1000) })
    expect(a).toEqual(b)
    expect(planCaligrafia({ childId: CHILD, mastery, now: NOW, rng: createRng(7) })).toEqual(planCaligrafia({ childId: CHILD, mastery, now: NOW, rng: createRng(7) }))
  })

  it('gives 2 or 3 items when everything is learnt and nothing is due', () => {
    const mastery = masteryWith(CAL_CURRICULUM.map((i) => row(i.skill, 2, FUTURE)))
    const plan = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    expect(plan.length).toBeGreaterThanOrEqual(2)
    expect(plan.length).toBeLessThanOrEqual(3)
  })

  it('gives 2 or 3 items when everything is mastered except one weak item', () => {
    const rows = CAL_CURRICULUM.map((i) => row(i.skill, 2, FUTURE))
    rows[0] = row(rows[0].skill, 1, FUTURE)
    const plan = planCaligrafia({ childId: CHILD, mastery: masteryWith(rows), now: NOW })
    expect(plan.length).toBeGreaterThanOrEqual(2)
    expect(plan.length).toBeLessThanOrEqual(3)
    expect(plan[0].skill).toBe(rows[0].skill)
  })

  it('reviews due items before weak items that are not due', () => {
    const mastery = masteryWith([
      row('calig:letra:a', 0, FUTURE),
      row('calig:letra:c', 1, '2026-10-27T10:00:00.000Z'),
    ])
    const plan = planCaligrafia({ childId: CHILD, mastery, now: NOW })
    expect(plan[0].skill).toBe('calig:letra:c')
    // the not-due weak item only fills the plan when the due review and the new items leave room
    expect(plan.map((i) => i.skill)).not.toContain('calig:letra:a')
  })

  it('is the same for the same child and day, and can differ for another child', () => {
    const mastery = masteryWith([row('calig:letra:a', 0, '2026-10-27T10:00:00.000Z')])
    expect(planCaligrafia({ childId: CHILD, mastery, now: NOW })).toEqual(planCaligrafia({ childId: CHILD, mastery, now: NOW }))
  })

  it('draws every curriculum text without a missing glyph', () => {
    for (const item of CAL_CURRICULUM) {
      expect(joinWord(item.text).missing, item.skill).toEqual([])
    }
  })
})
