/* The method lines of the child's report for division and for the tables tricks (pure, testable). Same rules as the
   subtraction line (subtractionReport.ts): the last 30 days, a method is ranked only with MIN_ATTEMPTS_TO_RANK
   attempts, and the favourite is named even before any attempt. */
import { methodLabel, METHODS, type MethodOp } from '@/engine'
import type { ChildSummary } from '@/types'
import { MIN_ATTEMPTS_TO_RANK } from './subtractionReport'

type Tally = { method: string; attempts: number; correct: number }

const TITLE: Record<Exclude<MethodOp, 'sub'>, string> = { div: 'División', tables: 'Tablas' }

/** One line: the favourite, and the results per method (only the methods the child has used, in registry order). */
export function methodReportLine(op: Exclude<MethodOp, 'sub'>, preferred: string | null, byMethod: Tally[]): string {
  const title = TITLE[op]
  const favourite = preferred ? `prefiere «${methodLabel(op, preferred)}»` : op === 'tables' ? 'todavía no ha elegido un truco favorito' : 'todavía no ha elegido un método favorito'
  const ids = METHODS[op].map((m) => m.id)
  const used = ids
    .map((id) => byMethod.find((b) => b.method === id))
    .filter((b): b is Tally => !!b && b.attempts > 0)
  if (used.length === 0) return `${title}: ${favourite}. Todavía no hay ejercicios hechos con cada método.`
  const parts = used.map((b) => `${methodLabel(op, b.method)}: ${b.correct} de ${b.attempts} (${Math.round((b.correct / b.attempts) * 100)} %)`)
  const ranked = used.filter((b) => b.attempts >= MIN_ATTEMPTS_TO_RANK)
  const best = ranked.reduce<Tally | null>((top, b) => {
    if (!top) return b
    const rb = b.correct / b.attempts
    const rt = top.correct / top.attempts
    return rb > rt || (rb === rt && b.method === preferred) ? b : top
  }, null)
  const bestText = best && best.method !== preferred ? ` Acierta más con «${methodLabel(op, best.method)}».` : ''
  return `${title}: ${favourite}; aciertos por método (últimos 30 días): ${parts.join(' · ')}.${bestText}`
}

export function divisionReportLine(info: NonNullable<ChildSummary['divisionMethods']>): string {
  return methodReportLine('div', info.preferred, info.byMethod)
}

export function tablesReportLine(info: NonNullable<ChildSummary['tableTricks']>): string {
  return methodReportLine('tables', info.preferred, info.byMethod)
}
