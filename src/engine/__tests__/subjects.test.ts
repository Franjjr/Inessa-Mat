/* Subjects: Lengua skills (lng:) are kept apart from every maths reader of mastery and attempts. */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ChildProfile, MasteryMap, SkillMastery } from '@/types'
import { DEFAULT_CHILD_SETTINGS } from '@/types'
import { allTopics, GRADE3_SYLLABUS, INGLES3_SYLLABUS, LENGUA3_SYLLABUS, subjectOfTopic, syllabusFor, teachingOrder } from '@/content/syllabus'
import { initialProgress } from '@/content'
import { statsFromLocal } from '@/data/summary'
import { planLenguaSession } from '@/engine/lengua/daily'
import {
  PLACEMENT_ACTIVITY, dueSkills, errorReport, factGrid, newMastery, placementRuns, planDailySession, planSession, recallReport, syllabusReport,
  topicNeeds,
} from '@/engine'
import {
  ENGLISH_SESSION_MINUTES, attemptsOf, handwritingAttempts, handwritingMastery, isHandwritingSkill, masteryOf, placementFlags, subjectOfSession,
  subjectOfSkill, subjectOffered,
} from '../subjects'

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

  it('eng: keys are English, lng: stays Lengua and every other key is maths', () => {
    expect(subjectOfSkill('eng:num:0-20')).toBe('english')
    expect(subjectOfSkill('lng:ortografia:b-v')).toBe('language')
    expect(subjectOfSkill('engx:none')).toBe('math')
  })
})

describe('English rows (eng:) are kept apart from maths and Lengua', () => {
  const engRow = (skill: string): SkillMastery => mastery(skill, 1)
  const withEnglish = (): MasteryMap => ({ ...withLanguage(mathMastery()), 'eng:num:0-20': engRow('eng:num:0-20') })

  it('masteryOf returns only the rows of each subject', () => {
    const all = withEnglish()
    expect(Object.keys(masteryOf(all, 'english'))).toEqual(['eng:num:0-20'])
    expect(Object.keys(masteryOf(all, 'language')).sort()).toEqual([...LNG_SKILLS].sort())
    expect(Object.keys(masteryOf(all, 'math'))).toEqual(Object.keys(mathMastery()))
  })

  it('attemptsOf returns only the attempts of each subject, in their order', () => {
    const eng = attempt({ skill: 'eng:num:0-20', createdAt: daysAgo(2), correct: false, errorType: 'fact' })
    const base = mixedAttempts()
    const all = [eng, ...base]
    expect(attemptsOf(all, 'english')).toEqual([eng])
    expect(attemptsOf(all, 'math')).toEqual(attemptsOf(base, 'math'))
    expect(attemptsOf(all, 'language')).toEqual(attemptsOf(base, 'language'))
  })

  it('the maths planner, review and reports ignore eng: rows', () => {
    const all = withEnglish()
    const plan = (m: MasteryMap) => planDailySession({ child, mastery: m, attempts: [], syllabus: GRADE3_SYLLABUS, now })
    expect(plan(all).blocks.map((b) => b.items.map((i) => i.exercise.id))).toEqual(plan(mathMastery()).blocks.map((b) => b.items.map((i) => i.exercise.id)))
    const progress = initialProgress(child.id, now)
    expect(planSession({ child, progress, mastery: all, now }).review).toEqual(planSession({ child, progress, mastery: mathMastery(), now }).review)
    const eng = [attempt({ skill: 'eng:num:0-20', createdAt: daysAgo(1), correct: false, errorType: 'fact' })]
    expect(errorReport([...eng, ...mixedAttempts()], now)).toEqual(errorReport(mixedAttempts(), now))
    expect(recallReport([...eng, ...mixedAttempts()], now)).toEqual(recallReport(mixedAttempts(), now))
  })

  it('the home due count (dueSkills over masteryOf maths, as ChildHomeScreen) does not count an overdue eng: row', () => {
    const all: MasteryMap = { ...mathMastery(), 'eng:num:0-20': { ...mastery('eng:num:0-20', 0), dueAt: daysAgo(9) } }
    // The row is really due: the raw map reader sees it, so the maths-only count must leave it out on purpose.
    expect(dueSkills(all, now, 50)).toContain('eng:num:0-20')
    expect(dueSkills(masteryOf(all, 'math'), now, 50)).toEqual(dueSkills(mathMastery(), now, 50))
  })

  it('the Repasar list (planSession, which reads the raw map) ignores an overdue eng: row', () => {
    const all: MasteryMap = { ...mathMastery(), 'eng:num:0-20': { ...mastery('eng:num:0-20', 0), dueAt: daysAgo(9) } }
    const progress = initialProgress(child.id, now)
    const review = (m: MasteryMap) => planSession({ child, progress, mastery: m, now }).review
    expect(review(all).some((k) => k.startsWith('eng:'))).toBe(false)
    expect(review(all)).toEqual(review(mathMastery()))
  })

  it('statsFromLocal ignores eng: attempts: the stats with them equal the stats without them', () => {
    const base = mixedAttempts()
    const eng = [
      attempt({ skill: 'eng:num:0-20', createdAt: daysAgo(1), correct: false, errorType: 'fact' }),
      attempt({ skill: 'eng:num:0-20', createdAt: daysAgo(2), correct: true }),
    ]
    expect(statsFromLocal([...eng, ...base], [...eng, ...base], [], null)).toEqual(statsFromLocal(base, base, [], null))
  })
})

