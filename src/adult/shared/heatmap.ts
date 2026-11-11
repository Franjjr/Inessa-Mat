/* Pure model for the 10×10 times-table heatmap. Colour is never the only signal: every state also has a
   glyph and a Spanish label (see FactHeatmap). Box values follow the engine's Leitner boxes 0..5, -1 = unseen. */
import { MASTERED_BOX } from '@/content/syllabus'

export type FactState = 'unseen' | 'struggling' | 'learning' | 'mastered'

/**
 * The one definition of «dominada» in the adult area: the box at which the temario counts a skill as mastered
 * (MASTERED_BOX, two fluent answers). Box 1 is answered right once («En camino»); box 0 is failed or not yet
 * learnt («Hay que repasarla»).
 */
export function factState(box: number | null | undefined): FactState {
  if (box === null || box === undefined || Number.isNaN(box) || box < 0) return 'unseen'
  if (box >= MASTERED_BOX) return 'mastered'
  if (box < 1) return 'struggling'
  return 'learning'
}

export const FACT_STATE_LABEL: Record<FactState, string> = {
  unseen: 'Sin practicar',
  struggling: 'Hay que repasarla',
  learning: 'En camino',
  mastered: 'Dominada',
}

export const FACT_STATE_GLYPH: Record<FactState, string> = {
  unseen: '·',
  struggling: '!',
  learning: '↗',
  mastered: '✓',
}

/** What each state means, the same wording on every adult screen that shows the grid. */
export const FACT_STATE_NOTE = 'Dominada: la acierta con soltura, como cuenta el temario. En camino: ya la ha acertado, pero todavía no con soltura. Hay que repasarla: la ha fallado y aún no la tiene.'

/** Counts over the 55 distinct facts a × b with a ≤ b (the grid is symmetric). */
export function countFactStates(grid: number[][]): Record<FactState, number> {
  const counts: Record<FactState, number> = { unseen: 0, struggling: 0, learning: 0, mastered: 0 }
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) counts[factState(grid[a - 1]?.[b - 1])]++
  }
  return counts
}

/** For one fact of the class: how many children are in each state. */
export interface FactClassCount {
  mastered: number
  learning: number
  struggling: number
  unseen: number
  total: number
}

/** Per fact (10×10, symmetric), how many children of the class are in each state. A class is a count, never an average. */
export function classFactCounts(grids: number[][][]): FactClassCount[][] {
  return Array.from({ length: 10 }, (_, ai) =>
    Array.from({ length: 10 }, (_, bi) => {
      const c: FactClassCount = { mastered: 0, learning: 0, struggling: 0, unseen: 0, total: grids.length }
      for (const g of grids) c[factState(g[ai]?.[bi])]++
      return c
    }),
  )
}

/**
 * The state a class cell shows: «Dominada» when at least half of the class has it dominated, «Hay que repasarla» when
 * at least half is struggling, «En camino» when someone is working on it, else «Sin practicar». Counts are on the cell.
 */
export function classFactState(c: FactClassCount): FactState {
  if (c.mastered > 0 && c.mastered * 2 >= c.total) return 'mastered'
  if (c.struggling > 0 && c.struggling * 2 >= c.total) return 'struggling'
  if (c.mastered + c.learning + c.struggling > 0) return 'learning'
  return 'unseen'
}

/** «3 de 12 alumnos lo dominan, 4 lo repasan, 2 lo tienen en camino y 3 no lo han practicado». */
export function classFactSentence(c: FactClassCount, a: number, b: number): string {
  const n = c.total
  const plural = (k: number) => (k === 1 ? 'alumno' : 'alumnos')
  return `${a} × ${b} = ${a * b}: ${c.mastered} de ${n} ${plural(n)} lo dominan, ${c.struggling} lo repasan, ${c.learning} lo tienen en camino y ${c.unseen} no lo han practicado`
}

/** Share of the 55 distinct facts that are mastered, 0..1. */
export function masteredShare(grid: number[][]): number {
  return countFactStates(grid).mastered / 55
}
