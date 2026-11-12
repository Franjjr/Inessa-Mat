/* <ScrollAssist> — big «⬇» / «⬆» buttons when part of the page is off screen.

   On a small tablet (a 1000 × 600 Galaxy Tab with the browser bars leaves ~490 px) a game cannot always fit, even
   shrunk (FitToScreen). Children do not know they have to scroll, and a swipe that starts on a writing surface
   (touch-action: none) does not scroll. A tap always works: «⬇» shows while there is more below, «⬆» once the
   child has gone down (to write in a field above). Hidden when the whole page fits.

   Never on top of a control (P3PE-12, P6-08): each button looks (elementsFromPoint) at what is under it, and moves to
   the other corner of its edge when it would cover a button, a box or a link there. And while the page scrolls, a
   spacer as tall as the button closes the page, so at the bottom nothing of the child's sits under «⬇» or «⬆». */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import s from './ScrollAssist.module.css'

/** Pixels that may stay hidden before the buttons show (sub-pixel rounding, a shadow). */
const SLACK = 16
/** Scroll (px) after which «⬆» shows: past the game header. */
const UP_AFTER = 120
/** Height of the space kept free at the end of a page that scrolls: a button and its margin. */
export const SPACER = 84
/** Distance of a button from the side of the window (ScrollAssist.module.css: .atLeft, .atRight). */
const EDGE = 14

type Side = 'left' | 'right'

/** What a child can tap or write in: a button over one of these hides it. */
const CONTROL = 'button, a[href], input, textarea, select, [role="button"], [role="textbox"], [role="slider"], [tabindex]:not([tabindex="-1"]), canvas'

/** Whether the rectangle covers a control of the page (anything but the assistant's own buttons). */
export function coversControl(rect: { left: number; top: number; right: number; bottom: number }, own: Element | null): boolean {
  if (typeof document.elementsFromPoint !== 'function') return false
  const xs = [rect.left + 4, (rect.left + rect.right) / 2, rect.right - 4]
  const ys = [rect.top + 4, (rect.top + rect.bottom) / 2, rect.bottom - 4]
  for (const x of xs) {
    for (const y of ys) {
      for (const el of document.elementsFromPoint(x, y)) {
        if (own && own.contains(el)) continue
        if (el.closest('[data-scroll-assist]')) continue
        if (el.closest(CONTROL)) return true
      }
    }
  }
  return false
}

function measure(spacerOn: boolean) {
  const el = document.scrollingElement ?? document.documentElement
  // The spacer is the assistant's own: it never makes the page «longer» by itself.
  const height = el.scrollHeight - (spacerOn ? SPACER : 0)
  const below = height - window.innerHeight - window.scrollY
  // «⬆» only once the header is gone, so it never sits on «Salir» or the round counter.
  return { down: below > SLACK, up: window.scrollY > UP_AFTER, scrolls: height > window.innerHeight + SLACK }
}

export function ScrollAssist() {
  const [state, setState] = useState({ down: false, up: false, scrolls: false })
  const [downSide, setDownSide] = useState<Side>('left')
  const [upSide, setUpSide] = useState<Side>('right')
  const downRef = useRef<HTMLButtonElement>(null)
  const upRef = useRef<HTMLButtonElement>(null)
  const spacerOn = useRef(false)
  spacerOn.current = state.scrolls

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const next = measure(spacerOn.current)
      setState((prev) => (prev.down === next.down && prev.up === next.up && prev.scrolls === next.scrolls ? prev : next))
      placeButtons.current()
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Content grows and shrinks without a scroll or a resize (feedback, a new round, a picture that loads). The observers
    // react at once, but they miss layouts whose <html>/<body> keep their size while the content overflows (seen in the
    // e2e: «No lo sé» out of reach at 1000 × 490 without «Más abajo»), so the twice-a-second check stays as the safety net.
    const timer = window.setInterval(schedule, 500)
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null
    resizeObserver?.observe(document.documentElement)
    resizeObserver?.observe(document.body)
    const mutationObserver = typeof MutationObserver === 'function' ? new MutationObserver(schedule) : null
    mutationObserver?.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.clearInterval(timer)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [])

  // Each shown button looks at what is under it and takes the other corner of its edge when it covers a control there
  // (and the other corner is free): after each render, and on every check of the effect above (the page under a fixed
  // button changes without a render here).
  const sides = useRef({ down: downSide, up: upSide })
  sides.current = { down: downSide, up: upSide }
  const placeButtons = useRef(() => {})
  placeButtons.current = () => {
    const place = (btn: HTMLButtonElement | null, side: Side, set: (s: Side) => void) => {
      if (!btn) return
      // Both corners of the edge, from the button's size (not from where it is drawn now: no back and forth).
      const r = btn.getBoundingClientRect()
      const w = r.right - r.left
      const at = (s: Side) => (s === 'left'
        ? { left: EDGE, right: EDGE + w, top: r.top, bottom: r.bottom }
        : { left: window.innerWidth - EDGE - w, right: window.innerWidth - EDGE, top: r.top, bottom: r.bottom })
      const other: Side = side === 'left' ? 'right' : 'left'
      if (coversControl(at(side), btn) && !coversControl(at(other), btn)) set(other)
    }
    place(downRef.current, sides.current.down, setDownSide)
    place(upRef.current, sides.current.up, setUpSide)
  }
  useLayoutEffect(() => { placeButtons.current() })

  const smooth = typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const go = (dir: 1 | -1) => {
    const el = document.scrollingElement ?? document.documentElement
    const top = dir > 0 ? el.scrollHeight : 0
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <>
      {state.scrolls && <div className={s.spacer} style={{ height: SPACER }} data-scroll-spacer="" aria-hidden />}
      {state.up && (
        <button ref={upRef} type="button" className={`${s.btn} ${s.up} ${upSide === 'left' ? s.atLeft : s.atRight}`} onClick={() => go(-1)} aria-label="Subir" data-scroll-assist="">
          <span aria-hidden>⬆</span>
        </button>
      )}
      {state.down && (
        <button ref={downRef} type="button" className={`${s.btn} ${s.down} ${downSide === 'left' ? s.atLeft : s.atRight}`} onClick={() => go(1)} aria-label="Ver lo de abajo" data-scroll-assist="">
          <span aria-hidden>⬇</span>
          <span className={s.label}>Más abajo</span>
        </button>
      )}
    </>
  )
}
