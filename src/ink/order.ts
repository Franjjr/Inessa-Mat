/* Pure focus-order and spatial-navigation helpers for CellGroup. */

export interface OrderItem {
  uid: string
  cellId?: string
  /** Position in document order. */
  domIndex: number
  rect: { x: number; y: number; width: number; height: number }
  focusable: boolean
}

/**
 * 'dom'         document order
 * 'reverse'     reverse document order (a row of result cells written units first)
 * 'rtl-columns' spatial: columns right → left, top → bottom inside a column
 *               (units result, tens carry, tens result, hundreds carry… — the Spanish column algorithm)
 * string[]      explicit order of `cellId`s; cells not listed follow in document order
 */
export type CellOrder = 'dom' | 'reverse' | 'rtl-columns' | readonly string[]

const hasLayout = (items: readonly OrderItem[]) => items.some((i) => i.rect.width > 0 || i.rect.height > 0)
const cx = (i: OrderItem) => i.rect.x + i.rect.width / 2
const cy = (i: OrderItem) => i.rect.y + i.rect.height / 2

export function computeOrder(items: readonly OrderItem[], order: CellOrder = 'dom'): string[] {
  const dom = [...items].sort((a, b) => a.domIndex - b.domIndex)
  const pick = (list: OrderItem[]) => list.filter((i) => i.focusable).map((i) => i.uid)
  if (order === 'dom') return pick(dom)
  if (order === 'reverse') return pick([...dom].reverse())
  if (order === 'rtl-columns') {
    if (!hasLayout(dom)) return pick([...dom].reverse())
    const widths = dom.map((i) => i.rect.width).filter((w) => w > 0).sort((a, b) => a - b)
    const tol = (widths[Math.floor(widths.length / 2)] ?? 40) * 0.5
    const byX = [...dom].sort((a, b) => cx(b) - cx(a) || a.domIndex - b.domIndex)
    const columns: OrderItem[][] = []
    for (const it of byX) {
      const col = columns[columns.length - 1]
      if (col && Math.abs(cx(col[0]) - cx(it)) <= tol) col.push(it)
      else columns.push([it])
    }
    return pick(columns.flatMap((c) => c.sort((a, b) => cy(a) - cy(b) || a.domIndex - b.domIndex)))
  }
  const rank = new Map(order.map((id, i) => [id, i] as const))
  const listed = dom.filter((i) => i.cellId != null && rank.has(i.cellId)).sort((a, b) => rank.get(a.cellId!)! - rank.get(b.cellId!)!)
  const rest = dom.filter((i) => !(i.cellId != null && rank.has(i.cellId)))
  return pick([...listed, ...rest])
}

export type Direction = 'left' | 'right' | 'up' | 'down'

/**
 * Nearest focusable cell in a direction (arrow keys). Falls back to document order when there is no layout
 * (tests) — left/up = previous, right/down = next.
 */
export function neighbor(items: readonly OrderItem[], fromUid: string, dir: Direction): string | null {
  const from = items.find((i) => i.uid === fromUid)
  if (!from) return null
  const candidates = items.filter((i) => i.focusable && i.uid !== fromUid)
  if (!candidates.length) return null
  if (!hasLayout(items)) {
    const dom = [...items].filter((i) => i.focusable || i.uid === fromUid).sort((a, b) => a.domIndex - b.domIndex)
    const idx = dom.findIndex((i) => i.uid === fromUid)
    const next = dir === 'left' || dir === 'up' ? dom[idx - 1] : dom[idx + 1]
    return next?.uid ?? null
  }
  const fx = cx(from), fy = cy(from)
  let best: string | null = null
  let bestScore = Infinity
  for (const c of candidates) {
    const dx = cx(c) - fx
    const dy = cy(c) - fy
    let primary: number, secondary: number
    switch (dir) {
      case 'left': primary = -dx; secondary = Math.abs(dy); break
      case 'right': primary = dx; secondary = Math.abs(dy); break
      case 'up': primary = -dy; secondary = Math.abs(dx); break
      case 'down': primary = dy; secondary = Math.abs(dx); break
    }
    if (primary <= 2) continue
    const score = primary + secondary * 2.5
    if (score < bestScore) { bestScore = score; best = c.uid }
  }
  return best
}

/** Next/previous in a precomputed order (no wrap). */
export function step(order: readonly string[], fromUid: string, delta: 1 | -1): string | null {
  const i = order.indexOf(fromUid)
  if (i < 0) return order[delta === 1 ? 0 : order.length - 1] ?? null
  return order[i + delta] ?? null
}
