import { useEffect, useState, type RefObject } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * True when the ambient layers of a scene (clouds, twinkles, drifting leaves…) should stand still:
 * the child asked for reduced motion, the element has scrolled out of view, or the app is in the background.
 * The scene keeps its first frame, so nothing jumps and no CPU goes to invisible loops.
 */
export function useAmbientPaused(ref: RefObject<HTMLElement | null>): boolean {
  const reduced = useReducedMotion()
  const [offscreen, setOffscreen] = useState(false)
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)

  useEffect(() => {
    const el = ref.current
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    let io: IntersectionObserver | null = null
    if (el && typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
      io.observe(el)
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      io?.disconnect()
    }
  }, [ref])

  return reduced || offscreen || hidden
}
