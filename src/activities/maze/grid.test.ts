/* The maze builder keeps its promise: from any path cell, the only right/down step that is a multiple of the table
   is the next path cell, and decoy multiples can never be reached by a right/down move. */
import { describe, expect, it } from 'vitest'
import { buildMaze } from './grid'

function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

function neighboursRightDown(cell: number, rows: number, cols: number): number[] {
  const r = Math.floor(cell / cols)
  const c = cell % cols
  const out: number[] = []
  if (c + 1 < cols) out.push(cell + 1)
  if (r + 1 < rows) out.push(cell + cols)
  return out
}

describe('buildMaze', () => {
  const shapes: Array<[number, number, number]> = [
    [6, 6, 6],
    [7, 5, 7],
    [8, 4, 6],
    [6, 3, 3],
  ]

  for (const [table, rows, cols] of shapes) {
    it(`${table}-table maze ${rows}x${cols}: only the path leads on from each cell`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const m = buildMaze(table, rows, cols, seeded(seed))
        const next = new Map<number, number>()
        m.path.forEach((cell, i) => {
          if (i < m.path.length - 1) next.set(cell, m.path[i + 1])
        })
        for (const [cell, step] of next) {
          for (const n of neighboursRightDown(cell, m.rows, m.cols)) {
            if (n === step) continue
            // A right/down neighbour that is not the next path cell must not be a multiple of the table.
            if (m.values[n] > 0) expect(m.values[n] % table).not.toBe(0)
          }
        }
      }
    })

    it(`${table}-table maze ${rows}x${cols}: decoys are never next to the path`, () => {
      for (let seed = 1; seed <= 40; seed++) {
        const m = buildMaze(table, rows, cols, seeded(seed))
        const onPath = new Set(m.path)
        const reach = new Set<number>()
        for (const cell of m.path) for (const n of neighboursRightDown(cell, m.rows, m.cols)) reach.add(n)
        for (let cell = 0; cell < m.rows * m.cols; cell++) {
          if (onPath.has(cell) || m.values[cell] === 0) continue
          if (m.values[cell] % table === 0) expect(reach.has(cell)).toBe(false)
        }
      }
    })
  }

  it('path cells between the two ends are multiples of the table, the ends carry no number', () => {
    const m = buildMaze(6, 6, 6, seeded(3))
    expect(m.values[m.path[0]]).toBe(0)
    expect(m.values[m.path[m.path.length - 1]]).toBe(0)
    for (const cell of m.path.slice(1, -1)) {
      expect(m.values[cell] % 6).toBe(0)
      expect(m.values[cell]).toBeGreaterThan(0)
    }
    expect(m.path.length).toBe(6 + 6 - 1)
  })
})
