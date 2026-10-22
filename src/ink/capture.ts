/* InkCapture: framework-free pointer capture for one writing zone.
   - Pointer Events + setPointerCapture: a stroke started in the zone keeps belonging to it when it leaves.
   - getCoalescedEvents() for smooth, high-rate Apple Pencil input.
   - Palm rejection through a role callback (see policy.pointerRole); a pen arriving while a finger is writing
     replaces the finger stroke (the finger was a palm).
   - Pen eraser (buttons bit 32 / barrel) reports erase points instead of ink.
   - Blocks scrolling, zoom, selection and the iOS callout/magnifier while writing.
   React components own the strokes' meaning (recognition, scribble-out…); this class only captures. */
import type { InkPoint, InkStroke } from '@/types'
import { isEraserPointer, normalizePointerType, trackPenEvent, type PointerKind, type PointerRole } from './policy'
import { isTap, tapSlop, type Size } from './geometry'
import { TAP_MS } from './constants'

export interface TapInfo { x: number; y: number; pointerType: PointerKind; role: PointerRole }

export interface CaptureCallbacks {
  /** A new ink stroke really started (it moved beyond the tap slop or lasted longer than a tap). */
  onStrokeStart?(stroke: InkStroke): void
  /** Stroke finished (not a tap). Return false to discard it (e.g. it was a scribble-out gesture). */
  onStrokeEnd?(stroke: InkStroke): boolean | void
  /** A started stroke was dropped (palm replaced by a pen, cancelled by the system). */
  onStrokeCancel?(): void
  onTap?(info: TapInfo): void
  /** A pointer that may only tap (a finger after a pen was seen) moved like writing: it was not inked. */
  onBlockedWrite?(info: TapInfo): void
  onEraseAt?(x: number, y: number): void
  onEraseEnd?(): void
  /** Something visible changed (redraw). */
  onInk?(): void
}

export interface CaptureConfig {
  enabled(): boolean
  role(pointerType: string, isPrimary: boolean): PointerRole
  zone(): Size
}

interface ActivePointer {
  id: number
  kind: PointerKind
  role: PointerRole | 'erase'
  t0: number
  x0: number
  y0: number
  maxMove: number
  /** onStrokeStart has fired (a press that never does is a tap). */
  started: boolean
  /** Last event time (performance clock) — detects pointers whose pointerup was lost. */
  lastAt: number
  /** Top-left of the zone's padding box in client coordinates (borders excluded, like the canvas). */
  origin: Origin
}

interface Origin { left: number; top: number }

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
/** A pointer silent for this long while "down" is considered lifted when another one arrives. */
const STALE_MS = 1500

export class InkCapture {
  strokes: InkStroke[] = []
  current: InkStroke | null = null
  private active: ActivePointer | null = null
  private readonly el: HTMLElement
  private readonly cfg: CaptureConfig
  cb: CaptureCallbacks

  constructor(el: HTMLElement, cfg: CaptureConfig, cb: CaptureCallbacks) {
    this.el = el
    this.cfg = cfg
    this.cb = cb
    el.addEventListener('pointerdown', this.down)
    el.addEventListener('pointermove', this.move)
    el.addEventListener('pointerup', this.up)
    el.addEventListener('pointercancel', this.cancel)
    el.addEventListener('lostpointercapture', this.lost)
    // iOS Safari: belt and braces on top of `touch-action: none` (old iPadOS ignores it for double-tap zoom).
    el.addEventListener('touchstart', this.blockTouch, { passive: false })
    el.addEventListener('touchmove', this.blockTouch, { passive: false })
    el.addEventListener('contextmenu', this.prevent)
    el.addEventListener('selectstart', this.prevent)
    el.addEventListener('dragstart', this.prevent)
  }

