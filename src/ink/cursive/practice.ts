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
  /** A new stroke starts: back to ok. */
  reset(): void
  /** One pen point (model units). Once a stroke is off or reversed it stays so. */
  push(p: ModelPoint): LiveStatus
}

/**
 * The live mark of one stroke against the model: off when a point is more than liveOffPath units from the model, reverse
 * when the last few points move against the model's direction at the nearest point. Only the last points are kept, so
 * each point costs one pass over the model guide.
 */
export function createLiveTracker(model: ModelStroke[]): LiveTracker {
  const guide = guideOf(model)
  const LAST = 4
  let status: LiveStatus = 'ok'
  let trail: ModelPoint[] = []
  return {
    get status() { return status },
    reset() { status = 'ok'; trail = [] },
    push(p) {
      if (status !== 'ok' || guide.length === 0) return status
      trail.push(p)
      if (trail.length > LAST) trail.shift()
      let j = 0
      let best = Infinity
      for (let i = 0; i < guide.length; i++) {
        const d = Math.hypot(guide[i].x - p.x, guide[i].y - p.y)
        if (d < best) { best = d; j = i }
      }
      if (best > CURSIVE_THRESHOLDS.liveOffPath) { status = 'off'; return status }
      if (trail.length === LAST) {
        const a = trail[0]
        const mx = p.x - a.x
        const my = p.y - a.y
        const len = Math.hypot(mx, my)
        if (len >= 2) {
          const g = guide[j]
          if ((mx * g.tx + my * g.ty) / len < -0.5) status = 'reverse'
        }
      }
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
