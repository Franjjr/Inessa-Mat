/* Pure reading of a 10×10 times-table grid for grown-ups: one state per table, the tables to praise and the
   tables to review, and the one-sentence conclusion shown first on the home and the report. Every sentence is
   built from the grid, never typed by hand. */
import { factState, type FactState } from './heatmap'

export type TableState = 'mastered' | 'struggling' | 'learning' | 'unseen'

export const TABLE_STATE_LABEL: Record<TableState, string> = {
  mastered: 'Dominada',
  struggling: 'Repasar',
  learning: 'En curso',
  unseen: 'Sin practicar',
}

export interface TableReading {
  /** One entry per table 1..10. */
  tables: { n: number; state: TableState }[]
  /** Distinct facts (a ≤ b) that are mastered, 0..55. */
  mastered: number
  dominated: number[]
  toReview: number[]
  /** Facts to review, as "7 × 8", a ≤ b, in table order. */
  reviewFacts: string[]
  hasData: boolean
  headline: string
  support: string
}

const FACT_COUNT = 55

function factsOf(grid: number[][], n: number): FactState[] {
  return Array.from({ length: 10 }, (_, i) => factState(grid[n - 1]?.[i]))
}

/** Joins Spanish items: "2", "2 y 5", "2, 5 y 10". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/** " Para repasar: 7 × 8, 6 × 9 y 5 × 5 (y 2 más).", or the sentence that there is nothing to review. Shows three facts at most. */
export function reviewSentence(facts: string[]): string {
  if (facts.length === 0) return ' No hay multiplicaciones para repasar ahora.'
  const shown = facts.slice(0, 3)
  const more = facts.length - shown.length
  return ` Para repasar: ${joinList(shown)}${more > 0 ? ` (y ${more} más)` : ''}.`
}

/** "la tabla del 7", "las tablas del 2 y 5", or "4 tablas" when there are many. */
export function tableNoun(ns: number[]): string {
  if (ns.length === 1) return `la tabla del ${ns[0]}`
  if (ns.length <= 3) return `las tablas del ${joinList(ns.map(String))}`
  return `${ns.length} tablas`
}

export function readTables(grid: number[][], name: string): TableReading {
  const tables = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1
    const states = factsOf(grid, n)
    let state: TableState = 'unseen'
    if (states.every((s) => s === 'mastered')) state = 'mastered'
    else if (states.some((s) => s === 'struggling')) state = 'struggling'
    else if (states.some((s) => s === 'learning' || s === 'mastered')) state = 'learning'
    return { n, state }
  })

  const reviewFacts: string[] = []
  let mastered = 0
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) {
      const st = factState(grid[a - 1]?.[b - 1])
      if (st === 'mastered') mastered++
      if (st === 'struggling') reviewFacts.push(`${a} × ${b}`)
    }
  }

  const dominated = tables.filter((t) => t.state === 'mastered').map((t) => t.n)
  const toReview = tables.filter((t) => t.state === 'struggling').map((t) => t.n)
  const hasData = tables.some((t) => t.state !== 'unseen')

  let headline: string
  if (!hasData) headline = `Aún no hay datos de ${name}.`
  else if (dominated.length && toReview.length) headline = `${name} domina ${tableNoun(dominated)}; repasa ${tableNoun(toReview)}.`
  else if (dominated.length) headline = `${name} domina ${tableNoun(dominated)}.`
  else if (toReview.length) headline = `${name} está en camino. Conviene repasar ${tableNoun(toReview)}.`
  else headline = `${name} está en camino: ninguna tabla está dominada todavía.`

  let support: string
  if (!hasData) support = 'Cuando juegue, aquí verás qué tablas domina y cuáles conviene repasar.'
  else support = `Dominadas ${mastered} de ${FACT_COUNT} multiplicaciones.${reviewSentence(reviewFacts)}`

  return { tables, mastered, dominated, toReview, reviewFacts, hasData, headline, support }
}

/**
 * The class's hardest table: the one where the most (child, fact) pairs are to review, summed over the children, so a
 * single pupil's fact does not decide it alone. `count` is that number of pairs (ties: the smaller table).
 */
export function hardestTableAcross(grids: number[][][]): { n: number; count: number } | null {
  let best: { n: number; count: number } | null = null
  for (let n = 1; n <= 10; n++) {
    const count = grids.reduce((sum, grid) => sum + factsOf(grid, n).filter((s) => s === 'struggling').length, 0)
    if (count > 0 && (!best || count > best.count)) best = { n, count }
  }
  return best
}

/** How many facts a grid has to review (a ≤ b, 55 facts). */
export function struggleCount(grid: number[][]): number {
  let count = 0
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) if (factState(grid[a - 1]?.[b - 1]) === 'struggling') count++
  }
  return count
}
