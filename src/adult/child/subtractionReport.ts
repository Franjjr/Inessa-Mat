/* The subtraction line of the child's report: the favourite method and the results per method (pure, testable). */
import { SUB_METHODS, methodLabel } from '@/engine'
import type { ChildSummary } from '@/types'

/** A method needs this many attempts before it is said to be the one the child is most accurate with. */
export const MIN_ATTEMPTS_TO_RANK = 3

export function subtractionReportLine(info: NonNullable<ChildSummary['subtractionMethods']>): string {
  const preferred = methodLabel('sub', info.preferred)
  const used = SUB_METHODS
    .map((m) => info.byMethod.find((b) => b.method === m.id))
    .filter((b): b is NonNullable<typeof b> => !!b && b.attempts > 0)
  if (used.length === 0) return `Resta: prefiere «${preferred}». Todavía no hay restas hechas con cada método.`
  const parts = used.map((b) => `${methodLabel('sub', b.method)}: ${b.correct} de ${b.attempts} (${Math.round((b.correct / b.attempts) * 100)} %)`)
  const ranked = used.filter((b) => b.attempts >= MIN_ATTEMPTS_TO_RANK)
  const best = ranked.reduce<typeof ranked[number] | null>((top, b) => {
    if (!top) return b
    const rb = b.correct / b.attempts
    const rt = top.correct / top.attempts
    return rb > rt || (rb === rt && b.method === info.preferred) ? b : top
  }, null)
  const bestText = best && best.method !== info.preferred ? ` Acierta más con «${methodLabel('sub', best.method)}».` : ''
  return `Resta: prefiere «${preferred}»; aciertos por método (últimos 30 días): ${parts.join(' · ')}.${bestText}`
}