  destroy(): void {
    const el = this.el
    el.removeEventListener('pointerdown', this.down)
    el.removeEventListener('pointermove', this.move)
    el.removeEventListener('pointerup', this.up)
    el.removeEventListener('pointercancel', this.cancel)
    el.removeEventListener('lostpointercapture', this.lost)
    el.removeEventListener('touchstart', this.blockTouch)
    el.removeEventListener('touchmove', this.blockTouch)
    el.removeEventListener('contextmenu', this.prevent)
    el.removeEventListener('selectstart', this.prevent)
    el.removeEventListener('dragstart', this.prevent)
    this.active = null
    this.current = null
  }

  /** All strokes including the one being drawn. */
  all(): InkStroke[] {
    return this.current ? [...this.strokes, this.current] : this.strokes
  }

  get writing(): boolean {
    return this.current != null
  }

  clear(): void {
    this.strokes = []
    this.cb.onInk?.()
  }

  setStrokes(strokes: InkStroke[]): void {
    this.strokes = strokes
    this.cb.onInk?.()
  }

  // ------------------------------------------------------------------------------------------ handlers

  private prevent = (e: Event) => { e.preventDefault() }

  private focus() {
    try { this.el.focus({ preventScroll: true }) } catch { /* old browsers */ }
  }

  private blockTouch = (e: TouchEvent) => {
    const t = e.target as Element | null
    if (t && t.closest && t.closest('button, a, [data-ink-allow-touch]')) return
    if (e.cancelable) e.preventDefault()
  }

  private origin(): Origin {
    const r = this.el.getBoundingClientRect()
    return { left: r.left + (this.el.clientLeft || 0), top: r.top + (this.el.clientTop || 0) }
  }

  private point(e: PointerEvent, o: Origin): InkPoint {
    const pt: InkPoint = { x: e.clientX - o.left, y: e.clientY - o.top, t: e.timeStamp || now() }
    if (e.pointerType === 'pen' && typeof e.pressure === 'number' && e.pressure > 0) pt.p = e.pressure
    return pt
  }

  private maybeStart(a: ActivePointer, s: InkStroke, force = false) {
    if (a.started) return
    const last = s.points[s.points.length - 1]
    if (force || a.maxMove > tapSlop(this.cfg.zone()) || last.t - a.t0 > TAP_MS) {
      a.started = true
      this.cb.onStrokeStart?.(s)
    }
  }

  private down = (e: PointerEvent) => {
    trackPenEvent(e)
    if (!this.cfg.enabled()) return
    if ((e.target as Element | null)?.closest?.('button')) return
    const kind = normalizePointerType(e.pointerType)
    if (kind === 'mouse' && e.button !== 0) return
    const role: PointerRole | 'erase' = isEraserPointer(e) ? 'erase' : this.cfg.role(e.pointerType, e.isPrimary !== false)
    if (role === 'ignore') return

    if (this.active && (this.active.id === e.pointerId || now() - this.active.lastAt > STALE_MS)) {
      // The previous pointer's up/cancel never arrived (OS gesture, synthetic input…): close it as lifted.
      this.finishActive(false)
    }
    if (this.active) {
      // A pen landing while a "finger" is writing: that finger was the palm. Drop it and follow the pen.
      if (this.active.kind === 'touch' && kind === 'pen') {
        const wasStarted = this.active.started && this.current != null
        this.current = null
        this.active = null
        if (wasStarted) this.cb.onStrokeCancel?.()
        this.cb.onInk?.()
      } else {
        return
      }
    }

    e.preventDefault()
    // A pointer that may only tap (a finger after a pen was seen) takes focus only once it really taps: a palm
    // resting on a neighbouring cell must not move the focus away from the cell being written in.
    if (role !== 'tap') {
      this.focus()
      try { this.el.setPointerCapture(e.pointerId) } catch { /* synthetic or already released pointer */ }
    }
    const origin = this.origin()
    const p = this.point(e, origin)
    this.active = { id: e.pointerId, kind, role, t0: p.t, x0: p.x, y0: p.y, maxMove: 0, started: false, origin, lastAt: now() }
    if (role === 'write') {
      this.current = { points: [p], pointerType: kind }
      this.cb.onInk?.()
    } else if (role === 'erase') {
      this.cb.onEraseAt?.(p.x, p.y)
    }
  }

