/* Map label placement: pure geometry, shared by the screen and its tests. Every stop has an icon, a name tag and
   sometimes a «Aquí sigue» pill or a «¡Ayúdame!» tag. The tag of each stop is tried below, above, beside and shifted
   until its box touches no icon and no other tag; when nothing fits, the stage grows taller (up to a limit). */
import type { NodeDef } from '@/types'

export interface Box { x0: number; y0: number; x1: number; y1: number }

export const ICON_PX = 76
export const GUARDIAN_PX = 88
export const GUARDIAN_WON_PX = 96
// Clears the gold ring that circles the current stop (12 px beyond the icon).
const GAP = 16
const MARGIN = 8
const STARS_PX = 20
const PILL_H = 30
// Longest pill we draw on one line; a longer pet name gets the short text «¡Sigue aquí!» instead of a cut name.
const PILL_MAX_W = 300
const PILL_PAD = 36
const PILL_CHAR = 9.2
// Clears the gold ring around icons so two neighbouring rings never touch.
const ICON_RING = 12
const HELP = { w: 100, h: 24 }

/** Width of the name tag: 200 px, but 160 px at most on narrow screens (and never wider than the screen). */
export function labelWidth(stageW: number): number {
  return Math.max(96, Math.min(stageW < 700 ? 160 : 200, stageW - 32))
}

/** Pessimistic height of the tag: one line is 30 px, two lines 48 px (the CSS clamps to two lines). */
export function labelHeight(title: string, w: number): number {
  const perLine = Math.max(6, Math.floor((w - 28) / 9))
  return title.length <= perLine ? 30 : 48
}

/** Text and width of the «Aquí sigue {pet}» pill: sized from the real text, never cut with an ellipsis. */
export function pillOf(petName: string | undefined): { text: string; w: number } {
  const name = (petName ?? '').trim()
  const full = name ? `Aquí sigue ${name}` : '¡Sigue aquí!'
  const w = Math.ceil(full.length * PILL_CHAR + PILL_PAD)
  if (w <= PILL_MAX_W) return { text: full, w }
  const short = '¡Sigue aquí!'
  return { text: short, w: Math.ceil(short.length * PILL_CHAR + PILL_PAD) }
}

export interface StopInput { node: NodeDef; title: string; done: boolean; current: boolean; crystal: boolean; petName?: string }
export interface Placed {
  /** Icon box, label block (name + stars) and the optional extra tags, all in stage pixels. */
  icon: Box
  label: Box
  extras: Box[]
  /** Offset of the label block centre from the icon centre, in pixels. */
  dx: number
  dy: number
  /** Size of the label block. */
  w: number
  h: number
}
export interface MapLayout { height: number; placed: Placed[]; overlaps: string[] }

const hit = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
const around = (cx: number, cy: number, w: number, h: number): Box => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 })

const grow = (b: Box, m: number): Box => ({ x0: b.x0 - m, y0: b.y0 - m, x1: b.x1 + m, y1: b.y1 + m })

function iconSize(s: StopInput): number {
  if (s.node.kind !== 'guardian') return ICON_PX
  return s.crystal ? GUARDIAN_WON_PX : GUARDIAN_PX
}

/** Extra tags drawn over/next to the icon, as boxes. */
function extrasOf(s: StopInput, cx: number, cy: number, size: number): Box[] {
  const out: Box[] = []
  const r = size / 2
  if (s.current) out.push(around(cx, cy - r - PILL_H / 2 + 8, pillOf(s.petName).w, PILL_H))
  if (s.node.kind === 'guardian' && !s.crystal) {
    const right = cx + r + 36
    out.push({ x0: right - HELP.w, y0: cy - r - 12, x1: right, y1: cy - r - 12 + HELP.h })
  }
  return out
}

function candidates(r: number, w: number, h: number): { dx: number; dy: number }[] {
  const out: { dx: number; dy: number }[] = []
  const vert = r + GAP + h / 2
  const side = r + 18 + w / 2
  const shifts = [0, -70, 70, -(w / 2 + r - 10), w / 2 + r - 10]
  for (const extra of [0, 26, 60]) {
    for (const sy of [1, -1]) for (const sx of shifts) out.push({ dx: sx, dy: sy * (vert + extra) })
  }
  for (const dy of [0, -28, 28, -56, 56]) for (const sx of [1, -1]) out.push({ dx: sx * side, dy })
  return out
}

function crowd(c: { x: number; y: number }[], i: number): number {
  let m = Infinity
  for (let j = 0; j < c.length; j++) if (j !== i) m = Math.min(m, Math.hypot(c[i].x - c[j].x, c[i].y - c[j].y))
  return m
}

