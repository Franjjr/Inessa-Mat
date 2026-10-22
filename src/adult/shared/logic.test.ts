import { describe, expect, it } from 'vitest'
import { averageGrid, countFactStates, factState } from './heatmap'
import { formatMinutes, formatPercent, formatRelative, plural } from './format'
import { errorMessage } from './messages'
import { ASSIGNMENT_PRESETS, presetSelector } from '../school/presets'

const emptyGrid = () => Array.from({ length: 10 }, () => Array(10).fill(-1) as number[])

describe('heatmap model', () => {
  it('maps Leitner boxes to four states', () => {
    expect(factState(-1)).toBe('unseen')
    expect(factState(0)).toBe('struggling')
    expect(factState(1)).toBe('struggling')
    expect(factState(2)).toBe('learning')
    expect(factState(4)).toBe('learning')
    expect(factState(5)).toBe('mastered')
    expect(factState(4.5)).toBe('mastered')
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

  it('averages only the children who practised a fact', () => {
    const a = emptyGrid()
    const b = emptyGrid()
    a[0][0] = 4
    b[0][0] = 2
    b[1][1] = 5
    const avg = averageGrid([a, b])
    expect(avg[0][0]).toBe(3)
    expect(avg[1][1]).toBe(5)
    expect(avg[2][2]).toBe(-1)
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
