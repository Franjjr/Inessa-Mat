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
/** The line «Puedes saltarla» under the name of an optional stop not done yet (NodeDef.optional): 4 px of gap in the
    tag, 16 px of line, 2 px of padding and 3 px of dashed border (25 px), rounded up. */
const OPTIONAL_PX = 26
const PILL_H = 30
// Longest pill we draw on one line; a longer pet name gets the short text «¡Sigue aquí!» instead of a cut name.
const PILL_MAX_W = 300
const PILL_PAD = 36
const PILL_CHAR = 9.2
// Clears the gold ring around icons so two neighbouring rings never touch.
const ICON_RING = 12
const HELP = { w: 100, h: 24 }
/** Up to this stage width the screen is a phone: close stops are spread apart (spreadForPhone). */
export const PHONE_W = 600

/** Width of the name tag: 200 px, but 160 px at most on narrow screens (and never wider than the screen). */
export function labelWidth(stageW: number): number {
  return Math.max(96, Math.min(stageW < 700 ? 160 : 200, stageW - 32))
}

/** Lines of the name tag at most: two on tablets, three on phones, where the tag is narrow and a long name would
    otherwise end in «…» (the CSS clamps .label to the same number, see WorldMapScreen.module.css). */
export function labelMaxLines(stageW: number): number {
  return stageW <= PHONE_W ? 3 : 2
}

/** Pessimistic number of lines of a name in a tag of width w: words wrapped greedily at 9 px a letter. */
export function labelLines(title: string, w: number): number {
  const perLine = Math.max(6, Math.floor((w - 28) / 9))
  let lines = 1
  let used = 0
  for (const word of title.split(/\s+/).filter(Boolean)) {
    const need = used === 0 ? word.length : used + 1 + word.length
    if (need <= perLine) { used = need; continue }
    if (used > 0) lines++
    lines += Math.floor(Math.max(0, word.length - 1) / perLine)
    used = word.length % perLine || perLine
  }
  return lines
}

