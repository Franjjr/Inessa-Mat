/* Subjects: Lengua skills (lng:) are kept apart from every maths reader of mastery and attempts. */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ChildProfile, MasteryMap, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { GRADE3_SYLLABUS, teachingOrder } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { statsFromLocal } from '@/data/summary'
import {
  PLACEMENT_ACTIVITY, dueSkills, errorReport, factGrid, newMastery, placementRuns, planDailySession, planSession, recallReport, syllabusReport,
  topicNeeds,
} from '@/engine'
import { attemptsOf, masteryOf, placementFlags, subjectOfSession, subjectOfSkill, subjectOffered } from '../subjects'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const daysAgo = (d: number) => new Date(now.getTime() - d * DAY).toISOString()

const child: ChildProfile = {
  id: 'child-subjects', orgId: null, nickname: 'Lía', gender: 'f', grade: 3,
  companion: { species: 'cat', name: 'Luna', gender: 'f', colorway: 'default', equipped: [] },
  settings: { ...DEFAULT_CHILD_SETTINGS }, createdAt: daysAgo(60), updatedAt: daysAgo(1),
}

const LNG_SKILLS = ['lng:ortografia:b-v', 'lng:lectura:frase']

function mastery(skill: string, box: SkillMastery['box']): SkillMastery {
  return { ...newMastery(skill, now), box, attempts: 4, correct: 3, dueAt: daysAgo(1), lastSeenAt: daysAgo(2) }
}

/** A maths child in the middle of the school year, plus Lengua rows the planner must ignore. */
function mathMastery(): MasteryMap {
  const out: MasteryMap = {}
  for (const t of teachingOrder(GRADE3_SYLLABUS)) {
    if (t.id === 'tabla-3') break
    for (const s of t.skills) out[s] = mastery(s, 3)
  }
  return out
}

function withLanguage(base: MasteryMap): MasteryMap {
  const out: MasteryMap = { ...base }
  for (const s of LNG_SKILLS) out[s] = mastery(s, 1)
  return out
}

let n = 0
function attempt(over: Partial<AttemptRecord> & { skill: string; createdAt: string }): AttemptRecord {
  n += 1
  return {
    id: `subj${n}`, childId: 'child-subjects', sessionId: 's', kind: 'fact-mul', correct: true, given: '42', expected: '42',
    ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: null, context: {}, ...over,
  }
}

/** Maths attempts (mixed results, a placement run) and Lengua attempts (wrong, recall-eligible, placement-tagged). */
function mixedAttempts(): AttemptRecord[] {
  const maths: AttemptRecord[] = [
    attempt({ skill: 'mul:6x7', createdAt: daysAgo(1), correct: false, errorType: 'fact', expected: '42', given: '36' }),
    attempt({ skill: 'mul:6x7', createdAt: daysAgo(20), correct: true }),
    attempt({ skill: 'mul:6x7', createdAt: daysAgo(40), correct: true }),
    attempt({ skill: 'add:2d:c0', kind: 'column-add', createdAt: daysAgo(3), correct: false, errorType: 'carry-forgot', context: { method: 'borrow' } }),
    attempt({ skill: 'mul:6x7', createdAt: daysAgo(2), correct: true, context: { activity: PLACEMENT_ACTIVITY } }),
  ]
  const language: AttemptRecord[] = [
    attempt({ skill: 'lng:ortografia:b-v', kind: 'fact-mul', createdAt: daysAgo(1), correct: false, errorType: 'fact', context: { method: 'borrow' } }),
    attempt({ skill: 'lng:ortografia:b-v', createdAt: daysAgo(20), correct: true }),
    attempt({ skill: 'lng:lectura:frase', createdAt: daysAgo(40), correct: true }),
    attempt({ skill: 'lng:lectura:frase', createdAt: daysAgo(3), correct: false, errorType: 'dont-know', context: { activity: PLACEMENT_ACTIVITY } }),
  ]
  return [...maths, ...language].sort((x, y) => y.createdAt.localeCompare(x.createdAt))
}

