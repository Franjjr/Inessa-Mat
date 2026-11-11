import { describe, expect, it } from 'vitest'
import {
  CHOICE_MAX_BOX, dueSkills, factGrid, fluencyThresholdMs, intervalMs, isChoiceExercise, LEITNER_INTERVAL_DAYS, newMastery,
  starsFor, updateMastery,
} from '@/engine'
import type { AttemptForMastery } from '@/engine'
import type { Exercise, MasteryMap, SkillMastery } from '@/types'

const now = new Date('2026-10-21T10:00:00.000Z')
const DAY = 86400000
const at = (days: number) => new Date(now.getTime() + days * DAY)

const attempt = (over: Partial<AttemptForMastery> = {}): AttemptForMastery =>
  ({ skill: 'mul:6x7', correct: true, ms: 2500, inputMode: 'keyboard', hintsUsed: 0, ...over })

function withBox(box: number, skill = 'mul:6x7'): SkillMastery {
  return { ...newMastery(skill, now), box: box as SkillMastery['box'], attempts: 4, correct: 3, streak: 1 }
}

describe('Leitner transitions', () => {
  it('new skill: box 0, due now', () => {
    expect(newMastery('mul:6x7', now)).toEqual({
      skill: 'mul:6x7', box: 0, attempts: 0, correct: 0, streak: 0, avgMs: null, lastSeenAt: null,
      dueAt: now.toISOString(), updatedAt: now.toISOString(),
    })
  })

  it('correct + fluent + due → box + 1 with the documented intervals (one climb per review date)', () => {
    expect(LEITNER_INTERVAL_DAYS).toEqual([0, 1, 2, 4, 8, 16])
    let m: SkillMastery | undefined
    let when = now
    const boxes: number[] = []
    for (let i = 0; i < 7; i++) {
      m = updateMastery(m, attempt(), when)
      boxes.push(m.box)
      expect(m.dueAt).toBe(new Date(when.getTime() + LEITNER_INTERVAL_DAYS[m.box] * DAY).toISOString())
      if (i < 6) when = new Date(when.getTime() + LEITNER_INTERVAL_DAYS[m.box] * DAY)
    }
    expect(boxes).toEqual([1, 2, 3, 4, 5, 5, 5])
    expect(m).toMatchObject({ attempts: 7, correct: 7, streak: 7, lastSeenAt: when.toISOString(), updatedAt: when.toISOString() })
  })

  it('a fluent right answer before the review date does not climb (no mastery in one sitting)', () => {
    const first = updateMastery(undefined, attempt(), now)
    expect(first.box).toBe(1)
    const again = updateMastery(first, attempt(), at(0.1))
    expect(again.box).toBe(1)
    expect(again.dueAt).toBe(first.dueAt)
    expect(again.correct).toBe(2)
    // The box 2 (mastered) needs the review date to come: the next day.
    const tomorrow = updateMastery(again, attempt(), at(1))
    expect(tomorrow.box).toBe(2)
    expect(updateMastery(tomorrow, attempt(), at(1.1)).box).toBe(2)
  })

  it('a right answer after a wrong try is not fluent: the box stays', () => {
    expect(updateMastery(withBox(2), attempt({ retries: 1 }), now).box).toBe(2)
    expect(updateMastery(withBox(0), attempt({ retries: 1 }), now).box).toBe(1)
    expect(updateMastery(withBox(2), attempt({ retries: 0 }), now).box).toBe(3)
  })

  it('a right answer long after the review date drops one box before counting', () => {
    // Box 4 has an 8-day interval: answered 30 days after its date, it goes 4 → 3 and the fluent answer climbs back to 4.
    const late: SkillMastery = { ...withBox(4), dueAt: at(-30).toISOString() }
    expect(updateMastery(late, attempt(), now).box).toBe(4)
    // Only one box down, even after months away.
    const veryLate: SkillMastery = { ...withBox(5), dueAt: at(-300).toISOString() }
    expect(updateMastery(veryLate, attempt(), now).box).toBe(5)
    // A slow answer after a long gap is one box down and no climb.
    expect(updateMastery(late, attempt({ ms: 9000 }), now).box).toBe(3)
  })

  it('correct but slow, or with hints → stays (box 0 → 1)', () => {
    expect(updateMastery(withBox(3), attempt({ ms: 9000 }), now).box).toBe(3)
    expect(updateMastery(withBox(3), attempt({ hintsUsed: 1 }), now).box).toBe(3)
    expect(updateMastery(withBox(0), attempt({ ms: 9000 }), now).box).toBe(1)
    expect(updateMastery(withBox(0), attempt({ hintsUsed: 2 }), now).box).toBe(1)
    expect(updateMastery(withBox(3), attempt({ ms: 9000 }), now).dueAt).toBe(at(4).toISOString())
  })

  it('wrong → box − 2 (min 0), due now, streak reset, error remembered', () => {
    const m = updateMastery(withBox(4), attempt({ correct: false, errorType: 'fact' }), now)
    expect(m).toMatchObject({ box: 2, streak: 0, dueAt: now.toISOString(), lastError: 'fact', correct: 3, attempts: 5 })
    expect(updateMastery(withBox(1), attempt({ correct: false }), now)).toMatchObject({ box: 0, lastError: 'other' })
    expect(updateMastery(withBox(0), attempt({ correct: false }), now).box).toBe(0)
  })

  it('recognition errors never change mastery', () => {
    const prev = withBox(4)
    expect(updateMastery(prev, attempt({ correct: false, errorType: 'recognition' }), now)).toBe(prev)
    const fresh = updateMastery(undefined, attempt({ correct: false, errorType: 'recognition' }), now)
    expect(fresh.box).toBe(0)
    expect(fresh.attempts).toBe(0)
  })

  it('fluency thresholds depend on the input mode (pen 7 s, keypad 5 s, keyboard 4 s)', () => {
    expect(updateMastery(withBox(2), attempt({ inputMode: 'pen', ms: 6500 }), now).box).toBe(3)
    expect(updateMastery(withBox(2), attempt({ inputMode: 'touch', ms: 7000 }), now).box).toBe(3)
    expect(updateMastery(withBox(2), attempt({ inputMode: 'keyboard', ms: 4500 }), now).box).toBe(2)
    expect(updateMastery(withBox(2), attempt({ inputMode: 'keypad', ms: 4900 }), now).box).toBe(3)
    expect(updateMastery(withBox(2), attempt({ inputMode: 'keypad', ms: 5100 }), now).box).toBe(2)
    expect(fluencyThresholdMs('pen', 'fact-mul')).toBe(7000)
    expect(fluencyThresholdMs('touch', 'fact-div')).toBe(7000)
    expect(fluencyThresholdMs('keypad', 'missing-factor')).toBe(5000)
    expect(fluencyThresholdMs('keyboard', 'fact-mul')).toBe(4000)
    expect(fluencyThresholdMs('tap', 'fact-mul')).toBe(4000)
  })

  it('column operations and other multi-step skills are judged on accuracy only', () => {
    expect(fluencyThresholdMs('pen', 'column-add')).toBe(Infinity)
    expect(fluencyThresholdMs('keyboard', 'division')).toBe(Infinity)
    expect(updateMastery(withBox(2, 'add:3d:c2'), attempt({ skill: 'add:3d:c2', ms: 95000 }), now).box).toBe(3)
    expect(updateMastery(withBox(2, 'word:mul'), attempt({ skill: 'word:mul', ms: 60000 }), now).box).toBe(3)
    expect(updateMastery(withBox(2, 'add:3d:c2'), attempt({ skill: 'add:3d:c2', hintsUsed: 1 }), now).box).toBe(2)
    // Division facts are facts.
    expect(updateMastery(withBox(2, 'div:42/6'), attempt({ skill: 'div:42/6', ms: 9000 }), now).box).toBe(2)
  })

  it('response-time moving average uses correct answers only; invalid times never count as fluent', () => {
    let m = updateMastery(undefined, attempt({ ms: 3000 }), now)
    expect(m.avgMs).toBe(3000)
    m = updateMastery(m, attempt({ ms: 2000 }), now)
    expect(m.avgMs).toBe(2700)
    m = updateMastery(m, attempt({ ms: 50000, correct: false }), now)
    expect(m.avgMs).toBe(2700)
    const bad = updateMastery(withBox(2), attempt({ ms: Number.NaN }), now)
    expect(bad.box).toBe(2)
    expect(bad.avgMs).toBeNull()
  })

  it('lastError clears after 3 correct in a row', () => {
    let m = updateMastery(withBox(2), attempt({ correct: false, errorType: 'carry-forgot' }), now)
    m = updateMastery(m, attempt(), now)
    m = updateMastery(m, attempt(), now)
    expect(m.lastError).toBe('carry-forgot')
    m = updateMastery(m, attempt(), now)
    expect(m.lastError).toBeNull()
  })

  it('intervalMs clamps boxes', () => {
    expect(intervalMs(-1)).toBe(0)
    expect(intervalMs(9)).toBe(16 * DAY)
  })
})

