/* The adult report for Lengua: its temario, «No lo sabía» per topic, mistakes in plain words, the placement, the minutes
   of the week and the labels of its skills. The maths readers stay the same with Lengua rows around. */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ErrorType, MasteryMap, SessionRecord, SkillMastery } from '@/types'
import { GRADE3_SYLLABUS, LENGUA3_SYLLABUS, allTopics } from '@/content/syllabus'
import {
  ERROR_GROUPS, LENGUA_PLACEMENT_ACTIVITY, LENGUA_PLACEMENT_COUNT, PLACEMENT_ACTIVITY, PLACEMENT_COUNT, describeError, describeSkill,
  errorGroupOf, errorReport, minutesOfSubject, newMastery, placementRuns, syllabusReport, topicNeeds,
} from '@/engine'
import { LENGUA_SKILL_TEXT } from '../describe'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const daysAgo = (d: number, extraMs = 0) => new Date(now.getTime() - d * DAY + extraMs).toISOString()

let n = 0
function attempt(over: Partial<AttemptRecord> & { createdAt: string }): AttemptRecord {
  n += 1
  return {
    id: `lr${n}`, childId: 'c', sessionId: 's', skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42', expected: '42',
    ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: null, context: {}, ...over,
  }
}

function mastery(skill: string, box: SkillMastery['box']): SkillMastery {
  return { ...newMastery(skill, now), box, attempts: 4, correct: 3, dueAt: daysAgo(1), lastSeenAt: daysAgo(2) }
}

const LENGUA_TYPES: ErrorType[] = ['word-class', 'word-form', 'sentence-part', 'spelling', 'capital', 'punctuation', 'stress', 'syllable', 'dictation', 'alphabet', 'word-pair', 'reading']

describe('Lengua temario', () => {
  const silabas = allTopics(LENGUA3_SYLLABUS).find((t) => t.id === 'lng-silabas')!

  it('marks a topic as mastered from its Lengua skills only, and ignores maths rows', () => {
    const lenguaOnly: MasteryMap = { [silabas.skills[0]]: mastery(silabas.skills[0], 2) }
    const mixed: MasteryMap = { ...lenguaOnly, 'mul:6x7': mastery('mul:6x7', 2), 'add:2d:c0': mastery('add:2d:c0', 2) }
    const r = syllabusReport(LENGUA3_SYLLABUS, mixed, 'language')
    expect(r.mastered).toBe(1)
    expect(r.blocks[0].topics[0]).toMatchObject({ id: 'lng-silabas', state: 'dominado' })
    expect(syllabusReport(LENGUA3_SYLLABUS, mixed, 'language')).toEqual(syllabusReport(LENGUA3_SYLLABUS, lenguaOnly, 'language'))
    // The maths temario does not see Lengua mastery.
    expect(syllabusReport(GRADE3_SYLLABUS, lenguaOnly).mastered).toBe(0)
  })

  it('counts «No lo sabía» and retries per Lengua topic, and leaves maths out', () => {
    const skill = silabas.skills[0]
    const list = [
      attempt({ skill, correct: false, errorType: 'dont-know', createdAt: daysAgo(1) }),
      attempt({ skill, correct: true, retries: 1, graded: false, createdAt: daysAgo(2) }),
      attempt({ skill, correct: true, retries: 1, createdAt: daysAgo(3) }),
      attempt({ skill: 'mul:6x7', correct: false, errorType: 'dont-know', createdAt: daysAgo(1) }),
    ]
    const needs = topicNeeds(LENGUA3_SYLLABUS, list, now, 30, 'language')
    // Both retry rows count (an ungraded retry row is still an answer that needed another try).
    expect(needs).toEqual({ 'lng-silabas': { dontKnow: 1, retried: 2 } })
    expect(topicNeeds(LENGUA3_SYLLABUS, list, now)).toEqual({})
  })
})

