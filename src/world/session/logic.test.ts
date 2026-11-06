import { describe, expect, it } from 'vitest'
import { planDailySession } from '@/engine'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import type { ChildProfile } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { afterAnswer, flattenPlan, isTimeUp, postpone, sessionDoneKey, sessionRewardKey, startRun, summarizeRun, SESSION_LIMIT_SECONDS, SUBJECT_LIMIT_SECONDS } from './logic'

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

  it('«No lo sé» is a wrong answer for the run: the item comes back later, and it counts as not right', () => {
    // The screen passes the dont-know outcome (correct: false) to afterAnswer, the same as any wrong answer.
    const q = startRun(plan)
    const back = afterAnswer(q, 0, false)
    expect(back.slots.length).toBe(q.slots.length + 1)
    expect(back.slots.some((s, i) => i > 0 && s.retry && s.item.uid === q.slots[0].item.uid)).toBe(true)
    const results = [{ uid: q.slots[0].item.uid, correct: false }]
    expect(summarizeRun(back, results, true).correct).toBe(0)
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

  it('postpone moves the item to the end without counting it', () => {
    const q = startRun(plan)
    const n = q.slots.length
    const first = q.slots[0]
    const after = postpone(q, 0)
    expect(after.slots.length).toBe(n)
    expect(after.slots[0].item.uid).toBe(q.slots[1].item.uid)
    expect(after.slots[n - 1].item.uid).toBe(first.item.uid)
    expect(after.slots[n - 1].item.postponed).toBe(true)
    expect(after.slots[n - 1].retry).toBe(false)
    expect(summarizeRun(after, [], true).total).toBe(summarizeRun(q, [], true).total)
  })

  it('postponing again moves the same item to the end again, with no limit', () => {
    const q = startRun(plan)
    const n = q.slots.length
    const uid = q.slots[0].item.uid
    let run = postpone(q, 0)
    for (let round = 0; round < 3; round++) {
      expect(run.slots[n - 1].item.uid).toBe(uid)
      run = postpone(run, n - 1)
      expect(run.slots.length).toBe(n)
      expect(run.slots[n - 1].item.uid).toBe(uid)
      expect(run.slots[n - 1].item.postponed).toBe(true)
      expect(run.slots[n - 1].retry).toBe(false)
    }
    expect(summarizeRun(run, [], true).total).toBe(summarizeRun(q, [], true).total)
  })

  it('the last item left is dropped, so the run ends; with others left it just comes back later', () => {
    const q = startRun(plan)
    const n = q.slots.length
    const uid = q.slots[n - 1].item.uid
    const later = postpone(q, n - 1)
    expect(later.slots.length).toBe(n)
    expect(later.slots[n - 1].item.uid).toBe(uid)

    const alone = { ...q, slots: [q.slots[0]] }
    expect(postpone(alone, 0).slots).toEqual([])
  })

  it('time-box at fifteen minutes and a once-per-day reward key', () => {
    expect(isTimeUp(SESSION_LIMIT_SECONDS - 1)).toBe(false)
    expect(isTimeUp(SESSION_LIMIT_SECONDS)).toBe(true)
    expect(sessionRewardKey(now)).toBe('sesion:2026-10-22')
  })

  it('each subject has its own time-box: English ends at ten minutes, maths and Lengua at fifteen', () => {
    expect(SUBJECT_LIMIT_SECONDS.english).toBe(10 * 60)
    expect(SUBJECT_LIMIT_SECONDS.math).toBe(15 * 60)
    expect(isTimeUp(10 * 60 - 1, SUBJECT_LIMIT_SECONDS.english)).toBe(false)
    expect(isTimeUp(10 * 60, SUBJECT_LIMIT_SECONDS.english)).toBe(true)
    expect(isTimeUp(10 * 60, SUBJECT_LIMIT_SECONDS.language)).toBe(false)
  })
})

describe('sessionRewardKey', () => {
  it('keeps the maths key and gives Lengua its own', () => {
    expect(sessionRewardKey(now)).toBe('sesion:2026-10-22')
    expect(sessionRewardKey(now, 'math')).toBe('sesion:2026-10-22')
    expect(sessionRewardKey(now, 'language')).toBe('sesion-lengua:2026-10-22')
    expect(sessionRewardKey(now, 'english')).toBe('sesion-ingles:2026-10-22')
  })

  it('the done keys: maths and Lengua unchanged, English its own', () => {
    expect(sessionDoneKey(now)).toBe('sesion-hecha:2026-10-22')
    expect(sessionDoneKey(now, 'math')).toBe('sesion-hecha:2026-10-22')
    expect(sessionDoneKey(now, 'language')).toBe('sesion-hecha-lengua:2026-10-22')
    expect(sessionDoneKey(now, 'english')).toBe('sesion-hecha-ingles:2026-10-22')
  })
})

describe('summarizeRun: «Ahora dilo tú» is not counted', () => {
  const slot = (uid: string, kind: string) => ({
    item: { uid, item: { exercise: { id: uid, kind, skill: 'eng:voc:animales' }, block: 'new', scaffold: false, isNew: false } as never },
    retry: false,
  })

  it('the speaking item is an answer (answered) but stays out of correct and total', () => {
    const q = { slots: [slot('0:speak', 'eng-speak'), slot('1:word', 'eng-write-word')], retried: [] }
    const s = summarizeRun(q as never, [{ uid: '0:speak', correct: true }, { uid: '1:word', correct: false }], true)
    expect(s).toMatchObject({ answered: 2, correct: 0, total: 1 })
  })

  it('a run with only speaking items is answered (done), with nothing graded', () => {
    const q = { slots: [slot('0:speak', 'eng-speak')], retried: [] }
    expect(summarizeRun(q as never, [{ uid: '0:speak', correct: true }], true)).toMatchObject({ answered: 1, correct: 0, total: 0 })
  })
})
