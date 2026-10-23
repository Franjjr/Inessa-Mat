/* Informe del adulto: temario progress, mistakes by kind, placement runs and recall. */
import { describe, expect, it } from 'vitest'
import type { AttemptRecord, ErrorType, MasteryMap, SkillMastery } from '@/types'
import { GRADE3_SYLLABUS, teachingOrder } from '@/content/syllabus'
import { ERROR_GROUPS, errorGroupOf, errorReport, newMastery, placementRuns, recallReport, syllabusReport, PLACEMENT_ACTIVITY, PLACEMENT_COUNT } from '@/engine'

const now = new Date('2026-10-22T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000
const daysAgo = (d: number, extraMs = 0) => new Date(now.getTime() - d * DAY + extraMs).toISOString()

let n = 0
function attempt(over: Partial<AttemptRecord> & { createdAt: string }): AttemptRecord {
  n += 1
  return {
    id: `a${n}`, childId: 'c', sessionId: 's', skill: 'mul:6x7', kind: 'fact-mul', correct: true, given: '42', expected: '42',
    ms: 3000, inputMode: 'keypad', hintsUsed: 0, errorType: null, context: {}, ...over,
  }
}
const newestFirst = (list: AttemptRecord[]) => list.slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt))

describe('syllabusReport', () => {
  it('a new child: nothing mastered, the first topic is the current one and is «sin empezar»', () => {
    const r = syllabusReport(GRADE3_SYLLABUS, {})
    const first = teachingOrder(GRADE3_SYLLABUS).find((t) => t.status === 'disponible' && t.skills.length > 0)!
    expect(r.mastered).toBe(0)
    expect(r.available).toBeGreaterThan(10)
    expect(r.current?.topicName).toBe(first.name)
    const topic = r.blocks.flatMap((b) => b.topics).find((t) => t.id === first.id)!
    expect(topic).toMatchObject({ state: 'sin-empezar', current: true, progress: 0 })
    expect(r.current?.stage).toEqual({ number: 1, total: 8, term: 1, worldId: 'w1' })
  })

  it('mastered topics count, the next one is current, a seen one is «trabajando»', () => {
    const topics = teachingOrder(GRADE3_SYLLABUS).filter((t) => t.status === 'disponible' && t.skills.length > 0)
    const mastery: MasteryMap = {}
    const put = (skill: string, box: SkillMastery['box']) => {
      const m: SkillMastery = { ...newMastery(skill, now), box, attempts: 3, correct: 3 }
      mastery[skill] = m
    }
    for (const s of topics[0].skills) put(s, 3)
    put(topics[1].skills[0], 1)
    const r = syllabusReport(GRADE3_SYLLABUS, mastery)
    const all = r.blocks.flatMap((b) => b.topics)
    expect(all.find((t) => t.id === topics[0].id)!.state).toBe('dominado')
    expect(all.find((t) => t.id === topics[1].id)).toMatchObject({ state: 'trabajando', current: true })
    expect(r.mastered).toBe(1)
  })
})

describe('errorReport', () => {
  it('every error type has a group, and recognition is not a maths mistake', () => {
    const types: ErrorType[] = ['fact', 'carry-forgot', 'place-value', 'operation', 'clock-hour', 'geo-name', 'incomplete', 'other']
    expect(errorGroupOf('other')).toBe('otros')
    for (const t of types) expect(ERROR_GROUPS.map((g) => g.id)).toContain(errorGroupOf(t))
    expect(errorGroupOf('recognition')).toBeNull()
  })

  it('groups the last 30 days, compares with the 30 before and sorts by count', () => {
    const list = newestFirst([
      attempt({ createdAt: daysAgo(1), correct: false, errorType: 'carry-forgot' }),
      attempt({ createdAt: daysAgo(2), correct: false, errorType: 'carry-wrong' }),
      attempt({ createdAt: daysAgo(3), correct: false, errorType: 'carry-forgot' }),
      attempt({ createdAt: daysAgo(4), correct: false, errorType: 'fact' }),
      attempt({ createdAt: daysAgo(5), correct: false, errorType: 'recognition' }),
      attempt({ createdAt: daysAgo(6) }),
      attempt({ createdAt: daysAgo(40), correct: false, errorType: 'fact' }),
      attempt({ createdAt: daysAgo(41), correct: false, errorType: 'fact' }),
      attempt({ createdAt: daysAgo(90), correct: false, errorType: 'operation' }),
    ])
    const r = errorReport(list, now)
    expect(r.answered).toBe(5)
    expect(r.wrong).toBe(4)
    expect(r.groups.map((g) => g.id)).toEqual(['llevadas', 'tablas'])
    expect(r.groups[0]).toMatchObject({ count: 3, previous: 0, types: [{ errorType: 'carry-forgot', count: 2 }, { errorType: 'carry-wrong', count: 1 }] })
    expect(r.groups[1]).toMatchObject({ count: 1, previous: 2 })
  })

  it('a group that only had mistakes before still shows, at zero now', () => {
    const r = errorReport([attempt({ createdAt: daysAgo(35), correct: false, errorType: 'clock-hour' })], now)
    expect(r.groups).toEqual([expect.objectContaining({ id: 'reloj', count: 0, previous: 1 })])
  })
})

