/* Maze builder (pure). A monotone path (right / down) runs from the unicorn at the top-left to the gem at the
   bottom-right. Every cell on the path, except the two ends, is a multiple of `table`; every other cell is not,
   except a few "decoy" multiples placed where they can never be reached by a right/down move. The only legal next
   step from any path cell is therefore the next path cell. */
import type { Rng } from '@/types'

export interface Maze {
  table: number
  rows: number
  cols: number
  /** Row-major cell values. The two ends (0 and the last cell) carry no number. */
  values: number[]
  /** Cell indexes of the path, from the unicorn (0) to the gem (last). */
  path: number[]
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildMaze(table: number, rows: number, cols: number, rng: Rng): Maze {
  const R = Math.max(2, Math.floor(rows))
  const C = Math.max(2, Math.floor(cols))
  const idx = (r: number, c: number) => r * C + c
  const moves = shuffled([...Array<string>(R - 1).fill('D'), ...Array<string>(C - 1).fill('R')], rng)
  const path = [0]
  let r = 0
  let c = 0
  for (const m of moves) {
    if (m === 'D') r++
    else c++
    path.push(idx(r, c))
  }
  const goal = R * C - 1
  const onPath = new Set(path)
  const values: number[] = Array(R * C).fill(0)

  // Multiples on the path: table × k with k in 1..10 (distinct while possible).
  const ks = shuffled(Array.from({ length: 10 }, (_, i) => i + 1), rng)
  const inner = path.slice(1, -1)
  inner.forEach((cell, i) => {
    values[cell] = table * (i < ks.length ? ks[i] : 1 + Math.floor(rng() * 10))
  })

  // Everything else: a non-multiple of the table.
  const reach = new Set<number>()
  for (const cell of path) {
    const cr = Math.floor(cell / C)
    const cc = cell % C
    if (cc + 1 < C) reach.add(idx(cr, cc + 1))
    if (cr + 1 < R) reach.add(idx(cr + 1, cc))
  }
  for (let cell = 0; cell < R * C; cell++) {
    if (onPath.has(cell)) continue
    let v = 1 + Math.floor(rng() * table * 10)
    let guard = 0
    while (v % table === 0 && guard++ < 50) v = 1 + Math.floor(rng() * table * 10)
    if (v % table === 0) v = v + 1
    values[cell] = v
  }

  // Decoys: multiples that are not reachable from the path (they sit behind it).
  const decoyPool = [...Array(R * C).keys()].filter((cell) => !onPath.has(cell) && !reach.has(cell) && cell !== 0 && cell !== goal)
  const decoys = shuffled(decoyPool, rng).slice(0, Math.min(2, Math.max(0, Math.floor(decoyPool.length / 6))))
  decoys.forEach((cell, i) => {
    values[cell] = table * (1 + ((i * 3 + 4) % 10))
  })

  return { table, rows: R, cols: C, values, path }
}
