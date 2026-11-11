/* Pure reading of the class screen: the totals under the class heatmap and the two lines each pupil gets (what they fail
   most, and what to review). Kept apart from ClassScreen so the sentences can be tested without the page. */
import { describeError } from '@/engine'
import type { ErrorType } from '@/types'
import { classFactState, type FactClassCount } from '../shared/heatmap'
import { readTables, reviewSentence } from '../shared/reading'

/** What the class view says in its hint: how many distinct facts half of the class or more has in each state. */
export function classSummary(counts: FactClassCount[][]): { mastered: number; struggling: number; unseen: number } {
  const out = { mastered: 0, struggling: 0, unseen: 0 }
  for (let a = 0; a < 10; a++) {
    for (let b = a; b < 10; b++) {
      const state = classFactState(counts[a][b])
      if (state === 'mastered') out.mastered++
      else if (state === 'struggling') out.struggling++
      else if (state === 'unseen') out.unseen++
    }
  }
  return out
}

/** «Falla más en: Tablas y cálculo básico (3) · Llevadas (1)», or null when there is no mistake to show. «No lo sé» is
    a casilla still to learn, not a mistake, so it never makes the list. At most two kinds. */
export function failsMostLine(topErrors: readonly { errorType: string; count: number }[]): string | null {
  const errors = topErrors.filter((e) => e.errorType !== 'dont-know').slice(0, 2)
  if (errors.length === 0) return null
  return `Falla más en: ${errors.map((e) => `${describeError(e.errorType as ErrorType)} (${e.count})`).join(' · ')}`
}

/** The pupil's review sentence without its leading space: «Para repasar: 7 × 8, 6 × 9 y 5 × 5 (y 2 más).», or that there is nothing to review. */
export function pupilReviewLine(grid: number[][], nickname: string): string {
  return reviewSentence(readTables(grid, nickname).reviewFacts).trim()
}

/** Shown under the class heatmap: a cell is «En camino» as soon as one pupil works on it, and the number says how many master it. */
export const CLASS_CELL_NOTE = 'Una casilla aparece «En camino» aunque solo la trabaje un alumno. El número de cada casilla dice cuántos la dominan.'
