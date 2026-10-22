/* Small media-query hooks for the lesson player. Safe without window.matchMedia (tests, SSR). */
import { useEffect, useState } from 'react'

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

/** Subscribes to a media query and returns whether it currently matches. */
export function useMediaQuery(query: string): boolean {
  const [on, setOn] = useState(() => matches(query))
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const update = () => setOn(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [query])
  return on
}

export function useReducedMotionFlag(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function usePortrait(): boolean {
  return useMediaQuery('(orientation: portrait)')
}