describe('subjectOfSkill', () => {
  it('lng: keys are Lengua, every other key is maths', () => {
    expect(subjectOfSkill('lng:ortografia:b-v')).toBe('language')
    expect(subjectOfSkill('mul:6x7')).toBe('math')
    expect(subjectOfSkill('word:add')).toBe('math')
    expect(subjectOfSkill('lngx:none')).toBe('math')
  })
})

describe('masteryOf', () => {
  it('keeps only the rows of the subject and does not touch the input', () => {
    const all = withLanguage(mathMastery())
    const before = Object.keys(all).length
    const maths = masteryOf(all, 'math')
    const language = masteryOf(all, 'language')
    expect(Object.keys(maths)).toEqual(Object.keys(mathMastery()))
    expect(Object.keys(language).sort()).toEqual([...LNG_SKILLS].sort())
    expect(Object.keys(all)).toHaveLength(before)
  })
})

describe('attemptsOf', () => {
  it('keeps the attempts of the subject, in their order', () => {
    const all = mixedAttempts()
    const maths = attemptsOf(all, 'math')
    expect(maths.every((a) => !a.skill.startsWith('lng:'))).toBe(true)
    expect(maths).toEqual(all.filter((a) => !a.skill.startsWith('lng:')))
    expect(attemptsOf(all, 'language')).toHaveLength(all.length - maths.length)
  })
})

describe('placementFlags and sessionRewardKey keys', () => {
  it('maths keeps its flag names, Lengua has its own', () => {
    expect(placementFlags('math')).toEqual({ done: 'placement', requested: 'placementRequested' })
    expect(placementFlags('language')).toEqual({ done: 'placementLengua', requested: 'placementLenguaRequested' })
  })
})