/** Pessimistic height of the tag: one line is 30 px, then 18 px a line, up to maxLines (the CSS clamps to the same). */
export function labelHeight(title: string, w: number, maxLines = 2): number {
  const perLine = Math.max(6, Math.floor((w - 28) / 9))
  if (title.length <= perLine) return 30
  return 30 + 18 * (Math.min(maxLines, Math.max(2, labelLines(title, w))) - 1)
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
  /** Centre of the icon as a fraction of the stage (0..1): node.pos, except on a phone where close stops are spread
      apart (see spreadForPhone). The screen draws the icon and the path from here. */
  pos: { x: number; y: number }
  /** Icon box, label block (name + stars) and the optional extra tags, all in stage pixels. */
  icon: Box
  label: Box
  extras: Box[]
  /** Horizontal shift of the «Aquí sigue» pill from the icon centre (0 when it fits centred; on a phone a stop near
      the edge pushes it inwards so it is never cut). */
  pillDx: number
  /** Left edge of the «¡Ayúdame!» tag from the icon centre, in pixels (null when it is not drawn: crystal won, or the
      guardian is the current stop and the pill already marks it). It sits to the right of the icon, or to the left
      when the right edge of the stage would cut it. */
  helpX: number | null
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

/** Whether the tag of the stop carries the line «Puedes saltarla»: an optional stop the child has not done. */
export function showsSkippable(s: Pick<StopInput, 'node' | 'done'>): boolean {
  return s.node.optional === true && !s.done
}

function iconSize(s: StopInput): number {
  if (s.node.kind !== 'guardian') return ICON_PX
  return s.crystal ? GUARDIAN_WON_PX : GUARDIAN_PX
}

/** Whether the guardian shows its «¡Ayúdame!» tag: not once the crystal is won, and not while it is the current stop,
    where the «Aquí sigue» pill would sit on top of it (the pill already says where to go). */
export function showsHelp(s: Pick<StopInput, 'node' | 'crystal' | 'current'>): boolean {
  return s.node.kind === 'guardian' && !s.crystal && !s.current
}

/** Moves [x0, x1] inside [MARGIN, W − MARGIN] (centred when it is wider than that): the shift to apply. */
function inwards(x0: number, x1: number, W: number): number {
  if (x1 - x0 > W - 2 * MARGIN) return (W - x1 - x0) / 2
  if (x0 < MARGIN) return MARGIN - x0
  if (x1 > W - MARGIN) return W - MARGIN - x1
  return 0
}

/** Extra tags drawn over/next to the icon, as boxes, with where the screen draws them. */
function extrasOf(s: StopInput, cx: number, cy: number, size: number, W: number): { boxes: Box[]; pillDx: number; helpX: number | null } {
  const boxes: Box[] = []
  const r = size / 2
  let pillDx = 0
  let helpX: number | null = null
  if (s.current) {
    const pill = around(cx, cy - r - PILL_H / 2 + 8, pillOf(s.petName).w, PILL_H)
    pillDx = inwards(pill.x0, pill.x1, W)
    boxes.push({ ...pill, x0: pill.x0 + pillDx, x1: pill.x1 + pillDx })
  }
  if (showsHelp(s)) {
    // To the right of the icon (its right edge 36 px past it); to the left when that edge would leave the stage.
    let x0 = cx + r + 36 - HELP.w
    if (x0 + HELP.w > W - MARGIN) x0 = cx - r - 36
    x0 += inwards(x0, x0 + HELP.w, W)
    helpX = x0 - cx
    boxes.push({ x0, y0: cy - r - 12, x1: x0 + HELP.w, y1: cy - r - 12 + HELP.h })
  }
  return { boxes, pillDx, helpX }
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

/** Phones are narrow: stops a path puts side by side (node.pos) are closer than an icon with its ring, and the stage
    cannot widen. Their centres keep their x and are moved apart vertically, in path order, until no two icons (with
    their gold rings) touch and no «Aquí sigue» pill or «¡Ayúdame!» tag of a stop could land on the icon above it. The
    result does not depend on which stop is the current one, so the icons never jump as the child progresses. */
export function spreadForPhone(stops: StopInput[], centres: { x: number; y: number }[], sizes: number[], H: number, W = Infinity): { x: number; y: number }[] {
  const out = centres.map((c) => ({ ...c }))
  const pillW = pillOf(stops[0]?.petName).w
  // How far the pill over stop i reaches to each side of its centre, once pushed inwards from the edges of the stage.
  const pillReach = (i: number): [number, number] => {
    const x = out[i].x
    const d = Number.isFinite(W) ? inwards(x - pillW / 2, x + pillW / 2, W) : 0
    return [pillW / 2 - d, pillW / 2 + d]
  }
  // Above the icon: the pill (its top 22 px over the icon) or the help tag of the guardian (12 px over it).
  const ABOVE = PILL_H - 8
  const top = (i: number) => sizes[i] / 2 + ABOVE + 4
  const bottom = (i: number) => H - sizes[i] / 2 - MARGIN
  // Upper/lower of each pair from the authored order (by y, then by path order), so the order never flips.
  const upper = (i: number, j: number) => (centres[i].y < centres[j].y || (centres[i].y === centres[j].y && i < j) ? i : j)
  for (let pass = 0; pass < 200; pass++) {
    let moved = false
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const u = upper(i, j)
        const l = u === i ? j : i
        const ru = sizes[u] / 2
        const rl = sizes[l] / 2
        const sdx = out[u].x - out[l].x
        const dx = Math.abs(sdx)
        let need = 0
        if (dx < ru + rl + 2 * ICON_RING) need = ru + rl + 2 * ICON_RING
        // The pill over the lower icon (pushed inwards near an edge) or the guardian's tag (up to 36 px to either side
        // of it) over the upper icon.
        const [left, right] = pillReach(l)
        const reach = sdx >= 0 ? Math.max(right, rl + 36) : Math.max(left, rl + 36)
        if (dx < reach + ru) need = Math.max(need, ru + rl + ABOVE + 2)
        // And the other way round: two stops at almost the same height, the pill (or tag) of the upper one, pushed
        // inwards from the edge, reaching the side of the lower icon. Its bottom is 12 px under the top of its icon.
        const [uLeft, uRight] = pillReach(u)
        const uReach = sdx >= 0 ? Math.max(uLeft, ru + 36) : Math.max(uRight, ru + 36)
        if (dx < uReach + rl) need = Math.max(need, rl - ru + 14)
        const dy = out[l].y - out[u].y
        if (need === 0 || dy >= need) continue
        const deficit = need - dy
        const upRoom = Math.max(0, out[u].y - top(u))
        const downRoom = Math.max(0, bottom(l) - out[l].y)
        let up = Math.min(upRoom, deficit / 2)
        let down = Math.min(downRoom, deficit - up)
        up = Math.min(upRoom, deficit - down)
        if (up + down <= 0.01) continue
        out[u].y -= up
        out[l].y += down
        moved = true
      }
    }
    if (!moved) break
  }
  return out
}

function place(stops: StopInput[], W: number, H: number): { placed: Placed[]; overlaps: string[] } {
  const w = labelWidth(W)
  const sizes = stops.map(iconSize)
  const authored = stops.map((s) => ({ x: s.node.pos.x * W, y: s.node.pos.y * H }))
  const centres = W <= PHONE_W ? spreadForPhone(stops, authored, sizes, H, W) : authored
  const icons = stops.map((_, i) => around(centres[i].x, centres[i].y, sizes[i], sizes[i]))
  const extraInfo = stops.map((s, i) => extrasOf(s, centres[i].x, centres[i].y, sizes[i], W))
  const extras = extraInfo.map((e) => e.boxes)
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
    const h = labelHeight(s.title, w, labelMaxLines(W)) + (s.done ? STARS_PX : 0) + (showsSkippable(s) ? OPTIONAL_PX : 0)
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
    result[i] = { pos: W <= PHONE_W ? { x: s.node.pos.x, y: centres[i].y / H } : s.node.pos, icon: icons[i], label: best!.box, extras: extras[i], pillDx: extraInfo[i].pillDx, helpX: extraInfo[i].helpX, dx: best!.dx, dy: best!.dy, w, h }
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