describe('dueSkills', () => {
  const map: MasteryMap = {
    'mul:6x7': { ...withBox(0), dueAt: at(-1).toISOString() },
    'mul:6x8': { ...withBox(2, 'mul:6x8'), dueAt: at(-5).toISOString() },
    'mul:3x6': { ...withBox(2, 'mul:3x6'), dueAt: at(-1).toISOString() },
    'mul:7x8': { ...withBox(4, 'mul:7x8'), dueAt: at(3).toISOString() },
    'add:3d:c1': { ...withBox(1, 'add:3d:c1'), dueAt: null },
    'mul:2x2': { ...withBox(5, 'mul:2x2'), dueAt: now.toISOString() },
  }
  it('returns only due skills, weakest and most overdue first', () => {
    expect(dueSkills(map, now, 10)).toEqual(['mul:6x7', 'add:3d:c1', 'mul:6x8', 'mul:3x6', 'mul:2x2'])
  })
  it('honours limit and filter', () => {
    expect(dueSkills(map, now, 2)).toEqual(['mul:6x7', 'add:3d:c1'])
    expect(dueSkills(map, now, 0)).toEqual([])
    expect(dueSkills(map, now, 10, (s) => s.startsWith('mul:'))).toEqual(['mul:6x7', 'mul:6x8', 'mul:3x6', 'mul:2x2'])
    expect(dueSkills(map, at(10), 10)).toContain('mul:7x8')
    expect(dueSkills({}, now, 5)).toEqual([])
  })
  it('ties are broken by skill key for determinism', () => {
    const tie: MasteryMap = { b: { ...withBox(1, 'mul:2x3'), skill: 'mul:2x3' }, a: { ...withBox(1, 'mul:2x2'), skill: 'mul:2x2' } }
    expect(dueSkills(tie, now, 5)).toEqual(['mul:2x2', 'mul:2x3'])
  })
})

