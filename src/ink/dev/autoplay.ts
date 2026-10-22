/* Dev/test helper: replays strokes into an ink surface by dispatching (untrusted) PointerEvents,
   exactly like a pen would — used by the gallery demos and mirrored by the Playwright e2e test. */
import type { InkStroke } from '@/types'

export interface ReplayOptions {
  /** Stop in the middle of the last stroke (no pointerup): "mid-writing" screenshots. */
  partial?: number
  pointerId?: number
}

function fire(el: Element, type: string, x: number, y: number, o: { pointerType: string; pointerId: number; pressure: number; buttons: number }) {
  const r = el.getBoundingClientRect()
  const ev = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: o.pointerId,
    pointerType: o.pointerType,
    isPrimary: true,
    pressure: o.pressure,
    buttons: o.buttons,
    button: type === 'pointermove' ? -1 : 0,
    clientX: r.left + (el as HTMLElement).clientLeft + x,
    clientY: r.top + (el as HTMLElement).clientTop + y,
  })
  el.dispatchEvent(ev)
}

export function replayStrokes(el: Element, strokes: InkStroke[], opts: ReplayOptions = {}): void {
  const pointerId = opts.pointerId ?? 41
  strokes.forEach((s, si) => {
    const isLast = si === strokes.length - 1
    const pts = isLast && opts.partial != null ? s.points.slice(0, Math.max(2, Math.round(s.points.length * opts.partial))) : s.points
    const o = { pointerType: s.pointerType, pointerId, pressure: 0.5, buttons: 1 }
    pts.forEach((p, i) => {
      o.pressure = p.p ?? 0.5
      fire(el, i === 0 ? 'pointerdown' : 'pointermove', p.x, p.y, o)
    })
    if (!(isLast && opts.partial != null)) {
      const last = pts[pts.length - 1]
      fire(el, 'pointerup', last.x, last.y, { ...o, buttons: 0, pressure: 0 })
    }
  })
}

/** A quick tap (focus / alternatives / tap-to-rewrite). */
export function tap(el: Element, x: number, y: number, pointerType = 'pen'): void {
  const o = { pointerType, pointerId: 42, pressure: 0.4, buttons: 1 }
  fire(el, 'pointerdown', x, y, o)
  fire(el, 'pointerup', x, y, { ...o, buttons: 0, pressure: 0 })
}
