import { describe, expect, it } from 'vitest'
import { planDailySession } from '@/engine'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import type { ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { afterAnswer, flattenPlan, isTimeUp, sessionRewardKey, startRun, summarizeRun, SESSION_LIMIT_SECONDS } from './logic'

const now = new Date('2026-10-22T10:00:00.000Z')
const child: ChildProfile = {
  id: 'child-run', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: now.toISOString(), updatedAt: now.toISOString(),
}
const plan = planDailySession({ child, mastery: {}, attempts: [], syllabus: GRADE3_SYLLABUS, now })

describe('session run', () => {
  it('runs the plan in block order, with unique ids', () => {
    const run = flattenPlan(plan)
    expect(run.length).toBe(plan.blocks.flatMap((b) => b.items).length)
    expect(new Set(run.map((r) => r.uid)).size).toBe(run.length)
    expect(run[0].item.block).toBe(plan.blocks.find((b) => b.items.length)!.id)
  })

  it('a wrong first answer comes back later; a right one does not; a re-ask is not requeued again', () => {
    const q = startRun(plan)
    const n = q.slots.length
    const once = afterAnswer(q, 0, false)
    expect(once.slots.length).toBe(n + 1)
    expect(once.slots[0].retry).toBe(false)
    const back = once.slots.findIndex((s, i) => i > 0 && s.retry)
    expect(back).toBeGreaterThanOrEqual(3) // 2–4 items later
    expect(back).toBeLessThanOrEqual(5)
    expect(afterAnswer(q, 0, true)).toBe(q)
    expect(afterAnswer(once, back, false)).toBe(once) // re-asks never come back again
  })

  it('the summary counts planned items only', () => {
    let q = startRun(plan)
    q = afterAnswer(q, 0, false)
    const results = [{ uid: q.slots[0].item.uid, correct: false }, { uid: q.slots[1].item.uid, correct: true }]
    const s = summarizeRun(q, results, true)
    expect(s.total).toBe(plan.blocks.flatMap((b) => b.items).length)
    expect(s.correct).toBe(1)
    expect(s.answered).toBe(2)
  })

  it('time-box at fifteen minutes and a once-per-day reward key', () => {
    expect(isTimeUp(SESSION_LIMIT_SECONDS - 1)).toBe(false)
    expect(isTimeUp(SESSION_LIMIT_SECONDS)).toBe(true)
    expect(sessionRewardKey(now)).toBe('sesion:2026-10-22')
  })
})