describe('Lengua mistakes', () => {
  const list = [
    attempt({ skill: 'lng:gram:sustantivo:genero', correct: false, errorType: 'word-class', createdAt: daysAgo(1) }),
    attempt({ skill: 'lng:orto:c-qu', correct: false, errorType: 'spelling', createdAt: daysAgo(2) }),
    attempt({ skill: 'lng:orto:c-qu', correct: false, errorType: 'spelling', createdAt: daysAgo(3) }),
    attempt({ skill: 'lng:voc:sinonimos', correct: false, errorType: 'incomplete', createdAt: daysAgo(4) }),
    attempt({ skill: 'lng:voc:sinonimos', correct: false, errorType: 'recognition', createdAt: daysAgo(4) }),
    attempt({ skill: 'lng:voc:sinonimos', correct: false, errorType: 'dont-know', createdAt: daysAgo(5) }),
    attempt({ skill: 'mul:6x7', correct: false, errorType: 'fact', createdAt: daysAgo(1) }),
  ]

  it('groups the Lengua wrong answers in plain groups, and leaves maths and «No lo sé» out', () => {
    const r = errorReport(list, now, 30, 'language')
    expect(r.answered).toBe(5)
    expect(r.wrong).toBe(4)
    expect(r.groups.map((g) => g.id).sort()).toEqual(['lengua-gramatica', 'lengua-ortografia', 'lengua-otros'])
    expect(r.groups.find((g) => g.id === 'lengua-ortografia')).toMatchObject({ count: 2, types: [{ errorType: 'spelling', count: 2 }] })
    expect(r.groups.find((g) => g.id === 'lengua-otros')).toMatchObject({ count: 1 })
  })

  it('the maths report ignores Lengua rows, and the Lengua one ignores maths rows', () => {
    expect(errorReport(list, now).groups.map((g) => g.id)).toEqual(['tablas'])
    expect(errorReport(list, now).wrong).toBe(1)
  })

  it('every Lengua error type has a Lengua group and a plain text', () => {
    const ids = ERROR_GROUPS.map((g) => g.id)
    for (const t of LENGUA_TYPES) {
      const id = errorGroupOf(t, 'language')
      expect(id?.startsWith('lengua-')).toBe(true)
      expect(ids).toContain(id)
      expect(describeError(t)).not.toBe(t)
    }
    expect(errorGroupOf('incomplete', 'language')).toBe('lengua-otros')
    expect(errorGroupOf('incomplete')).toBe('despiste')
    expect(errorGroupOf('recognition', 'language')).toBeNull()
  })
})

describe('Lengua placement', () => {
  const GRAM = ['lng:gram:sustantivo:genero', 'lng:gram:articulo', 'lng:gram:adjetivo', 'lng:gram:verbo:presente']
  const ORTO = ['lng:orto:mayusculas', 'lng:orto:c-qu', 'lng:orto:signos:punto', 'lng:orto:tonica']
  const VOC = ['lng:voc:abecedario', 'lng:voc:sinonimos', 'lng:voc:familias', 'lng:voc:compuestas']
  const run = (startDaysAgo: number, session: string, right: number, activity = LENGUA_PLACEMENT_ACTIVITY) =>
    [...GRAM, ...ORTO, ...VOC].slice(0, LENGUA_PLACEMENT_COUNT).map((skill, i) => attempt({
      createdAt: daysAgo(startDaysAgo, i * 30_000), sessionId: session, skill, correct: i < right, context: { activity },
    }))

  it('reads the Lengua runs by their blocks, and not the maths ones', () => {
    const mathRun = Array.from({ length: PLACEMENT_COUNT }, (_, i) => attempt({
      createdAt: daysAgo(3, i * 30_000), sessionId: 'm', skill: 'mul:6x7', correct: true, context: { activity: PLACEMENT_ACTIVITY },
    }))
    const all = [...run(2, 'l1', 6), ...mathRun]
    const runs = placementRuns(all, 'language')
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ answered: LENGUA_PLACEMENT_COUNT, correct: 6, complete: true })
    expect(runs[0].blocks.map((b) => [b.id, b.correct, b.total])).toEqual([['gramatica', 4, 4], ['ortografia', 2, 4], ['vocabulario', 0, 4]])
    expect(placementRuns(all)).toEqual(placementRuns(all.filter((a) => a.context.activity === PLACEMENT_ACTIVITY), 'math'))
    expect(placementRuns(all)).toHaveLength(1)
  })
})

describe('Lengua minutes of the week', () => {
  it('adds the minutes of the Lengua sessions only', () => {
    const sessions = [
      { minutes: 12, summary: { subject: 'language' } },
      { minutes: 20, summary: undefined },
      { minutes: 9, summary: { subject: 'language' } },
    ] as unknown as SessionRecord[]
    expect(minutesOfSubject(sessions, 'language')).toBe(21)
    expect(minutesOfSubject(sessions, 'math')).toBe(20)
  })
})

describe('Lengua skill labels', () => {
  const skills = allTopics(LENGUA3_SYLLABUS).flatMap((t) => t.skills)

  it('every Lengua skill of the temario has a plain adult label', () => {
    for (const skill of skills) {
      expect(LENGUA_SKILL_TEXT[skill], skill).toBeTruthy()
      expect(describeSkill(skill)).toBe(LENGUA_SKILL_TEXT[skill])
      expect(describeSkill(skill)).not.toMatch(/^Lengua,|lng:/)
    }
    expect(describeSkill('lng:gram:sustantivo:genero')).toBe('Sustantivo: masculino o femenino')
  })
})
