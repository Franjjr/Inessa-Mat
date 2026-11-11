import { describe, expect, it } from 'vitest'
import { describeError } from '@/engine'
import { classFactCounts } from '../shared/heatmap'
import { classSummary, failsMostLine, practisedThisWeek, pupilReviewLine, pupilWeekLine, weekSentence } from './classView'

/** A 10×10 grid with every fact unseen (-1), then the boxes given as [a, b, box] (a × b, 1..10). */
function gridWith(...facts: [number, number, number][]): number[][] {
  const g = Array.from({ length: 10 }, () => Array<number>(10).fill(-1))
  for (const [a, b, box] of facts) {
    g[a - 1][b - 1] = box
    g[b - 1][a - 1] = box
  }
  return g
}

describe('classSummary: the totals under the class heatmap', () => {
  it('counts the facts that half of the class or more has in each state', () => {
    const grids = [
      gridWith([7, 8, 2], [3, 4, 0]),
      gridWith([7, 8, 2], [5, 5, 1]),
    ]
    // 7 × 8: both dominate it. 3 × 4: one struggles, which is half the class. 5 × 5 is only on the way, so it is neither unseen nor a majority.
    expect(classSummary(classFactCounts(grids))).toEqual({ mastered: 1, struggling: 1, unseen: 52 })
  })

  it('does not count a fact that only one child of a bigger class dominates', () => {
    const grids = [gridWith([6, 9, 2]), gridWith(), gridWith(), gridWith()]
    expect(classSummary(classFactCounts(grids)).mastered).toBe(0)
  })
})

describe('failsMostLine: what each pupil fails most', () => {
  it('shows the two most frequent kinds, and never «No lo sé»', () => {
    const line = failsMostLine([
      { errorType: 'dont-know', count: 9 },
      { errorType: 'carry-forgot', count: 3 },
      { errorType: 'fact', count: 1 },
      { errorType: 'carry-forgot', count: 0 },
    ])
    expect(line).toBe(`Falla más en: ${describeError('carry-forgot')} (3) · ${describeError('fact')} (1)`)
    expect(line).not.toContain(describeError('dont-know'))
  })

  it('shows nothing when the only errors are «No lo sé»', () => {
    expect(failsMostLine([{ errorType: 'dont-know', count: 4 }])).toBeNull()
    expect(failsMostLine([])).toBeNull()
  })
})

describe('pupilReviewLine: the review sentence of a pupil', () => {
  it('lists the facts to review in table order, without the leading space', () => {
    const grid = gridWith([7, 8, 0], [6, 9, 0], [2, 2, 3])
    expect(pupilReviewLine(grid, 'Lía')).toBe('Para repasar: 6 × 9 y 7 × 8.')
  })

  it('says there is nothing to review when no fact is struggling', () => {
    expect(pupilReviewLine(gridWith([2, 2, 3]), 'Lía')).toBe('No hay multiplicaciones para repasar ahora.')
  })
})

describe('the week of the class: any subject counts as practice', () => {
  const lenguaOnly = { minutesLast7Days: 0, weekBySubject: { language: { minutes: 8, attempts: 14 } } }
  const mathsAndCalig = { minutesLast7Days: 12, weekBySubject: { math: { minutes: 12, attempts: 20 }, handwriting: { minutes: 0, attempts: 3 } } }
  const nothing = { minutesLast7Days: 0, weekBySubject: {} }

  it('a pupil who only did Lengua has practised this week', () => {
    expect(practisedThisWeek(lenguaOnly)).toBe(true)
    expect(practisedThisWeek(nothing)).toBe(false)
  })

  it('the class sentence counts every subject when the server sends them', () => {
    expect(weekSentence([lenguaOnly, mathsAndCalig])).toBe('Todos han practicado esta semana.')
    expect(weekSentence([lenguaOnly, nothing])).toBe('Esta semana, 1 alumno no ha practicado.')
    expect(weekSentence([nothing, nothing])).toBe('Esta semana, 2 alumnos no han practicado.')
  })

  it('without the activity of every subject (server without 0006) it speaks of maths only', () => {
    const mathsOnly = [{ minutesLast7Days: 0 }, { minutesLast7Days: 5 }]
    expect(practisedThisWeek(mathsOnly[0])).toBe(false)
    expect(weekSentence(mathsOnly)).toBe('Esta semana, 1 alumno no ha practicado matemáticas.')
    expect(weekSentence([{ minutesLast7Days: 5 }])).toBe('Todos han practicado matemáticas esta semana.')
    // One pupil without the detail is enough to keep the maths wording for the whole class.
    expect(weekSentence([lenguaOnly, { minutesLast7Days: 0 }])).toBe('Esta semana, 2 alumnos no han practicado matemáticas.')
  })

  it('each pupil line lists the subjects played, in a fixed order', () => {
    expect(pupilWeekLine(mathsAndCalig)).toBe('Esta semana: Matemáticas 12 min · Caligrafía menos de 1 min')
    expect(pupilWeekLine(lenguaOnly)).toBe('Esta semana: Lengua 8 min')
    expect(pupilWeekLine(nothing)).toBe('Sin practicar esta semana')
    expect(pupilWeekLine({ minutesLast7Days: 7 })).toBe('7 min de matemáticas esta semana')
  })
})
