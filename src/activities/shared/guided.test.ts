import { describe, expect, it } from 'vitest'
import type { ExerciseOutcome } from '@/types'
import { guidedOutcome } from './guided'

const outcome = (over: Partial<ExerciseOutcome> = {}): ExerciseOutcome => ({
  check: { correct: true, given: '6', expected: '6' }, ms: 1800, inputMode: 'keypad', hintsUsed: 0, recognitionFixes: 0, ...over,
})

describe('guidedOutcome', () => {
  it('a right answer shown with its guide counts one hint used, so it does not climb mastery', () => {
    const counted = guidedOutcome(outcome())
    expect(counted.hintsUsed).toBe(1)
    expect(counted.check.correct).toBe(true)
  })

  it('keeps the hints already counted (idempotent: no double count)', () => {
    expect(guidedOutcome(outcome({ hintsUsed: 1 })).hintsUsed).toBe(1)
    expect(guidedOutcome(outcome({ hintsUsed: 2 })).hintsUsed).toBe(2)
  })

  it('does not change the rest of the outcome', () => {
    const o = outcome({ retries: 1, method: 'galera' })
    expect(guidedOutcome(o)).toEqual({ ...o, hintsUsed: 1 })
  })
})