describe('placementRuns', () => {
  const run = (startDaysAgo: number, session: string, right: number) =>
    Array.from({ length: PLACEMENT_COUNT }, (_, i) => attempt({
      createdAt: daysAgo(startDaysAgo, i * 30_000), sessionId: session, skill: 'mul:6x7', correct: i < right,
      context: { activity: PLACEMENT_ACTIVITY },
    }))

  it('splits the runs by session, oldest first, and counts the blocks', () => {
    const list = newestFirst([...run(40, 's1', 8), ...run(2, 's2', 15), attempt({ createdAt: daysAgo(1), context: { activity: 'sesion' } })])
    const runs = placementRuns(list)
    expect(runs).toHaveLength(2)
    expect(runs[0]).toMatchObject({ answered: PLACEMENT_COUNT, correct: 8, complete: true })
    expect(runs[1]).toMatchObject({ correct: 15, startedAt: daysAgo(2) })
    expect(runs[1].blocks.find((b) => b.id === 'tablas')).toMatchObject({ correct: 15, total: PLACEMENT_COUNT })
  })

  it('a run left half way is not complete', () => {
    const runs = placementRuns(newestFirst(run(1, 's', 3).slice(0, 7)))
    expect(runs).toEqual([expect.objectContaining({ answered: 7, complete: false })])
  })
})

describe('recallReport', () => {
  it('counts a skill that comes back after two weeks, only when it was right the time before', () => {
    const list = newestFirst([
      attempt({ skill: 'mul:6x7', createdAt: daysAgo(30) }),
      attempt({ skill: 'mul:6x7', createdAt: daysAgo(10) }), // 20 days later, right: remembered
      attempt({ skill: 'mul:6x7', createdAt: daysAgo(9) }), // next day: practice, not memory
      attempt({ skill: 'mul:7x8', createdAt: daysAgo(40) }),
      attempt({ skill: 'mul:7x8', createdAt: daysAgo(5), correct: false, errorType: 'fact' }), // forgotten
      attempt({ skill: 'mul:8x9', createdAt: daysAgo(40), correct: false, errorType: 'fact' }),
      attempt({ skill: 'mul:8x9', createdAt: daysAgo(3) }), // was wrong before: not a recall check
      attempt({ skill: 'mul:6x9', createdAt: daysAgo(30) }),
      attempt({ skill: 'mul:6x9', createdAt: daysAgo(2), hintsUsed: 1 }), // needed a hint: not remembered
    ])
    expect(recallReport(list, now)).toEqual({ minDays: 14, checked: 3, remembered: 1 })
  })
})

describe('unclassified mistakes', () => {
  it('go to «otros», always after the named kinds', () => {
    const list = newestFirst([
      ...Array.from({ length: 5 }, (_, i) => attempt({ createdAt: daysAgo(1 + i), correct: false, errorType: null })),
      attempt({ createdAt: daysAgo(2), correct: false, errorType: 'fact' }),
    ])
    expect(errorReport(list, now).groups.map((g) => [g.id, g.count])).toEqual([['tablas', 1], ['otros', 5]])
  })
})