describe('starsFor and factGrid', () => {
  it('starsFor uses the thresholds', () => {
    expect(starsFor(0, 0)).toBe(0)
    expect(starsFor(5, 10)).toBe(0)
    expect(starsFor(6, 10)).toBe(1)
    expect(starsFor(8, 10)).toBe(2)
    expect(starsFor(19, 20)).toBe(3)
    expect(starsFor(7, 10, [0.5, 0.7, 0.9])).toBe(2)
  })
  it('factGrid is a symmetric 10 × 10 grid with -1 for unseen facts', () => {
    const grid = factGrid({ 'mul:6x7': withBox(3), 'mul:1x1': withBox(5, 'mul:1x1'), 'mul:9x10': withBox(0, 'mul:9x10') })
    expect(grid).toHaveLength(10)
    expect(grid.every((r) => r.length === 10)).toBe(true)
    expect(grid[5][6]).toBe(3)
    expect(grid[6][5]).toBe(3)
    expect(grid[0][0]).toBe(5)
    expect(grid[8][9]).toBe(0)
    expect(grid[9][8]).toBe(0)
    expect(grid[2][3]).toBe(-1)
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) expect(grid[a][b]).toBe(grid[b][a])
  })
})

describe('choice exercises cannot climb past CHOICE_MAX_BOX by guessing', () => {
  const choice = (over: Partial<AttemptForMastery> = {}) => attempt({ choice: true, skill: 'word:sense:add', ...over })
  const write = (over: Partial<AttemptForMastery> = {}) => attempt({ skill: 'word:sense:add', ...over })

  it('a fluent, due right answer to a choice exercise stops at the mastered box', () => {
    const mastered = withBox(CHOICE_MAX_BOX, 'word:sense:add')
    const next = updateMastery(mastered, choice(), at(1))
    expect(next.box).toBe(CHOICE_MAX_BOX)
    // Still a right answer: it counts, and the review date moves on.
    expect(next.correct).toBe(mastered.correct + 1)
    expect(next.streak).toBe(mastered.streak + 1)
  })

  it('the same answer written (not a choice) climbs past the cap as before', () => {
    const mastered = withBox(CHOICE_MAX_BOX, 'word:sense:add')
    expect(updateMastery(mastered, write(), at(1)).box).toBe(CHOICE_MAX_BOX + 1)
  })

  it('a choice exercise still climbs from the boxes below the cap', () => {
    expect(updateMastery(withBox(0, 'word:sense:add'), choice(), now).box).toBe(1)
    expect(updateMastery(withBox(1, 'word:sense:add'), choice(), at(1)).box).toBe(CHOICE_MAX_BOX)
  })

  it('a wrong choice answer still lowers the box', () => {
    const mastered = withBox(CHOICE_MAX_BOX, 'word:sense:add')
    expect(updateMastery(mastered, choice({ correct: false, errorType: 'word-class' }), now).box).toBe(0)
  })

  it('isChoiceExercise marks the pick-from-options kinds and leaves the written ones alone', () => {
    const shape = { id: 's', kind: 'shape-choice', skill: 'word:sense:add', difficulty: 2 } as unknown as Exercise
    const fact = { id: 'f', kind: 'fact-mul', skill: 'mul:6x7', difficulty: 2 } as unknown as Exercise
    const eqSame = { id: 'e', kind: 'equation', mode: 'same', skill: 'eq:same', difficulty: 2 } as unknown as Exercise
    const eqFill = { id: 'e2', kind: 'equation', mode: 'fill', skill: 'eq:flex', difficulty: 2 } as unknown as Exercise
    const clockWrite = { id: 'c', kind: 'clock-read', mode: 'write', skill: 'clock:read:5', difficulty: 2 } as unknown as Exercise
    const clockPhrase = { id: 'c2', kind: 'clock-read', mode: 'phrase', skill: 'clock:read:5', difficulty: 2 } as unknown as Exercise
    expect(isChoiceExercise(shape)).toBe(true)
    expect(isChoiceExercise(eqSame)).toBe(true)
    expect(isChoiceExercise(clockPhrase)).toBe(true)
    expect(isChoiceExercise(fact)).toBe(false)
    expect(isChoiceExercise(eqFill)).toBe(false)
    expect(isChoiceExercise(clockWrite)).toBe(false)
  })
})
