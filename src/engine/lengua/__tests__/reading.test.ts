import { describe, expect, it } from 'vitest'
import { READINGS, readingById } from '@/content/lengua/stories'
import { createRng } from '../../rng'
import { kindsForSkill } from '../../skills'
import { buildLengua, checkLengua, hintsLengua, lenguaStatement } from '../exercises'
import { buildReading, readingExercise, readingKind } from '../reading'
import type { Answer, LenguaExercise, ReadingDef, SkillKey } from '@/types'

const READING_SKILLS: SkillKey[] = [
  'lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar', 'lng:lit:rima', 'lng:lit:fabula', 'lng:lit:adivinanzas', 'lng:lit:trabalenguas',
]

/** The answer a child gives when right, for any reading exercise. */
function rightAnswer(ex: LenguaExercise): Answer {
  switch (ex.kind) {
    case 'lng-read-choice': return { type: 'choice', index: ex.answer }
    case 'lng-read-text': return { type: 'text', value: ex.answer }
    case 'lng-read-order': return { type: 'marks', marked: [...ex.targets] }
    default: throw new Error('not a reading')
  }
}

describe('lectura: las preguntas de los textos', () => {
  it('every question of every reading is an exercise of its kind, with the reading and the skill', () => {
    for (const r of READINGS) r.questions.forEach((q, i) => {
      const ex = readingExercise(r, i)
      expect(ex.kind).toBe(readingKind(q))
      expect(ex.skill).toBe(q.skill)
      expect(ex.reading).toBe(r.id)
      expect(ex.id).toBe(`reading:${r.id}:${i}`)
    })
  })

  it('the order keeps the events and never comes out in the right order', () => {
    for (const r of READINGS) r.questions.forEach((q, i) => {
      if (q.kind !== 'order') return
      const ex = readingExercise(r, i)
      if (ex.kind !== 'lng-read-order') throw new Error('an order question is an order exercise')
      expect([...ex.events].sort()).toEqual([...q.events].sort())
      expect(ex.targets.map((t) => ex.events[t])).toEqual(q.events)
      expect(ex.events).not.toEqual(q.events)
    })
  })

  it('a right answer is correct, and a wrong one is a reading error with a clue', () => {
    for (const r of READINGS) r.questions.forEach((_q, i) => {
      const ex = readingExercise(r, i)
      expect(checkLengua(ex, rightAnswer(ex)).correct, ex.id).toBe(true)
      if (ex.kind === 'lng-read-choice') {
        const wrong = ex.options.findIndex((_, j) => j !== ex.answer)
        const res = checkLengua(ex, { type: 'choice', index: wrong })
        expect(res.correct).toBe(false)
        expect(res.errorType).toBe('reading')
      }
      if (ex.kind === 'lng-read-text') {
        expect(checkLengua(ex, { type: 'text', value: 'zzz' }).errorType).toBe('reading')
        expect(checkLengua(ex, { type: 'text', value: '   ' }).errorType).toBe('incomplete')
      }
    })
  })

  it('a typed word ignores the capital, and a missing accent gets the accent clue', () => {
    const ex = readingExercise(readingById('historia-biblioteca')!, 3)
    expect(ex.kind).toBe('lng-read-text')
    expect(checkLengua(ex, { type: 'text', value: 'LECHUZA' }).correct).toBe(true)
    const riddle = readingExercise(readingById('adivinanza-paraguas')!, 0)
    expect(checkLengua(riddle, { type: 'text', value: 'Paraguas' }).correct).toBe(true)
    expect(checkLengua(riddle, { type: 'text', value: 'paraguass' }).feedback).not.toMatch(/tilde/)
  })

  it('the order check needs every event, in the tapped order', () => {
    const r = readingById('historia-tarta')!
    const ex = readingExercise(r, 2)
    expect(ex.kind).toBe('lng-read-order')
    if (ex.kind !== 'lng-read-order') return
    expect(checkLengua(ex, { type: 'marks', marked: ex.targets.slice(0, 2) }).errorType).toBe('incomplete')
    const reversed = [...ex.targets].reverse()
    expect(checkLengua(ex, { type: 'marks', marked: reversed }).correct).toBe(false)
  })

  it('the kinds of each reading skill exist, and every one has a question in the bank', () => {
    for (const skill of READING_SKILLS) {
      const kinds = kindsForSkill(skill)
      expect(kinds.length, skill).toBeGreaterThan(0)
      for (const kind of kinds) {
        for (let seed = 1; seed <= 5; seed++) {
          const ex = buildReading(kind, skill, createRng(seed))
          expect(ex.kind).toBe(kind)
          expect(ex.skill).toBe(skill)
          expect(checkLengua(ex, rightAnswer(ex)).correct).toBe(true)
        }
      }
    }
  })

  it('buildLengua picks reading questions for the reading kinds, and hints and statements are child-facing', () => {
    const ex = buildLengua('lng-read-choice', 'lng:lit:rima', createRng(3))
    expect(ex.kind).toBe('lng-read-choice')
    expect(hintsLengua(ex).map((h) => h.level)).toEqual([1, 2, 3])
    expect(lenguaStatement(ex)).toMatch(/^Lectura: /)
    expect(() => buildReading('lng-read-text', 'lng:lect:ordenar', createRng(1))).toThrow(/no lng-read-text question/)
  })

  it('a reading has its skills and at least one question for each of them', () => {
    for (const r of READINGS as ReadingDef[]) {
      for (const skill of r.skills) expect(r.questions.some((q) => q.skill === skill), `${r.id} ${skill}`).toBe(true)
    }
  })
})
