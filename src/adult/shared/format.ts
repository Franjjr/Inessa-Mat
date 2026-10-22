/* Spanish (Spain) formatting for grown-up screens. Pure functions, easy to test. */

/** "0 min", "45 min", "2 h", "1 h 5 min". */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes || 0))
  if (m === 0) return '0 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r === 0 ? `${h} h` : `${h} h ${r} min`
}

/** Accuracy 0..1 → "83 %", or null → "Sin datos". */
export function formatPercent(ratio: number | null): string {
  if (ratio === null || Number.isNaN(ratio)) return 'Sin datos'
  return `${Math.round(ratio * 100)} %`
}

/** "hoy", "ayer", "hace 3 días", or a long date. */
export function formatRelative(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Todavía no ha jugado'
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return 'Todavía no ha jugado'
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(then)) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return then.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** "12 de octubre de 2026" style date for headers. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Spanish plural helper: plural(3, 'perfil', 'perfiles') → "3 perfiles". */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}
