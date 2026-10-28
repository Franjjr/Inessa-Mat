/* Pure helpers of the practice screen (TraceCursive): the live check of the pen while tracing (Repasar), how many
   tries a kind of item gets, which try counts as the best, and where each word of a text starts (the green dots).
   Model units throughout; the screen maps its ink into the pauta with fitPauta. */
import { pointAt, modelPathLength, resample, type ModelPoint, type ModelStroke } from '../digitModels'
import type { CalKind } from '@/content/caligrafia/curriculum'
import { CURSIVE_THRESHOLDS } from './thresholds'
import { joinWord } from './join'
import { WORD_SPACE } from './models'
import type { CursiveScore, PautaFit } from './score'

export type LiveStatus = 'ok' | 'off' | 'reverse'

/** The short line shown while the pen is off the model or against its direction. */
export const LIVE_TEXT: Record<Exclude<LiveStatus, 'ok'>, string> = {
  off: 'Te has salido: vuelve a la línea gris',
  reverse: 'Al revés: sigue la flecha',
}

/** Screen point to model units. */
export const toModel = (p: { x: number; y: number }, fit: PautaFit): ModelPoint => ({ x: (p.x - fit.ox) / fit.scale, y: (p.y - fit.oy) / fit.scale })
/** Model units to screen point. */
export const toScreen = (p: ModelPoint, fit: PautaFit): ModelPoint => ({ x: p.x * fit.scale + fit.ox, y: p.y * fit.scale + fit.oy })

/** Letters and links have two tries, words and sentences one. */
export function triesFor(kind: CalKind): 1 | 2 {
  return kind === 'palabra' || kind === 'frase' ? 1 : 2
}

/** True when `a` is a better try than `b`: more stars, then more criteria passed. */
export function betterScore(a: CursiveScore, b: CursiveScore): boolean {
  if (a.stars !== b.stars) return a.stars > b.stars
  return passedCount(a) > passedCount(b)
}

const passedCount = (s: CursiveScore) => Object.values(s.passed).filter(Boolean).length

interface Guide { x: number; y: number; tx: number; ty: number }

function guideOf(strokes: ModelStroke[]): Guide[] {
  const out: Guide[] = []
  for (const st of strokes) {
    const pts = st.length < 2 ? st.slice() : resample(st, 1)
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)]
      const b = pts[Math.min(pts.length - 1, i + 1)]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.hypot(dx, dy) || 1
      out.push({ x: p.x, y: p.y, tx: dx / len, ty: dy / len })
    })
  }
  return out
}

export interface LiveTracker {
  readonly status: LiveStatus
  /** Whether the last pen point is on the model line again (a stroke can be back on it while its status stays off). */
  readonly near: boolean
  /** A new stroke starts: back to ok. */
  reset(): void
  /** One pen point (model units). Once a stroke is off or reversed it stays so. */
  push(p: ModelPoint): LiveStatus
}

/** Look-ahead and look-behind (model units) around the progress of the stroke, and the tolerance of "same place". */
const AHEAD = 40
const BEHIND = 40
const SAME_PLACE = 2
/** The pen has gone back this far (model units) for this many points in a row: against the direction. */
const REVERSE_UNITS = 12
const REVERSE_POINTS = 3

/**
 * The live mark of one stroke against the model. Off: a point is more than liveOffPath units from every model point.
 * Reverse: the progress along the model (the guide index matched to the pen, moved forward only) falls back by more than
 * REVERSE_UNITS for REVERSE_POINTS points in a row. The match is searched near the progress first, forward before
 * backward, so a stroke that retraces part of the model (an «a» stem over its bowl) follows its own pass.
 */
export function createLiveTracker(model: ModelStroke[]): LiveTracker {
  const guide = guideOf(model)
  const limit = CURSIVE_THRESHOLDS.liveOffPath
  let status: LiveStatus = 'ok'
  let near = true
  let progress = -1
  let back = 0
  const nearestAll = (p: ModelPoint) => {
    let k = 0
    let d = Infinity
    for (let i = 0; i < guide.length; i++) {
      const di = Math.hypot(guide[i].x - p.x, guide[i].y - p.y)
      if (di < d) { d = di; k = i }
    }
    return { k, d }
  }
  return {
    get status() { return status },
    get near() { return near },
    reset() { status = 'ok'; near = true; progress = -1; back = 0 },
    push(p) {
      if (guide.length === 0) return status
      const global = nearestAll(p)
      near = global.d <= limit
      if (status !== 'ok') return status
      if (global.d > limit) { status = 'off'; return status }
      if (progress < 0) {
        progress = global.k
        return status
      }
      // The first model point at or ahead of the progress within reach (progress moves to the next place, not to a
      // crossing further on); otherwise the nearest one just behind it (a backward pass).
      const from = Math.max(0, progress - SAME_PLACE)
      let j = -1
      for (let i = from; i < Math.min(guide.length, progress + AHEAD + 1); i++) {
        if (Math.hypot(guide[i].x - p.x, guide[i].y - p.y) <= limit) { j = i; break }
      }
      if (j < 0) {
        let bd = Infinity
        for (let i = progress - SAME_PLACE - 1; i >= Math.max(0, progress - BEHIND); i--) {
          const d = Math.hypot(guide[i].x - p.x, guide[i].y - p.y)
          if (d <= limit && d < bd) { bd = d; j = i }
        }
      }
      if (j < 0) j = global.k
      if (j > progress) progress = j
      back = progress - j > REVERSE_UNITS ? back + 1 : 0
      if (back >= REVERSE_POINTS) status = 'reverse'
      return status
    },
  }
}

/** Where each word of the text starts, in model units (the same spacing as joinWord uses for the whole text). */
export function wordStarts(text: string): ModelPoint[] {
  const out: ModelPoint[] = []
  let offset = 0
  for (const word of text.split(' ')) {
    if (!word) continue
    const w = joinWord(word)
    if (!w.strokes.length) continue
    out.push({ x: w.strokes[0][0].x + offset, y: w.strokes[0][0].y })
    offset += w.width + WORD_SPACE
  }
  return out
}

/** Arrow positions along a body stroke (model units): the same rule as CursiveModel. */
export function arrowsOf(stroke: ModelStroke): { x: number; y: number; angle: number }[] {
  const len = modelPathLength(stroke)
  if (len < 20) return []
  const count = Math.min(4, Math.max(1, Math.round(len / 50)))
  return Array.from({ length: count }, (_, k) => {
    const p = pointAt(stroke, (k + 0.5) / count)
    return { x: p.x, y: p.y, angle: (Math.atan2(p.dy, p.dx) * 180) / Math.PI }
  })
}
