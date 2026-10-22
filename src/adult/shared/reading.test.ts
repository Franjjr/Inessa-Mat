import { describe, expect, it } from 'vitest'
import { hardestTable, readTables, struggleCount, tableNoun } from './reading'

/** Symmetric grid with every fact unseen (-1) except the ones set here. */
function grid(set: [number, number, number][]): number[][] {
  const g = Array.from({ length: 10 }, () => Array(10).fill(-1) as number[])
  for (const [a, b, box] of set) {
    g[a - 1]![b - 1] = box
    g[b - 1]![a - 1] = box
  }
  return g
}

const ALL_2 = Array.from({ length: 10 }, (_, i) => [2, i + 1, 5] as [number, number, number])
const ALL_5 = Array.from({ length: 10 }, (_, i) => [5, i + 1, 5] as [number, number, number])

describe('readTables', () => {
  it('states a table as dominated only when all its facts are mastered', () => {
    const r = readTables(grid([...ALL_2, [5, 1, 5]]), 'Lía')
    expect(r.tables.find((t) => t.n === 2)?.state).toBe('mastered')
    expect(r.tables.find((t) => t.n === 5)?.state).toBe('learning')
    expect(r.dominated).toEqual([2])
  })

  it('lists the facts to review once, with a ≤ b, and counts distinct mastered facts out of 55', () => {
    const r = readTables(grid([[7, 8, 0], [9, 6, 1], [2, 2, 5]]), 'Lía')
    expect(r.reviewFacts).toEqual(['6 × 9', '7 × 8'])
    expect(r.toReview).toEqual([6, 7, 8, 9])
    expect(r.mastered).toBe(1)
  })

  it('writes the conclusion from the data, with the child name', () => {
    const r = readTables(grid([...ALL_2, ...ALL_5, [7, 7, 0]]), 'Lía')
    expect(r.headline).toBe('Lía domina las tablas del 2 y 5; repasa la tabla del 7.')
    expect(r.support).toContain('Dominadas 19 de 55 multiplicaciones.')
    expect(r.support).toContain('Para repasar: 7 × 7.')
  })

  it('says so when there is no data yet', () => {
    const r = readTables(grid([]), 'Lía')
    expect(r.hasData).toBe(false)
    expect(r.headline).toBe('Aún no hay datos de Lía.')
  })

  it('summarises extra facts to review as "y N más"', () => {
    const r = readTables(grid([[1, 1, 0], [2, 2, 0], [3, 3, 0], [4, 4, 0]]), 'Mateo')
    expect(r.support).toContain('Para repasar: 1 × 1, 2 × 2 y 3 × 3 (y 1 más).')
  })
})

describe('tableNoun and hardestTable', () => {
  it('uses singular and plural forms', () => {
    expect(tableNoun([7])).toBe('la tabla del 7')
    expect(tableNoun([2, 5])).toBe('las tablas del 2 y 5')
    expect(tableNoun([1, 2, 3, 4])).toBe('4 tablas')
  })

  it('finds the table with most facts to review', () => {
    const g = grid([[7, 1, 0], [7, 2, 0], [3, 3, 0]])
    expect(hardestTable(g)).toBe(7)
    expect(hardestTable(grid([]))).toBeNull()
    expect(struggleCount(g)).toBe(3)
  })
})
