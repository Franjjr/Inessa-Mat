/* The adult report for English: the words learnt by theme, the words that fail with what the child wrote, the numbers and
   the operations mastered, the prueba inicial, the minutes of the week, the plain labels of its skills and the error types
   of its answers. The maths and Lengua readers stay the same with English rows around. */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ErrorType, MasteryMap, SessionRecord, SkillMastery } from '@/types'
import { INGLES3_SYLLABUS, allTopics } from '@/content/syllabus'
import { ENGLISH_WORDS } from '../ingles/words'
import {
  ENGLISH_PLACEMENT_ACTIVITY, ENGLISH_PLACEMENT_COUNT, PLACEMENT_ACTIVITY, checkEnglish, describeError, describeSkill,
  englishPlacementBlockOf, englishWordsReport, errorGroupOf, errorReport, minutesOfSubject, newMastery, placementRuns,
} from '@/engine'
import type { EngNumListenExercise, EngOpListenExercise, EngWriteWordExercise, EnglishExercise } from '@/types'
import { ENGLISH_SKILL_TEXT } from '../describe'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const daysAgo = (d: number, extraMs = 0) => new Date(now.getTime() - d * DAY + extraMs).toISOString()

let n = 0
function attempt(over: Partial<AttemptRecord> & { createdAt: string }): AttemptRecord {
  n += 1
  return {
    id: `er${n}`, childId: 'c', sessionId: 's', skill: 'eng:voc:animales', kind: 'eng-write-word', correct: true, given: '', expected: '',
    ms: 3000, inputMode: 'keyboard', hintsUsed: 0, errorType: null, context: {}, ...over,
  }
}

function mastery(skill: string, box: SkillMastery['box']): SkillMastery {
  return { ...newMastery(skill, now), box, attempts: 4, correct: 3, dueAt: daysAgo(1), lastSeenAt: daysAgo(2) }
}

function masteryMap(entries: [string, SkillMastery['box']][]): MasteryMap {
  return Object.fromEntries(entries.map(([skill, box]) => [skill, mastery(skill, box)]))
}

describe('English words report', () => {
  it('lists the words of a theme as learnt when its skill is mastered, and nothing else', () => {
    const map = masteryMap([['eng:voc:animales', 2], ['eng:voc:colores', 1]])
    const r = englishWordsReport([], map)
    const animals = ENGLISH_WORDS.filter((w) => w.theme === 'animales').map((w) => w.en)
    expect(r.learnt.animales).toEqual(animals)
    expect(r.learnt.colores).toEqual([])
    expect(r.learnt.saludos).toEqual([])
    // Every theme has a list, even an empty one.
    expect(Object.keys(r.learnt)).toHaveLength(11)
  })

  it('reports the failing words from mixed attempts, with what the child wrote', () => {
    const list: AttemptRecord[] = [
      attempt({ id: 'w1', expected: 'three', correct: false, given: 'tre', errorType: 'eng-spelling', createdAt: daysAgo(1) }),
      attempt({ id: 'w2', expected: 'three', correct: true, given: 'three', createdAt: daysAgo(2) }),
      attempt({ id: 'd1', expected: 'dog', correct: true, given: 'dog', createdAt: daysAgo(3) }),
      attempt({ id: 'd2', expected: 'dog', correct: false, given: 'dgo', errorType: 'eng-spelling', createdAt: daysAgo(4) }),
      attempt({ id: 'd3', expected: 'dog', correct: true, given: 'dog', createdAt: daysAgo(5) }),
      // A retry row does not grade, and a listening or maths row is not a typed word.
      attempt({ id: 'r1', expected: 'three', correct: true, given: 'three', graded: false, createdAt: daysAgo(0.5) }),
      attempt({ id: 'l1', kind: 'eng-listen-pick', expected: 'cat', correct: false, given: '1', createdAt: daysAgo(1) }),
      attempt({ id: 'm1', skill: 'mul:6x7', kind: 'fact-mul', expected: 'cat', correct: false, given: '40', createdAt: daysAgo(1) }),
      // Only the last two first answers count: this wrong one is the third.
      attempt({ id: 'f1', expected: 'fish', correct: true, given: 'fish', createdAt: daysAgo(1) }),
      attempt({ id: 'f2', expected: 'fish', correct: true, given: 'fish', createdAt: daysAgo(2) }),
      attempt({ id: 'f3', expected: 'fish', correct: false, given: 'fsh', errorType: 'eng-spelling', createdAt: daysAgo(3) }),
    ]
    const r = englishWordsReport(list, {})
    expect(r.failing).toEqual([
      { word: 'three', given: ['tre'] },
      { word: 'dog', given: ['dgo'] },
    ])
  })

  it('reads the numbers and operations mastered: up to 100 after 21 to 100, up to 20 after 0 to 20', () => {
    expect(englishWordsReport([], masteryMap([['eng:num:0-20', 2], ['eng:num:ops:plus', 2], ['eng:num:ops:times', 1]]))).toMatchObject({
      numbers: { upTo: 20, ops: ['plus'] },
    })
    expect(englishWordsReport([], masteryMap([['eng:num:0-20', 2], ['eng:num:21-100', 3]]))).toMatchObject({ numbers: { upTo: 100, ops: [] } })
    expect(englishWordsReport([], {})).toMatchObject({ numbers: { upTo: 0, ops: [] } })
  })

  it('ignores the maths and Lengua rows', () => {
    const map = masteryMap([['lng:voc:sinonimos', 2], ['mul:6x7', 2]])
    const list = [attempt({ skill: 'lng:voc:sinonimos', expected: 'cat', correct: false, given: 'gat', createdAt: daysAgo(1) })]
    expect(englishWordsReport(list, map)).toEqual(englishWordsReport([], {}))
  })
})

