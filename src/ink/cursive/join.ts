/* Joins letra ligada glyphs into one word model: the pen stays down from one letter to the next, so the
   exit of a letter is connected to the entry of the next one with a smooth cubic connector (Hermite, the
   tangents of both ends are kept, so there is no kink). A space starts a new word offset; a letter that
   is not in the alphabet is skipped. Extra strokes (dots, tildes, crossbars) are drawn as separate strokes. */

import { CURSIVE_LOWER, CURSIVE_PUNCT, CURSIVE_UPPER, LINK_GAP, WORD_SPACE, type CursiveGlyph, type ModelPoint, type ModelStroke } from './models'

export function glyphFor(ch: string): CursiveGlyph | undefined {
  return CURSIVE_LOWER[ch] ?? CURSIVE_UPPER[ch] ?? CURSIVE_PUNCT[ch]
}

const dist = (a: ModelPoint, b: ModelPoint) => Math.hypot(b.x - a.x, b.y - a.y)

function unit(from: ModelPoint, to: ModelPoint): ModelPoint {
  const d = dist(from, to)
  return d < 1e-9 ? { x: 1, y: 0 } : { x: (to.x - from.x) / d, y: (to.y - from.y) / d }
}

/** Intermediate points of a cubic Hermite curve from p0 (heading d0) to p1 (arriving with d1). */
function connector(p0: ModelPoint, d0: ModelPoint, p1: ModelPoint, d1: ModelPoint): ModelPoint[] {
  const d = dist(p0, p1)
  if (d < 0.5) return []
  const L = Math.max(4, d * 0.5)
  const n = Math.max(4, Math.ceil(d / 2))
  const out: ModelPoint[] = []
  for (let i = 1; i < n; i++) {
    const t = i / n
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1
    const h10 = t ** 3 - 2 * t ** 2 + t
    const h01 = -2 * t ** 3 + 3 * t ** 2
    const h11 = t ** 3 - t ** 2
    out.push({
      x: h00 * p0.x + h10 * L * d0.x + h01 * p1.x + h11 * L * d1.x,
      y: h00 * p0.y + h10 * L * d0.y + h01 * p1.y + h11 * L * d1.y,
    })
  }
  return out
}

/**
 * Builds the strokes of a word. The body (the joined pen path, in writing order) comes first, so the first point is
 * where the pen starts; the marks (dots, bars, tildes, accents) follow. `width` is the advance of the whole word (no
 * trailing space), `body` counts the leading body strokes, and `missing` lists characters with no glyph (they are
 * skipped and reported, never drawn silently).
 */
export function joinWord(text: string): { strokes: ModelStroke[]; width: number; body: number; missing: string[] } {
  const body: ModelStroke[] = []
  const marks: ModelStroke[] = []
  const missing: string[] = []
  const pen: { open: ModelStroke | null; exit: ModelPoint | null } = { open: null, exit: null }
  let x = 0 // origin of the letter being placed
  let end = 0 // x where the last letter ends

  const finish = () => {
    if (pen.open && pen.open.length >= 2) body.push(pen.open)
    pen.open = null
  }

  for (const ch of text) {
    if (ch === ' ') {
      finish()
      pen.exit = null
      x = end + WORD_SPACE
      continue
    }
    const g = glyphFor(ch)
    if (!g) {
      missing.push(ch)
      continue
    }
    // Inside a word the connector travels a visible gap before the next letter's body.
    if (pen.exit) x = end + LINK_GAP

    const shift = (p: ModelPoint): ModelPoint => ({ x: p.x + x, y: p.y })
    const joined = g.strokes.slice(0, g.main).map((st) => st.map(shift))
    const extras = g.strokes.slice(g.main).map((st) => st.map(shift))
    const first = joined[0]
    const entry = first[0]
    const o = pen.open

    if (o && pen.exit) {
      // Continue the pen-down stroke through a smooth connector, then the letter's own first stroke.
      const pDir = unit(o[Math.max(0, o.length - 2)], pen.exit)
      const eDir = unit(entry, first[Math.min(1, first.length - 1)])
      for (const p of connector(pen.exit, pDir, entry, eDir)) o.push(p)
      first.forEach((p, i) => { if (i > 0 || dist(o[o.length - 1], p) > 0.2) o.push(p) })
    } else {
      finish()
      pen.open = [...first]
    }
    // Pen lifts inside one letter (none in the current alphabet; kept so the model stays general).
    for (const st of joined.slice(1)) {
      finish()
      pen.open = [...st]
    }
    marks.push(...extras)

    pen.exit = joined[joined.length - 1][joined[joined.length - 1].length - 1]
    x += g.width
    end = x
  }
  finish()
  return { strokes: [...body, ...marks], width: round(end), body: body.length, missing }
}

const round = (n: number) => Math.round(n * 10) / 10
