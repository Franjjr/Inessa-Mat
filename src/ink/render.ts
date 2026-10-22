/* Canvas rendering of ink: smooth quadratic curves through stroke midpoints, pressure-modulated width for pens.
   Coordinates are zone (cell) CSS px; the canvas is larger than the zone by `margin` on every side so ink may
   overflow the cell a little. */
import type { InkPoint, InkStroke } from '@/types'

export interface InkStyle {
  color: string
  /** Base line width in CSS px. */
  width: number
  /** Extra CSS px around the zone covered by the canvas. */
  margin: number
  dpr: number
}

/** Stroke width for a zone: thick enough to read, thin enough to look like a pencil line. */
export function baseInkWidth(zoneHeight: number, pointerType: InkStroke['pointerType']): number {
  const w = Math.min(7.5, Math.max(2.6, zoneHeight * 0.05))
  return pointerType === 'pen' ? w : w * 1.15
}

function widthAt(p: InkPoint, base: number, usePressure: boolean): number {
  if (!usePressure || p.p == null || p.p <= 0) return base
  return base * (0.6 + 0.8 * Math.min(1, Math.max(0, p.p)))
}

/** Sizes the canvas backing store for a zone. Returns true when it changed. */
export function sizeCanvas(canvas: HTMLCanvasElement, zone: { width: number; height: number }, margin: number, dpr: number): boolean {
  const cssW = Math.max(1, Math.round(zone.width + margin * 2))
  const cssH = Math.max(1, Math.round(zone.height + margin * 2))
  const w = Math.round(cssW * dpr)
  const h = Math.round(cssH * dpr)
  if (canvas.width === w && canvas.height === h) return false
  canvas.width = w
  canvas.height = h
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`
  return true
}

export function clearCanvas(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

/**
 * Draws one stroke. Pen strokes vary their width with pressure; `pressure: false` draws a single path instead
 * (needed for translucent strokes: overlapping per-segment caps would show as darker beads).
 */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: InkStroke, style: InkStyle & { pressure?: boolean }): void {
  const pts = stroke.points
  if (!pts.length) return
  const usePressure = stroke.pointerType === 'pen' && style.pressure !== false
  ctx.strokeStyle = style.color
  ctx.fillStyle = style.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, widthAt(pts[0], style.width, usePressure) / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  if (!usePressure) {
    // One smooth path: quadratic curves with the sample points as controls and their midpoints as anchors.
    ctx.lineWidth = style.width
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2
      const my = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
    }
    const last = pts[pts.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
    return
  }

  // Pressure: same curve, drawn piece by piece so each piece can have its own width (round caps hide joins).
  let fromX = pts[0].x
  let fromY = pts[0].y
  let smoothP = pts[0].p ?? 0.5
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i]
    smoothP = smoothP * 0.6 + (p.p ?? smoothP) * 0.4
    const isLast = i === pts.length - 1
    const toX = isLast ? p.x : (p.x + pts[i + 1].x) / 2
    const toY = isLast ? p.y : (p.y + pts[i + 1].y) / 2
    ctx.lineWidth = widthAt({ ...p, p: smoothP }, style.width, true)
    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    if (isLast) ctx.lineTo(toX, toY)
    else ctx.quadraticCurveTo(p.x, p.y, toX, toY)
    ctx.stroke()
    fromX = toX
    fromY = toY
  }
}

/** Clears and redraws every stroke. Cheap enough per frame: a digit has a few hundred points. */
export function renderInk(
  canvas: HTMLCanvasElement,
  strokes: readonly InkStroke[],
  style: Omit<InkStyle, 'width'> & { zoneHeight: number; widthScale?: number; ghost?: (s: InkStroke) => boolean },
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  clearCanvas(ctx, canvas)
  ctx.setTransform(style.dpr, 0, 0, style.dpr, style.margin * style.dpr, style.margin * style.dpr)
  for (const s of strokes) {
    // ghost strokes: the previous digit, faded while the child may be rewriting it
    const ghost = !!style.ghost?.(s)
    ctx.globalAlpha = ghost ? 0.2 : 1
    drawStroke(ctx, s, { ...style, width: baseInkWidth(style.zoneHeight, s.pointerType) * (style.widthScale ?? 1), pressure: !ghost })
  }
  ctx.globalAlpha = 1
}

/** Resolved ink colour (deep plum) from the canvas' CSS `color`, with a safe fallback. */
export function inkColorOf(el: Element | null): string {
  if (!el || typeof getComputedStyle !== 'function') return '#2e1a47'
  const c = getComputedStyle(el).color
  return c && c !== '' ? c : '#2e1a47'
}