describe('English mistakes and the placement', () => {
  it('every new English error type has a group of its own and a plain text', () => {
    const types: ErrorType[] = ['eng-spelling', 'eng-near-miss', 'eng-listening', 'eng-number']
    for (const t of types) {
      expect(t.length).toBeLessThanOrEqual(32)
      expect(describeError(t)).not.toBe(t)
      expect(errorGroupOf(t, 'english')).toMatch(/^ingles-/)
    }
  })

  it('the English error report reads English rows only, and the maths one ignores them', () => {
    const list = [
      attempt({ expected: 'cat', correct: false, given: 'gat', errorType: 'eng-near-miss', createdAt: daysAgo(1) }),
      attempt({ skill: 'mul:6x7', kind: 'fact-mul', expected: '42', correct: false, given: '40', errorType: 'fact', createdAt: daysAgo(1) }),
    ]
    const english = errorReport(list, now, 30, 'english')
    expect(english.groups.map((g) => g.id)).toEqual(['ingles-escritura'])
    expect(english.wrong).toBe(1)
    const maths = errorReport(list, now)
    expect(maths.groups.map((g) => g.id)).toEqual(['tablas'])
  })

  it('reads the English placement runs by their five blocks, not the maths ones', () => {
    const list = [
      attempt({ skill: 'eng:voc:colores', kind: 'eng-match', sessionId: 'pi', correct: true, context: { activity: ENGLISH_PLACEMENT_ACTIVITY }, createdAt: daysAgo(2) }),
      attempt({ skill: 'eng:num:0-20', kind: 'eng-num-write', sessionId: 'pi', correct: false, context: { activity: ENGLISH_PLACEMENT_ACTIVITY }, createdAt: daysAgo(2, 1000) }),
      attempt({ skill: 'mul:6x7', kind: 'fact-mul', sessionId: 'pm', correct: false, context: { activity: PLACEMENT_ACTIVITY }, createdAt: daysAgo(2) }),
    ]
    const runs = placementRuns(list, 'english')
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ answered: 2, correct: 1, complete: false })
    expect(runs[0].blocks.find((b) => b.id === 'colores')).toMatchObject({ correct: 1, total: 1 })
    expect(runs[0].blocks.find((b) => b.id === 'numeros')).toMatchObject({ correct: 0, total: 1 })
    expect(placementRuns(list)).toHaveLength(1)
    expect(placementRuns(list)[0].answered).toBe(1)
    expect(ENGLISH_PLACEMENT_COUNT).toBe(10)
    expect(englishPlacementBlockOf('eng:frase:its-a')).toBe('animales')
    expect(englishPlacementBlockOf('mul:6x7')).toBeNull()
  })

  it('the minutes of the week count the English sessions only', () => {
    const sessions = [
      { minutes: 10, summary: { subject: 'english' } },
      { minutes: 12, summary: { subject: 'language' } },
      { minutes: 7, summary: null },
    ] as unknown as Pick<SessionRecord, 'summary' | 'minutes'>[]
    expect(minutesOfSubject(sessions, 'english')).toBe(10)
  })
})

