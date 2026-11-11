import { describe, expect, it } from 'vitest'
import { planDailySession } from '@/engine'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import type { ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { blockTimeText, canPostpone, earnsStars, MAX_POSTPONES, postpone, startRun, summarizeRun } from './logic'

const now = new Date('2026-10-22T10:00:00.000Z')
const child: ChildProfile = {
  id: 'child-limits', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
}
const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now })

describe('«Ahora no» limits', () => {
  it('an item can be postponed once: a postponed item that comes back is answered', () => {
    const q = startRun(plan)
    expect(canPostpone(q, 0, 0)).toBe(true)
    const back = postpone(q, 0)
    const last = back.slots.length - 1
    expect(back.slots[last].item.postponed).toBe(true)
    expect(canPostpone(back, last, 1)).toBe(false)
  })

  it('at most MAX_POSTPONES in one run', () => {
    const q = startRun(plan)
    expect(canPostpone(q, 0, MAX_POSTPONES - 1)).toBe(true)
    expect(canPostpone(q, 0, MAX_POSTPONES)).toBe(false)
  })

  it('no slot, no postpone', () => {
    expect(canPostpone(startRun(plan), 999, 0)).toBe(false)
  })
})

describe('stars: practice, not attendance', () => {
  const total = 10
  const run = (answered: number) => ({
    answered, correct: 0, total, finished: false,
  })

  it('a session with half of its planned items answered earns the stars, finished or cut by the time', () => {
    expect(earnsStars(run(5))).toBe(true)
    expect(earnsStars(run(10))).toBe(true)
    expect(earnsStars({ ...run(5), finished: true })).toBe(true)
  })

  it('less than half earns nothing, even if the child closed it', () => {
    expect(earnsStars(run(1))).toBe(false)
    expect(earnsStars(run(4))).toBe(false)
    expect(earnsStars({ ...run(4), finished: true })).toBe(false)
  })

  it('wrong answers count as practice; nothing answered earns nothing', () => {
    expect(earnsStars({ answered: 6, correct: 0, total: 10, finished: true })).toBe(true)
    expect(earnsStars(run(0))).toBe(false)
  })

  it('a speaking-only session (no graded item) needs one answer', () => {
    expect(earnsStars({ answered: 1, correct: 0, total: 0, finished: true })).toBe(true)
    expect(earnsStars({ answered: 0, correct: 0, total: 0, finished: true })).toBe(false)
  })

  it('two answers out of a whole run are not half of it: no stars, however often the child skips', () => {
    const q = startRun(plan)
    const results = [{ uid: q.slots[0].item.uid, correct: true }, { uid: q.slots[1].item.uid, correct: true }]
    const s = summarizeRun(q, results, true)
    expect(s.answered).toBe(2)
    expect(earnsStars(s)).toBe(s.total <= 4)
  })
})

describe('the intro names the time the plan really takes', () => {
  it('replaces the minutes of a block with the planner estimate, keeping the rest of the text', () => {
    const text = blockTimeText(plan, 'Mezcla', '5 min · de todo un poco')
    expect(text).toMatch(/^\d+ min · de todo un poco$/)
    const minutes = Number(text.split(' ')[0])
    expect(minutes).toBeGreaterThanOrEqual(1)
    expect(minutes).toBeLessThanOrEqual(15)
  })

  it('keeps the text of a block the plan does not have', () => {
    const empty = { ...plan, blocks: plan.blocks.map((b) => ({ ...b, items: [] })) }
    expect(blockTimeText(empty, 'Lo nuevo', '5 min · con un ejemplo')).toBe('5 min · con un ejemplo')
    expect(blockTimeText(plan, 'Titulo desconocido', '2 min · x')).toBe('2 min · x')
  })
})