describe('maths readers ignore Lengua rows', () => {
  it('planDailySession plans the same day with or without lng: rows', () => {
    const base = mathMastery()
    const withLng = withLanguage(base)
    const plan = (m: MasteryMap) => planDailySession({ child, mastery: m, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    const a = plan(base)
    const b = plan(withLng)
    const shape = (p: ReturnType<typeof plan>) => ({
      topic: p.topic?.id,
      seconds: p.practiceSeconds,
      newFacts: p.newFactCount,
      blocks: p.blocks.map((blk) => ({ id: blk.id, items: blk.items.map((i) => [i.exercise.skill, i.exercise.id, i.scaffold, i.isNew]) })),
    })
    expect(shape(b)).toEqual(shape(a))
    expect(a.blocks.flatMap((blk) => blk.items).length).toBeGreaterThan(0)
  })

  it('planDailySession ignores lng: attempts when it chooses scaffolding', () => {
    const base = mathMastery()
    const lngWrong = [1, 2, 3].map((i) => attempt({ skill: 'lng:ortografia:b-v', createdAt: daysAgo(i), correct: false, errorType: 'fact' }))
    const plan = (attempts: AttemptRecord[]) => planDailySession({ child, mastery: base, attempts, syllabus: GRADE3_SYLLABUS, now })
    expect(plan(lngWrong).blocks.map((blk) => blk.items.map((i) => i.exercise.id))).toEqual(plan([]).blocks.map((blk) => blk.items.map((i) => i.exercise.id)))
  })

  it('planSession (the review list) ignores lng: rows', () => {
    const progress = initialProgress(child.id, now)
    const base = mathMastery()
    const plan = (m: MasteryMap) => planSession({ child, progress, mastery: m, now }).review
    expect(plan(withLanguage(base))).toEqual(plan(base))
  })

  it('errorReport counts only maths mistakes', () => {
    const all = mixedAttempts()
    expect(errorReport(all, now)).toEqual(errorReport(attemptsOf(all, 'math'), now))
  })

  it('recallReport checks only maths skills', () => {
    const all = mixedAttempts()
    expect(recallReport(all, now)).toEqual(recallReport(attemptsOf(all, 'math'), now))
  })

  it('topicNeeds and syllabusReport ignore lng: rows', () => {
    const all = mixedAttempts()
    expect(topicNeeds(GRADE3_SYLLABUS, all, now)).toEqual(topicNeeds(GRADE3_SYLLABUS, attemptsOf(all, 'math'), now))
    const m = withLanguage(mathMastery())
    expect(syllabusReport(GRADE3_SYLLABUS, m)).toEqual(syllabusReport(GRADE3_SYLLABUS, mathMastery()))
  })

  it('placementRuns does not count a Lengua row tagged as placement', () => {
    const all = mixedAttempts()
    expect(placementRuns(all)).toEqual(placementRuns(attemptsOf(all, 'math')))
  })

  it('statsFromLocal (accuracy, top errors, methods) counts only maths rows', () => {
    const all = mixedAttempts()
    const sessions: never[] = []
    const onlyMaths = statsFromLocal(attemptsOf(all, 'math'), attemptsOf(all, 'math'), sessions, null)
    expect(statsFromLocal(all, all, sessions, null)).toEqual(onlyMaths)
  })
})

describe('the subject of a session and of an offer', () => {
  it('a session with the Lengua mark is Lengua; any other session is maths', () => {
    const lengua = { summary: { attempts: 0, correct: 0, starsEarned: 0, nodesCompleted: [], subject: 'language' as const } }
    expect(subjectOfSession(lengua)).toBe('language')
    expect(subjectOfSession({ summary: null })).toBe('math')
    expect(subjectOfSession({ summary: { attempts: 3, correct: 2, starsEarned: 1, nodesCompleted: [] } })).toBe('math')
  })

  it('Lengua is offered to 3.º and to a child without a course; maths to every course', () => {
    expect(subjectOffered('language', 3)).toBe(true)
    expect(subjectOffered('language', undefined)).toBe(true)
    expect(subjectOffered('language', 2)).toBe(false)
    expect(subjectOffered('language', 4)).toBe(false)
    expect(subjectOffered('math', 2)).toBe(true)
  })
})

describe('the home and the summary read maths mastery only (lng: rows left out)', () => {
  const mixed = (): MasteryMap => {
    const m: MasteryMap = {}
    m['mul:6x7'] = { ...newMastery('mul:6x7', new Date(daysAgo(30))), box: 1, dueAt: daysAgo(5), lastSeenAt: daysAgo(30) }
    m['mul:3x4'] = { ...newMastery('mul:3x4', new Date(daysAgo(30))), box: 2, dueAt: daysAgo(2), lastSeenAt: daysAgo(30) }
    for (let i = 0; i < 6; i++) {
      const skill = `lng:orto:c-qu:${i}`
      m[skill] = { ...newMastery(skill, new Date(daysAgo(30))), box: 0, dueAt: daysAgo(9), lastSeenAt: daysAgo(30) }
    }
    return m
  }

  it('the home due count (dueSkills over the maths mastery) does not count a Lengua skill that is due', () => {
    const all = mixed()
    expect(dueSkills(all, now, 50).length).toBeGreaterThan(2)
    const mathsDue = dueSkills(masteryOf(all, 'math'), now, 50)
    expect(mathsDue.every((k) => !k.startsWith('lng:'))).toBe(true)
    expect(mathsDue.length).toBe(2)
  })

  it('the summary factGrid is the maths grid: a Lengua row never lands in a multiplication cell', () => {
    const all = mixed()
    const maths = factGrid(masteryOf(all, 'math'))
    expect(maths[5][6]).toBe(1)
    expect(maths[2][3]).toBe(2)
    // Each fact fills its cell and the mirror cell: two facts, four cells; no Lengua row adds one.
    expect(maths.flat().filter((v) => v >= 0).length).toBe(4)
    const withoutLengua = Object.fromEntries(Object.entries(all).filter(([k]) => !k.startsWith('lng:')))
    expect(maths).toEqual(factGrid(withoutLengua))
  })
})