  private move = (e: PointerEvent) => {
    trackPenEvent(e)
    const a = this.active
    if (!a || e.pointerId !== a.id) return
    a.lastAt = now()
    if (a.role === 'tap' || a.role === 'ignore') {
      const p = this.point(e, a.origin)
      a.maxMove = Math.max(a.maxMove, Math.hypot(p.x - a.x0, p.y - a.y0))
      return
    }
    e.preventDefault()
    const events = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : []
    const list = events.length ? events : [e]
    if (a.role === 'erase') {
      for (const ev of list) { const p = this.point(ev, a.origin); this.cb.onEraseAt?.(p.x, p.y) }
      return
    }
    const s = this.current
    if (!s) return
    for (const ev of list) {
      const p = this.point(ev, a.origin)
      const last = s.points[s.points.length - 1]
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 0.6) continue
      s.points.push(p)
      a.maxMove = Math.max(a.maxMove, Math.hypot(p.x - a.x0, p.y - a.y0))
    }
    this.maybeStart(a, s)
    this.cb.onInk?.()
  }

  /** Ends the active pointer without an event (its pointerup was lost). */
  private finishActive(cancelled: boolean) {
    const a = this.active
    if (!a) return
    const last = this.current?.points[this.current.points.length - 1]
    this.finish({ pointerId: a.id, timeStamp: last?.t ?? a.t0, clientX: NaN, clientY: NaN } as PointerEvent, cancelled, true)
  }

  private finish(e: PointerEvent, cancelled: boolean, synthetic = false) {
    const a = this.active
    if (!a || e.pointerId !== a.id) return
    this.active = null
    if (!synthetic) {
      try { if (this.el.hasPointerCapture?.(e.pointerId)) this.el.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    }
    const end = e.timeStamp || now()
    const zone = this.cfg.zone()

    if (a.role === 'erase') { this.cb.onEraseEnd?.(); return }
    if (a.role === 'tap') {
      if (cancelled || synthetic) return
      const info: TapInfo = { x: a.x0, y: a.y0, pointerType: a.kind, role: 'tap' }
      if (end - a.t0 <= 400 && a.maxMove <= Math.max(14, Math.min(zone.width, zone.height) * 0.15)) {
        this.focus()
        this.cb.onTap?.(info)
      } else if (a.maxMove >= Math.max(20, Math.min(zone.width, zone.height) * 0.3)) this.cb.onBlockedWrite?.(info)
      return
    }

    const s = this.current
    this.current = null
    if (!s) return
    if (!cancelled && !synthetic) {
      const p = this.point(e, a.origin)
      const last = s.points[s.points.length - 1]
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) >= 0.6) s.points.push(p)
    }
    if (cancelled && s.points.length < 4) {
      if (a.started) this.cb.onStrokeCancel?.()
      this.cb.onInk?.()
      return
    }
    if (!a.started && isTap(s, zone)) {
      this.cb.onInk?.()
      this.cb.onTap?.({ x: a.x0, y: a.y0, pointerType: a.kind, role: 'write' })
      return
    }
    this.maybeStart(a, s, true)
    const keep = this.cb.onStrokeEnd?.(s)
    if (keep !== false) this.strokes = [...this.strokes, s]
    this.cb.onInk?.()
  }

  private up = (e: PointerEvent) => {
    trackPenEvent(e)
    this.finish(e, false)
  }
  private cancel = (e: PointerEvent) => {
    trackPenEvent(e)
    this.finish(e, true)
  }
  private lost = (e: PointerEvent) => { if (this.active && this.active.id === e.pointerId) this.finish(e, false) }
}