describe('English skill labels', () => {
  const skills = allTopics(INGLES3_SYLLABUS).flatMap((t) => t.skills)

  it('every English skill of the temario has a plain adult label, with no raw key in it', () => {
    expect(skills.length).toBeGreaterThan(0)
    for (const skill of skills) {
      expect(ENGLISH_SKILL_TEXT[skill], skill).toBeTruthy()
      expect(describeSkill(skill)).toBe(ENGLISH_SKILL_TEXT[skill])
      expect(describeSkill(skill)).not.toMatch(/^Inglés,|eng:|ops \(|where-is/)
    }
    expect(describeSkill('eng:num:ops:plus')).toBe('Sumas (plus)')
    expect(describeSkill('eng:frase:where-is:in')).toBe('Dónde está algo: dentro de (in)')
  })
})

describe('English answers carry the error type of their mistake', () => {
  const typed = (over: Partial<EngWriteWordExercise>): EngWriteWordExercise => ({
    id: 'x', kind: 'eng-write-word', skill: 'eng:voc:animales', difficulty: 1, card: { en: 'three', es: 'tres', theme: 'animales' },
    answer: 'three', alts: [], ...over,
  })

  it('a typed word one letter away is eng-near-miss, any other wrong word is eng-spelling', () => {
    const ex: EnglishExercise = typed({})
    expect(checkEnglish(ex, { type: 'text', value: 'tree' })).toMatchObject({ correct: false, errorType: 'eng-near-miss', given: 'tree' })
    expect(checkEnglish(ex, { type: 'text', value: 'cat' })).toMatchObject({ correct: false, errorType: 'eng-spelling', given: 'cat' })
    expect(checkEnglish(ex, { type: 'text', value: 'three' })).toMatchObject({ correct: true })
  })

  it('a wrong number heard is eng-listening, a wrong result of a spoken operation is eng-number', () => {
    const heard: EngNumListenExercise = { id: 'n', kind: 'eng-num-listen', skill: 'eng:num:0-20', difficulty: 1, value: 7, spoken: 'seven', answer: 7 }
    const op: EngOpListenExercise = { id: 'o', kind: 'eng-op-listen', skill: 'eng:num:ops:plus', difficulty: 1, a: 3, op: '+', b: 4, spoken: 'three plus four', answer: 7 }
    expect(checkEnglish(heard, { type: 'number', value: 6 })).toMatchObject({ correct: false, errorType: 'eng-listening' })
    expect(checkEnglish(op, { type: 'number', value: 6 })).toMatchObject({ correct: false, errorType: 'eng-number' })
  })

  it('a wrong picture heard is eng-listening', () => {
    const pick: EnglishExercise = {
      id: 'p', kind: 'eng-listen-pick', skill: 'eng:voc:animales', difficulty: 1, word: 'cat', theme: 'animales',
      cards: [{ en: 'cat', es: 'gato', theme: 'animales' }, { en: 'dog', es: 'perro', theme: 'animales' }], answer: 0,
    }
    expect(checkEnglish(pick, { type: 'choice', index: 1 })).toMatchObject({ correct: false, errorType: 'eng-listening' })
  })
})
