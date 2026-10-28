import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ErrorType, MasteryMap, SkillMastery } from '@/types'
import { errorReport, placementRuns, recallReport, topicNeeds } from '@/engine/report'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import { handwritingReport } from './report'

const NOW = new Date('2026-10-28T12:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function attempt(over: Partial<AttemptRecord> & { skill: string }): AttemptRecord {
  return {
    id: crypto.randomUUID(), childId: 'c1', sessionId: 's1', kind: 'cursive', correct: true, given: '3', expected: '3',
    ms: 1000, inputMode: 'pen', hintsUsed: 0, errorType: null, context: {},
    createdAt: new Date(NOW.getTime() - 2 * DAY).toISOString(),
    ...over,
  } as AttemptRecord
}

function mark(skill: string, box: SkillMastery['box'], attempts = 3): SkillMastery {
  return { skill, box, attempts, correct: attempts, streak: 0, avgMs: null, lastSeenAt: null, dueAt: null, updatedAt: NOW.toISOString() }
}

describe('handwritingReport', () => {
  it('is null with no calig: attempt, so the section stays hidden', () => {
    expect(handwritingReport([attempt({ skill: 'mul:2x3', kind: 'multiplication' as AttemptRecord['kind'] })], {})).toBeNull()
  })

  it('lists the learnt letters and links, and the ones that cost', () => {
    const mastery: MasteryMap = {
      'calig:letra:a': mark('calig:letra:a', 5),
      'calig:enlace:br': mark('calig:enlace:br', 4),
      'calig:letra:f': mark('calig:letra:f', 0),
      'calig:letra:z': mark('calig:letra:z', 2),
    }
    const r = handwritingReport([attempt({ skill: 'calig:letra:a' })], mastery)!
    expect(r.learnt).toEqual(['a', 'br'])
    expect(r.costly).toEqual(['f'])
  })

  it('names the criterion that fails most, in words', () => {
    const fails: ErrorType[] = ['calig-size', 'calig-size', 'calig-shape']
    const list = fails.map((errorType) => attempt({ skill: 'calig:letra:f', correct: false, errorType }))
    const r = handwritingReport(list, {})!
    expect(r.worst).toEqual({ errorType: 'calig-size', word: 'el tamaño', count: 2 })
  })

  it('has no worst criterion when no try failed on one', () => {
    expect(handwritingReport([attempt({ skill: 'calig:letra:a' })], {})!.worst).toBeNull()
  })
})

describe('the maths and Lengua readers never count calig: rows', () => {
  const maths = [
    attempt({ skill: 'mul:2x3', kind: 'multiplication' as AttemptRecord['kind'], correct: false, errorType: 'fact', createdAt: new Date(NOW.getTime() - 3 * DAY).toISOString() }),
    attempt({ skill: 'mul:4x5', kind: 'multiplication' as AttemptRecord['kind'], correct: true, createdAt: new Date(NOW.getTime() - 4 * DAY).toISOString() }),
  ]
  const calig = [
    attempt({ skill: 'calig:letra:a', correct: false, errorType: 'calig-size' }),
    attempt({ skill: 'calig:letra:a', correct: false, errorType: 'calig-shape' }),
    attempt({ skill: 'calig:letra:o', correct: false, errorType: 'calig-line' }),
  ]

  it('keeps the maths errors report unchanged', () => {
    expect(errorReport([...calig, ...maths], NOW)).toEqual(errorReport(maths, NOW))
  })

  it('keeps the maths tests and needs unchanged', () => {
    const all = [...calig, ...maths]
    expect(recallReport(all, NOW)).toEqual(recallReport(maths, NOW))
    expect(placementRuns(all)).toEqual(placementRuns(maths))
    expect(topicNeeds(GRADE3_SYLLABUS, all, NOW)).toEqual(topicNeeds(GRADE3_SYLLABUS, maths, NOW))
  })

  it('never shows a calig- mistake in the Lengua errors report', () => {
    const groups = errorReport(calig, NOW, 30, 'language').groups
    expect(groups).toEqual([])
    expect(errorReport(calig, NOW, 30, 'language').wrong).toBe(0)
  })
})