function place(stops: StopInput[], W: number, H: number): { placed: Placed[]; overlaps: string[] } {
  const w = labelWidth(W)
  const sizes = stops.map(iconSize)
  const centres = stops.map((s) => ({ x: s.node.pos.x * W, y: s.node.pos.y * H }))
  const icons = stops.map((_, i) => around(centres[i].x, centres[i].y, sizes[i], sizes[i]))
  const extras = stops.map((s, i) => extrasOf(s, centres[i].x, centres[i].y, sizes[i]))
  const labels: (Box | null)[] = stops.map(() => null)
  const inside = (b: Box) => b.x0 >= MARGIN && b.x1 <= W - MARGIN && b.y0 >= 0 && b.y1 <= H
  const clash = (b: Box, self: number): number => {
    let n = 0
    for (let j = 0; j < stops.length; j++) {
      if (hit(b, icons[j])) n++
      for (const e of extras[j]) if (hit(b, e)) n++
      if (j !== self && labels[j] && hit(b, labels[j]!)) n++
    }
    return n
  }
  // Stops with the least room (nearest to a neighbour) go first so they take the free sides.
  const order = stops.map((_, i) => i).sort((a, b) => crowd(centres, a) - crowd(centres, b))
  const result: Placed[] = new Array(stops.length)
  for (const i of order) {
    const s = stops[i]
    const h = labelHeight(s.title, w) + (s.done ? STARS_PX : 0)
    const r = sizes[i] / 2
    let best: { box: Box; dx: number; dy: number; bad: number } | null = null
    for (const c of candidates(r, w, h)) {
      // Slide inwards instead of leaving the stage.
      const cx = Math.min(W - MARGIN - w / 2, Math.max(MARGIN + w / 2, centres[i].x + c.dx))
      const box = around(cx, centres[i].y + c.dy, w, h)
      const bad = clash(box, i) + (inside(box) ? 0 : 50)
      if (!best || bad < best.bad) best = { box, dx: cx - centres[i].x, dy: c.dy, bad }
      if (bad === 0) break
    }
    labels[i] = best!.box
    result[i] = { icon: icons[i], label: best!.box, extras: extras[i], dx: best!.dx, dy: best!.dy, w, h }
  }
  const overlaps: string[] = []
  for (let i = 0; i < stops.length; i++) {
    const p = result[i]
    const id = stops[i].node.id
    if (!inside(p.label)) overlaps.push(`${id}: etiqueta fuera del escenario`)
    for (let j = 0; j < stops.length; j++) {
      const other = stops[j].node.id
      if (j > i && hit(grow(p.icon, ICON_RING), grow(result[j].icon, ICON_RING))) overlaps.push(`${id}: icono sobre el de ${other}`)
      if (hit(p.label, result[j].icon)) overlaps.push(`${id}: etiqueta sobre el icono de ${other}`)
      for (const e of result[j].extras) if (hit(p.label, e)) overlaps.push(`${id}: etiqueta sobre un aviso de ${other}`)
      if (j > i && hit(p.label, result[j].label)) overlaps.push(`${id}: etiqueta sobre la de ${other}`)
      if (j !== i) for (const e of p.extras) {
        if (hit(e, result[j].icon)) overlaps.push(`${id}: aviso sobre el icono de ${other}`)
        if (j > i) for (const f of result[j].extras) if (hit(e, f)) overlaps.push(`${id}: aviso sobre otro de ${other}`)
      }
    }
  }
  return { placed: result, overlaps }
}

/** Stage height before any growth: the visible area, at least 96 % of the width and 560 px. */
export function baseStageHeight(stageW: number, visibleH: number, viewportH = visibleH): number {
  // Phones get a much taller stage so the stops spread out.
  if (stageW <= 600) return Math.max(visibleH, Math.round(viewportH * 2), 560)
  return Math.max(visibleH, Math.round(stageW * 0.96), 560)
}

/** Lays the stops out on a stage of the given size; grows the stage (up to 2.5 times, 4 on phones where the width cannot help) until nothing collides. */
export function layoutMap(stops: StopInput[], stageW: number, baseH: number, fixedHeight = false): MapLayout {
  let H = baseH
  let r = place(stops, stageW, H)
  while (!fixedHeight && r.overlaps.length > 0 && H < baseH * (stageW <= 600 ? 4 : 2.5)) {
    H = Math.round(H * 1.08)
    r = place(stops, stageW, H)
  }
  return { height: H, placed: r.placed, overlaps: r.overlaps }
}
