/* <FitToScreen> — the body of a game, shrunk just enough that it fits in the window, so the child never has to
   scroll to answer or to reach «Comprobar» / «Siguiente».

   Why: a laptop gives a game ~600–790 px, a tablet in landscape with the browser bars ~520–700 px. Scrolling is not
   a fix for children: they do not know they have to, and on a tablet a swipe that starts on a writing surface
   (touch-action: none) does not scroll at all.

   How: the inner box keeps its natural layout (its CSS pixels never change, so handwriting, layout and tests see
   the same sizes); it is drawn smaller with transform: scale from its top centre, and the outer box takes the
   shrunk height. Never below minScreenFit() (taps and text stay comfortable); if even that does not fit, the page
   scrolls as before. Things inside must not rely on position: fixed (use a portal): a transformed ancestor would
   make it relative to the box. Ink capture divides by the on-screen scale (src/ink/capture.ts).

   The statement is never shrunk (P3PE-01/06): the inner box carries --fit-scale and the shared statement style
   (.ex-prompt, src/styles/exercise.css) divides its size by it, so it keeps its size on screen while the rest shrinks.
   That makes the box a little taller, so the scale settles over a few measures; changes under SCALE_STEP are ignored,
   which ends the loop (BOTTOM_GAP absorbs the difference). */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** Smallest scale with a finger (tablets): a 56 px button stays ≥ 39 px, 18 px text ≥ 12.6 px. */
export const MIN_SCREEN_FIT_TOUCH = 0.7
/** Smallest scale with a mouse or trackpad (laptops): the pointer is precise, so the game may shrink further. */
export const MIN_SCREEN_FIT_MOUSE = 0.62

/** The smallest scale for this device: by its main pointer (a touch laptop counts as touch). */
export function minScreenFit(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return MIN_SCREEN_FIT_TOUCH
  return window.matchMedia('(any-pointer: coarse)').matches ? MIN_SCREEN_FIT_TOUCH : MIN_SCREEN_FIT_MOUSE
}
/** Space kept free under the body (CSS px), besides what follows it on the page. */
const BOTTOM_GAP = 8
/** A new scale closer than this to the current one is not applied (see the statement above). */
export const SCALE_STEP = 0.01

/** The scale to apply: the new one, unless it is within SCALE_STEP of the current one. */
export function settleScale(current: number, next: number): number {
  return Math.abs(next - current) < SCALE_STEP && next !== 1 ? current : next
}

/** Height of what the page still lays out under `el`: the bottom padding, border and gap of every ancestor, and the
    in-flow boxes that come after it (absolute and fixed boxes, like the companion buddy, take no room). */
export function trailingSpace(el: HTMLElement): number {
  let total = 0
  for (let e: HTMLElement | null = el; e && e.parentElement; e = e.parentElement) {
    const parent = e.parentElement
    const ps = getComputedStyle(parent)
    total += (parseFloat(ps.paddingBottom) || 0) + (parseFloat(ps.borderBottomWidth) || 0)
    const column = ps.display.includes('flex') && ps.flexDirection.startsWith('column')
    const gap = column || ps.display.includes('grid') ? parseFloat(ps.rowGap) || 0 : 0
    for (let sib = e.nextElementSibling as HTMLElement | null; sib; sib = sib.nextElementSibling as HTMLElement | null) {
      const cs = getComputedStyle(sib)
      if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') continue
      // The scroll assistant's spacer only exists while the page scrolls: counting it would shrink the game for nothing.
      if (sib.hasAttribute('data-scroll-spacer')) continue
      total += sib.offsetHeight + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0) + gap
    }
    if (parent === document.body) break
  }
  return total
}

/** Scale that fits `natural` px of content into `available` px: 1 when it fits, never below `min`. */
export function screenFitScale(available: number, natural: number, min: number): number {
  if (natural <= 0 || available <= 0 || available >= natural) return 1
  return Math.max(min, Math.floor((available / natural) * 1000) / 1000)
}

interface Props {
  children: ReactNode
  /** Outer box: takes the place of the body in the shell (flex: 1, centring…). */
  className?: string
  /** Inner box: the body's own layout (flex column, gap…). It must NOT grow to fill (no flex: 1, no height: 100%). */
  innerClassName?: string
  /** Smallest scale (default: by device, see minScreenFit). */
  min?: number
}

export function FitToScreen({ children, className, innerClassName, min: minProp }: Props) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, natural: 0 })

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    let frame = 0
    const measure = () => {
      frame = 0
      const natural = inner.offsetHeight
      const top = outer.getBoundingClientRect().top + window.scrollY
      const available = window.innerHeight - top - trailingSpace(outer) - BOTTOM_GAP
      const raw = screenFitScale(available, natural, minProp ?? minScreenFit())
      setFit((f) => {
        const scale = settleScale(f.scale, raw)
        return f.scale === scale && f.natural === natural ? f : { scale, natural }
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure) }
    measure()
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver === 'function') {
      ro = new ResizeObserver(schedule)
      ro.observe(inner)
      // The outer box changes height when the scale does; in a centring parent that moves it, so measure again until
      // the scale settles (setFit ignores an unchanged scale, which ends the loop).
      ro.observe(outer)
      // What comes after the body (feedback, «Siguiente», «No lo sé») can appear later: its ancestors then change size.
      for (let e = outer.parentElement; e && e !== document.body; e = e.parentElement) ro.observe(e)
    }
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('orientationchange', schedule)
      ro?.disconnect()
    }
  }, [minProp])

  const shrunk = fit.scale < 1
  return (
    <div
      ref={outerRef}
      className={className}
      data-fit-scale={shrunk ? fit.scale : undefined}
      style={shrunk ? { height: Math.ceil(fit.natural * fit.scale), flex: 'none', justifyContent: 'flex-start' } : undefined}
    >
      <div
        ref={innerRef}
        className={innerClassName}
        data-fit-inner=""
        style={shrunk
          ? ({ transform: `scale(${fit.scale})`, transformOrigin: 'top center', '--fit-scale': fit.scale } as CSSProperties)
          : undefined}
      >
        {children}
      </div>
    </div>
  )
}
