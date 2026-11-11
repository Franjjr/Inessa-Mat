import { describe, expect, it } from 'vitest'
import { classFactCounts, classFactState, countFactStates, factState } from './heatmap'
import { formatMinutes, formatPercent, formatRelative, plural } from './format'
import { errorMessage } from './messages'
import { ASSIGNMENT_PRESETS, presetSelector } from '../school/presets'

const emptyGrid = () => Array.from({ length: 10 }, () => Array(10).fill(-1) as number[])

describe('heatmap model', () => {
  it('uses one definition of «dominada»: the temario box (2) or more', () => {
    expect(factState(-1)).toBe('unseen')
    expect(factState(0)).toBe('struggling')
    expect(factState(1)).toBe('learning')
    expect(factState(2)).toBe('mastered')
    expect(factState(5)).toBe('mastered')
  })

  it('counts the 55 distinct facts once', () => {
    const grid = emptyGrid()
    grid[5][6] = 5
    grid[6][5] = 5
    const counts = countFactStates(grid)
    expect(counts.mastered).toBe(1)
    expect(counts.unseen).toBe(54)
    expect(counts.mastered + counts.unseen + counts.learning + counts.struggling).toBe(55)
  })

  it('counts how many children are in each state per fact, never an average', () => {
    const a = emptyGrid()
    const b = emptyGrid()
    const c = emptyGrid()
    a[0][0] = 4
    b[0][0] = 2
    c[0][0] = 0
    b[1][1] = 1
    const counts = classFactCounts([a, b, c])
    expect(counts[0][0]).toEqual({ mastered: 2, learning: 0, struggling: 1, unseen: 0, total: 3 })
    expect(counts[1][1]).toEqual({ mastered: 0, learning: 1, struggling: 0, unseen: 2, total: 3 })
    expect(counts[2][2].unseen).toBe(3)
  })

  it('shows a class fact as dominated only when at least half of the class has it', () => {
    expect(classFactState({ mastered: 1, learning: 0, struggling: 0, unseen: 11, total: 12 })).toBe('learning')
    expect(classFactState({ mastered: 6, learning: 0, struggling: 0, unseen: 6, total: 12 })).toBe('mastered')
    expect(classFactState({ mastered: 3, learning: 1, struggling: 4, unseen: 4, total: 12 })).toBe('learning')
    expect(classFactState({ mastered: 2, learning: 0, struggling: 6, unseen: 4, total: 12 })).toBe('struggling')
    expect(classFactState({ mastered: 0, learning: 0, struggling: 0, unseen: 12, total: 12 })).toBe('unseen')
  })
})

describe('format helpers', () => {
  it('formats minutes, percentages and plurals in Spanish', () => {
    expect(formatMinutes(0)).toBe('0 min')
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(125)).toBe('2 h 5 min')
    expect(formatPercent(null)).toBe('Sin datos')
    expect(formatPercent(0.834)).toBe('83 %')
    expect(plural(1, 'perfil', 'perfiles')).toBe('1 perfil')
    expect(plural(3, 'perfil', 'perfiles')).toBe('3 perfiles')
  })

  it('describes when a child last played', () => {
    const now = new Date(2026, 9, 22, 12)
    expect(formatRelative(null, now)).toBe('Todavía no ha jugado')
    expect(formatRelative(new Date(2026, 9, 22, 8).toISOString(), now)).toBe('hoy')
    expect(formatRelative(new Date(2026, 9, 21, 20).toISOString(), now)).toBe('ayer')
    expect(formatRelative(new Date(2026, 9, 19, 20).toISOString(), now)).toBe('hace 3 días')
  })
})

describe('messages', () => {
  it('shows DataError text and hides other errors behind a fallback', () => {
    const data = Object.assign(new Error('Texto para el adulto'), { name: 'DataError' })
    expect(errorMessage(data)).toBe('Texto para el adulto')
    expect(errorMessage(new Error('secreto técnico'), 'Algo ha fallado')).toBe('Algo ha fallado')
  })
})

describe('assignment presets', () => {
  it('every preset resolves to at least one valid engine skill', () => {
    for (const p of ASSIGNMENT_PRESETS) {
      const selector = presetSelector(p.id)
      expect(selector, p.id).not.toBeNull()
      expect(selector!.skills!.length, p.id).toBeGreaterThan(0)
    }
  })
})