describe('the Lengua planner ignores English rows', () => {
  it('planLenguaSession plans the same day with or without eng: rows (same child, same day)', () => {
    const base = withLanguage({})
    const withEng: MasteryMap = { ...base, 'eng:num:0-20': mastery('eng:num:0-20', 1) }
    const plan = (m: MasteryMap) => planLenguaSession({ child, mastery: m, syllabus: LENGUA3_SYLLABUS, now, progress: initialProgress(child.id, now) })
    const shape = (p: ReturnType<typeof plan>) => ({
      topic: p.topic?.id,
      seconds: p.practiceSeconds,
      blocks: p.blocks.map((blk) => blk.items.map((i) => [i.exercise.id, i.scaffold, i.isNew])),
    })
    expect(shape(plan(withEng))).toEqual(shape(plan(base)))
    expect(plan(base).blocks.flatMap((blk) => blk.items).length).toBeGreaterThan(0)
  })
})

describe('English subject table', () => {
  it('placement flags are their own', () => {
    expect(placementFlags('english')).toEqual({ done: 'placementIngles', requested: 'placementInglesRequested' })
  })

  it('English is offered to 3.º and to a child without a course, like Lengua', () => {
    expect(subjectOffered('english', 3)).toBe(true)
    expect(subjectOffered('english', undefined)).toBe(true)
    expect(subjectOffered('english', 2)).toBe(false)
    expect(subjectOffered('english', 4)).toBe(false)
  })

  it('a session marked handwriting is Caligrafía, not maths', () => {
    expect(subjectOfSession({ summary: { attempts: 0, correct: 0, starsEarned: 0, nodesCompleted: [], subject: 'handwriting' } })).toBe('handwriting')
  })

  it('a session marked english is English', () => {
    expect(subjectOfSession({ summary: { attempts: 0, correct: 0, starsEarned: 0, nodesCompleted: [], subject: 'english' } })).toBe('english')
  })

  it('an English session lasts ten minutes', () => {
    expect(ENGLISH_SESSION_MINUTES).toBe(10)
  })

  it('a topic with the eng- prefix is English; English has the 3.º temario (2.º and 4.º are empty)', () => {
    expect(subjectOfTopic('eng-num-0-20')).toBe('english')
    expect(subjectOfTopic('lng-silabas')).toBe('language')
    expect(subjectOfTopic('suma-2d')).toBe('math')
    expect(syllabusFor('english', 3)).toBe(INGLES3_SYLLABUS)
    expect(syllabusFor('english')).toBe(INGLES3_SYLLABUS)
    expect(allTopics(syllabusFor('english', 2))).toEqual([])
    expect(allTopics(syllabusFor('english', 4))).toEqual([])
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

describe('handwriting (calig:) keys', () => {
  const calRow = (skill: string): SkillMastery => mastery(skill, 2)
  const mixed = (): MasteryMap => ({
    ...mathMastery(), ...withLanguage({}), 'calig:letra:a': calRow('calig:letra:a'), 'calig:palabra:casa': calRow('calig:palabra:casa'),
  })

  it('the calendar skills cal:weekday and cal:month stay maths', () => {
    const all: MasteryMap = { ...mathMastery(), 'cal:weekday': mastery('cal:weekday', 2) }
    expect(masteryOf(all, 'math')).toHaveProperty('cal:weekday')
    expect(handwritingMastery(all)).not.toHaveProperty('cal:weekday')
  })

  it('maths and Lengua readers never count calig: keys', () => {
    const all = mixed()
    expect(Object.keys(masteryOf(all, 'math')).some((k) => k.startsWith('calig:'))).toBe(false)
    expect(Object.keys(masteryOf(all, 'math'))).toEqual(Object.keys(mathMastery()))
    expect(Object.keys(masteryOf(all, 'language')).sort()).toEqual([...LNG_SKILLS].sort())
  })

  it('attemptsOf leaves calig: attempts out of both subjects', () => {
    const calAttempt = attempt({ skill: 'calig:letra:a', kind: 'fact-mul', createdAt: daysAgo(1) })
    const base = mixedAttempts()
    const all = [calAttempt, ...base]
    expect(attemptsOf(all, 'math')).not.toContain(calAttempt)
    expect(attemptsOf(all, 'language')).not.toContain(calAttempt)
    expect(attemptsOf(all, 'math')).toEqual(attemptsOf(base, 'math'))
    expect(attemptsOf(all, 'language')).toEqual(attemptsOf(base, 'language'))
  })

  it('handwritingMastery and handwritingAttempts keep only calig: rows', () => {
    const all = mixed()
    expect(Object.keys(handwritingMastery(all)).sort()).toEqual(['calig:letra:a', 'calig:palabra:casa'])
    const calAttempt = attempt({ skill: 'calig:letra:a', createdAt: daysAgo(1) })
    const base = mixedAttempts()
    const list = [calAttempt, ...base]
    expect(handwritingAttempts(list)).toEqual([calAttempt])
  })

  it('isHandwritingSkill recognises the calig: prefix only', () => {
    expect(isHandwritingSkill('calig:letra:a')).toBe(true)
    expect(isHandwritingSkill('mul:6x7')).toBe(false)
    expect(isHandwritingSkill('lng:gram:articulo')).toBe(false)
    expect(isHandwritingSkill('cal:weekday')).toBe(false)
    expect(isHandwritingSkill('cal:month')).toBe(false)
  })

  it('the handwriting setting is on by default', () => {
    expect(DEFAULT_CHILD_SETTINGS.handwriting).toBe(true)
    expect(child.settings.handwriting).toBe(true)
  })
})
