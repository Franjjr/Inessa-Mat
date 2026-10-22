/* Pure model for the 10×10 times-table heatmap. Colour is never the only signal: every state also has a
   glyph and a Spanish label (see FactHeatmap). Box values follow the engine's Leitner boxes 0..5, -1 = unseen. */

export type FactState = 'unseen' | 'struggling' | 'learning' | 'mastered'

/** Thresholds work for whole boxes and for averages across children (class view). */
export function factState(box: number | null | undefined): FactState {
  if (box === null || box === undefined || Number.isNaN(box) || box < 0) return 'unseen'
  if (box >= 4.5) return 'mastered'
  if (box <= 1.5) return 'struggling'
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

/** Counts over the 55 distinct facts a × b with a ≤ b (the grid is symmetric). */
export function countFactStates(grid: number[][]): Record<FactState, number> {
  const counts: Record<FactState, number> = { unseen: 0, struggling: 0, learning: 0, mastered: 0 }
  for (let a = 1; a <= 10; a++) {
    for (let b = a; b <= 10; b++) counts[factState(grid[a - 1]?.[b - 1])]++
  }
  return counts
}

/** Average box per fact over several children; -1 where nobody has practised it yet. */
export function averageGrid(grids: number[][][]): number[][] {
  return Array.from({ length: 10 }, (_, ai) =>
    Array.from({ length: 10 }, (_, bi) => {
      let sum = 0
      let seen = 0
      for (const g of grids) {
        const v = g[ai]?.[bi] ?? -1
        if (v >= 0) {
          sum += v
          seen++
        }
      }
      return seen === 0 ? -1 : Math.round((sum / seen) * 10) / 10
    }),
  )
}

/** Share of the 55 distinct facts that are mastered, 0..1. */
export function masteredShare(grid: number[][]): number {
  return countFactStates(grid).mastered / 55
}
