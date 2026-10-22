import { describe, expect, it } from 'vitest'
import type { LessonStep } from '@/types'
import { computeRuns, keyAction, stageCharacter, voiceFor } from './navigation'

const show = (visual: LessonStep['visual'], params?: LessonStep['params']): LessonStep => ({ visual, text: 'x', interaction: 'tap', params })
const tryIt = (visual: LessonStep['visual']): LessonStep => ({ visual, text: 'x', interaction: 'try', trySelector: { kinds: ['fact-mul'] } })

describe('computeRuns', () => {
  it('groups consecutive steps with the same visual and params into one run', () => {
    const runs = computeRuns([
      show('groups', { groups: 4, perGroup: 3 }),
      show('groups', { groups: 4, perGroup: 3 }),
      show('groups', { groups: 4, perGroup: 3 }),
      tryIt('groups'),
      show('array-rotate', { rows: 3, cols: 5 }),
      show('array-rotate', { rows: 2, cols: 6 }),
    ])
    expect(runs).toEqual([
      { start: 0, length: 3, phase: 0 },
      { start: 0, length: 3, phase: 1 },
      { start: 0, length: 3, phase: 2 },
      { start: 3, length: 1, phase: 0 },
      { start: 4, length: 1, phase: 0 },
      { start: 5, length: 1, phase: 0 },
    ])
  })

  it('does not merge across a try step, even with the same visual', () => {
    const runs = computeRuns([show('carry', { a: 1, b: 2 }), tryIt('carry'), show('carry', { a: 1, b: 2 })])
    expect(runs.map((r) => r.start)).toEqual([0, 1, 2])
    expect(runs.every((r) => r.length === 1)).toBe(true)
  })

  it('returns no runs for an empty lesson', () => {
    expect(computeRuns([])).toEqual([])
  })
})

describe('keyAction', () => {
  const base = { key: '', editable: false, interactive: false, modified: false, onBody: true }

  it('moves with arrows and Page keys', () => {
    expect(keyAction({ ...base, key: 'ArrowRight' })).toBe('next')
    expect(keyAction({ ...base, key: 'PageDown' })).toBe('next')
    expect(keyAction({ ...base, key: 'ArrowLeft' })).toBe('back')
    expect(keyAction({ ...base, key: 'PageUp' })).toBe('back')
  })

  it('continues with Enter only when nothing else has focus', () => {
    expect(keyAction({ ...base, key: 'Enter' })).toBe('next')
    expect(keyAction({ ...base, key: 'Enter', onBody: false, interactive: true })).toBeNull()
  })

  it('exits with Escape, even from an interactive control', () => {
    expect(keyAction({ ...base, key: 'Escape', interactive: true, onBody: false })).toBe('exit')
  })

  it('leaves typing and browser shortcuts alone', () => {
    expect(keyAction({ ...base, key: 'ArrowRight', editable: true, onBody: false })).toBeNull()
    expect(keyAction({ ...base, key: 'ArrowRight', modified: true })).toBeNull()
    expect(keyAction({ ...base, key: 'ArrowRight', interactive: true, onBody: false })).toBeNull()
  })
})

describe('speakers', () => {
  it('shows Lumi for the narrator and the companion, and the named character otherwise', () => {
    expect(stageCharacter(undefined)).toBe('lumi')
    expect(stageCharacter('narrator')).toBe('lumi')
    expect(stageCharacter('companion')).toBe('lumi')
    expect(stageCharacter('owl')).toBe('owl')
  })

  it('chooses a voice preset per speaker', () => {
    expect(voiceFor(undefined)).toBe('lumi')
    expect(voiceFor('borron')).toBe('companion')
    expect(voiceFor('queen')).toBe('guardian')
  })
})
