/* <ScrollAssist> — big «⬇» / «⬆» buttons when part of the page is off screen.

   On a small tablet (a 1000 × 600 Galaxy Tab with the browser bars leaves ~490 px) a game cannot always fit, even
   shrunk (FitToScreen). Children do not know they have to scroll, and a swipe that starts on a writing surface
   (touch-action: none) does not scroll. A tap always works: «⬇» shows while there is more below, «⬆» once the
   child has gone down (to write in a field above). Hidden when the whole page fits. */
import { useEffect, useState } from 'react'
import s from './ScrollAssist.module.css'

/** Pixels that may stay hidden before the buttons show (sub-pixel rounding, a shadow). */
const SLACK = 16
/** Scroll (px) after which «⬆» shows: past the game header. */
const UP_AFTER = 120

function measure() {
  const el = document.scrollingElement ?? document.documentElement
  const below = el.scrollHeight - window.innerHeight - window.scrollY
  // «⬆» only once the header is gone, so it never sits on «Salir» or the round counter.
  return { down: below > SLACK, up: window.scrollY > UP_AFTER }
}

export function ScrollAssist() {
  const [state, setState] = useState({ down: false, up: false })

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const next = measure()
      setState((prev) => (prev.down === next.down && prev.up === next.up ? prev : next))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Content grows and shrinks without a scroll or a resize (feedback, a new round): check twice a second.
    const timer = window.setInterval(schedule, 500)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.clearInterval(timer)
    }
  }, [])

  const smooth = typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const go = (dir: 1 | -1) => {
    const el = document.scrollingElement ?? document.documentElement
    const top = dir > 0 ? el.scrollHeight : 0
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <>
      {state.up && (
        <button type="button" className={`${s.btn} ${s.up}`} onClick={() => go(-1)} aria-label="Subir">
          <span aria-hidden>⬆</span>
        </button>
      )}
      {state.down && (
        <button type="button" className={`${s.btn} ${s.down}`} onClick={() => go(1)} aria-label="Ver lo de abajo">
          <span aria-hidden>⬇</span>
          <span className={s.label}>Más abajo</span>
        </button>
      )}
    </>
  )
}
