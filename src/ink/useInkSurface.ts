/* React glue for InkCapture: attaches the capture engine to a surface element, keeps a DPR-scaled canvas
   (slightly larger than the zone so ink may overflow) in sync with the zone size, and redraws on rAF. */
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import type { InkStroke } from '@/types'
import { InkCapture, type CaptureCallbacks } from './capture'
import type { PointerRole } from './policy'
import type { Size } from './geometry'
import { OVERFLOW_RATIO } from './constants'
import { inkColorOf, renderInk, sizeCanvas } from './render'

export interface InkSurfaceOptions {
  surfaceRef: RefObject<HTMLElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  enabled: boolean
  role: (pointerType: string, isPrimary: boolean) => PointerRole
  callbacks: CaptureCallbacks
  /** Canvas overflow around the zone as a fraction of the zone's smaller side. */
  overflow?: number
  /** Multiplies the ink width (thin carries, thick tracing). */
  widthScale?: number
  /** Strokes drawn faded (e.g. the old digit while a rewrite may be starting). */
  ghost?: (s: InkStroke) => boolean
  /** Called when the zone size changes (layout of overlays). */
  onResize?: (size: Size) => void
}

export interface InkSurface {
  capture: RefObject<InkCapture | null>
  /** Current zone size in CSS px (0×0 before layout). */
  size: RefObject<Size>
  redraw(): void
}

const raf: (cb: () => void) => number = (cb) =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : (setTimeout(cb, 16) as unknown as number)
const caf = (id: number) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))

export function useInkSurface(opts: InkSurfaceOptions): InkSurface {
  const { surfaceRef, canvasRef } = opts
  const capture = useRef<InkCapture | null>(null)
  const size = useRef<Size>({ width: 0, height: 0 })
  const latest = useRef(opts)
  const frame = useRef<number | null>(null)
  const color = useRef<string>('')

  useLayoutEffect(() => { latest.current = opts })

  const draw = useCallback(() => {
    frame.current = null
    const canvas = canvasRef.current
    const cap = capture.current
    if (!canvas || !cap) return
    const { width, height } = size.current
    if (!width || !height) return
    const margin = Math.round(Math.min(width, height) * (latest.current.overflow ?? OVERFLOW_RATIO))
    const dpr = Math.min(3, Math.max(1, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1))
    sizeCanvas(canvas, size.current, margin, dpr)
    canvas.style.left = `${-margin}px`
    canvas.style.top = `${-margin}px`
    if (!color.current) color.current = inkColorOf(canvas)
    renderInk(canvas, cap.all(), { color: color.current, margin, dpr, zoneHeight: height, widthScale: latest.current.widthScale, ghost: latest.current.ghost })
  }, [canvasRef])

  const redraw = useCallback(() => {
    if (frame.current == null) frame.current = raf(draw)
  }, [draw])

  useEffect(() => {
    const el = surfaceRef.current
    if (!el) return
    const cap = new InkCapture(
      el,
      {
        enabled: () => latest.current.enabled,
        role: (t, primary) => latest.current.role(t, primary),
        zone: () => size.current,
      },
      {
        onStrokeStart: (s) => latest.current.callbacks.onStrokeStart?.(s),
        onStrokeEnd: (s) => latest.current.callbacks.onStrokeEnd?.(s),
        onStrokeCancel: () => latest.current.callbacks.onStrokeCancel?.(),
        onTap: (i) => latest.current.callbacks.onTap?.(i),
        onEraseAt: (x, y) => latest.current.callbacks.onEraseAt?.(x, y),
        onEraseEnd: () => latest.current.callbacks.onEraseEnd?.(),
        onInk: () => { redraw(); latest.current.callbacks.onInk?.() },
      },
    )
    capture.current = cap

    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w !== size.current.width || h !== size.current.height) {
        size.current = { width: w, height: h }
        color.current = ''
        redraw()
        latest.current.onResize?.(size.current)
      }
    }
    measure()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(measure)
      ro.observe(el)
    } else {
      window.addEventListener('resize', measure)
    }
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', measure)
      if (frame.current != null) caf(frame.current)
      frame.current = null
      cap.destroy()
      if (capture.current === cap) capture.current = null
    }
  }, [surfaceRef, redraw])

  return { capture, size, redraw }
}
