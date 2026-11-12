/* <ExerciseLayout> — the frame every exercise view shares (P3PE-01, P3PE-06): the statement on top (the one statement
   style, ≥ 20 px on screen even in a shrunk game), then the work, then the answer bar. On a short tablet in landscape
   the statement and the answer bar sit on the left and the work on the right, so «Comprobar» is always in view.
   The styles live in src/styles/exercise.css (.ex-layout, .ex-prompt, .ex-prompt-sub).

   On that short screen the page may still scroll (a box that takes the focus, or its keypad, scrolls the work into
   view). The answer bar then follows the window down its column, so «Comprobar» never goes off the top. CSS
   position: sticky cannot do it here: the game is drawn scaled (FitToScreen, transform: scale), and a transformed
   ancestor stops sticky positioning; the bar is moved by hand instead (followWindow). */
import clsx from 'clsx'
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'

/** The layout with the answer bar beside the work (src/styles/exercise.css). */
export const SIDE_LAYOUT_QUERY = '(orientation: landscape) and (max-height: 600px)'
/** Space kept between the top of the window and a bar that follows it (px on screen). */
const FOLLOW_GAP = 8

export interface ExerciseLayoutProps extends Omit<HTMLAttributes<HTMLElement>, 'prompt'> {
  /** The statement: what to do, in one short sentence. */
  prompt?: ReactNode
  /** Optional second line (how to do it). */
  sub?: ReactNode
  /** The answer bar (Pista, Comprobar) or the view's own buttons. */
  actions?: ReactNode
  /** Class of the work box (the view's own layout: a flex column with its gap). */
  workClassName?: string
  children?: ReactNode
  /** Data attributes the e2e and the views read (data-kind, data-status…). */
  [data: `data-${string}`]: string | undefined
}

/**
 * How far (CSS px of the bar, before any scale) the bar must move down so its top stays FOLLOW_GAP below the window's
 * top, without leaving its section (unless that is the only way to see it). `top` and `sectionBottom`, `height` are on screen; `scale` is the on-screen scale.
 */
export function followShift(top: number, height: number, sectionBottom: number, scale: number): number {
  const want = FOLLOW_GAP - top
  if (want <= 0) return 0
  // Within its section; and when the section itself is nearly gone (only a keypad below it is in view), at least far
  // enough to be seen whole at the top of the window.
  const room = Math.max(sectionBottom - (top + height), FOLLOW_GAP - top)
  const shift = Math.min(want, Math.max(0, room))
  return shift > 0 ? shift / (scale || 1) : 0
}

/** The nearest box around `el` drawn scaled: FitToScreen's inner box, or any ancestor with an inline transform (the
    lesson's TrySlot), whose style changes when the scale does. */
export function scaledBox(el: Element | null): HTMLElement | null {
  for (let node = el?.parentElement ?? null; node; node = node.parentElement) {
    if (node.hasAttribute('data-fit-inner') || /scale\(/.test(node.style.transform)) return node
  }
  return null
}

export function ExerciseLayout({ prompt, sub, actions, workClassName, className, children, ...rest }: ExerciseLayoutProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  // followWindow: keep the answer bar in view on the short screen while the page scrolls.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(SIDE_LAYOUT_QUERY)
    let frame = 0
    const place = () => {
      frame = 0
      const bar = actionsRef.current
      const section = sectionRef.current
      if (!bar || !section) return
      bar.style.transform = ''
      if (!mq.matches) return
      const r = bar.getBoundingClientRect()
      const scale = bar.offsetHeight ? r.height / bar.offsetHeight : 1
      const shift = followShift(r.top, r.height, section.getBoundingClientRect().bottom, scale)
      if (shift > 0) bar.style.transform = `translateY(${shift}px)`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(place) }
    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    mq.addEventListener?.('change', schedule)
    // The game also moves without a scroll: FitToScreen (or a lesson's TrySlot) changes its scale (the style of its
    // inner box), or the page above it grows.
    const fitInner = scaledBox(sectionRef.current)
    const mo = typeof MutationObserver === 'function' && fitInner ? new MutationObserver(schedule) : null
    if (mo && fitInner) mo.observe(fitInner, { attributes: true, attributeFilter: ['style'] })
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
    if (ro && sectionRef.current) ro.observe(sectionRef.current)
    if (ro) ro.observe(document.body)
    return () => {
      mo?.disconnect()
      ro?.disconnect()
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      mq.removeEventListener?.('change', schedule)
    }
  }, [])

  return (
    <section ref={sectionRef} className={clsx('ex-layout', className)} {...rest}>
      {(prompt || sub) && (
        <div className="ex-head">
          {prompt && <p className="ex-prompt">{prompt}</p>}
          {sub && <p className="ex-prompt-sub">{sub}</p>}
        </div>
      )}
      <div className={clsx('ex-work', workClassName)}>{children}</div>
      {actions && <div ref={actionsRef} className="ex-actions">{actions}</div>}
    </section>
  )
}
