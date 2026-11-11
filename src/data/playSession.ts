/* A play session for a screen that does not run inside GameHostProvider (Caligrafía con lápiz): started on mount,
   touched every minute, ended on unmount, the same bookkeeping as GameHost. Without it the screen's minutes were never
   written down. The screen counts its graded answers on the returned ref, so the session summary carries them. */
import { useEffect, useRef, type MutableRefObject } from 'react'
import type { SessionSubject } from '@/types'
import { endSession, startSession, touchSession } from './activity'

/** How often an open session is touched (its minutes saved), in ms. */
export const PLAY_SESSION_TOUCH_MS = 60_000

export interface PlaySessionTally {
  /** The session id once it exists (null before it is created, and after the screen closes). */
  id: string | null
  startedAt: number
  attempts: number
  correct: number
}

function reportError(where: string, e: unknown) {
  if (import.meta.env.DEV) console.warn(`[play-session] ${where}`, e)
}

const wholeMinutes = (from: number) => Math.max(0, Math.round((Date.now() - from) / 60_000))

export function usePlaySession(childId: string | null | undefined, subject: SessionSubject): MutableRefObject<PlaySessionTally> {
  const ref = useRef<PlaySessionTally>({ id: null, startedAt: Date.now(), attempts: 0, correct: 0 })
  useEffect(() => {
    if (!childId) return
    const session = ref.current
    session.id = null
    session.startedAt = Date.now()
    session.attempts = 0
    session.correct = 0
    let open = true
    let timer: ReturnType<typeof setInterval> | undefined
    startSession(childId, subject)
      .then((s) => {
        if (!open) {
          // Closed before the session was created: end it right away.
          void endSession(s.id, null).catch((e) => reportError('endSession', e))
          return
        }
        session.id = s.id
        timer = setInterval(() => {
          if (session.id) void touchSession(session.id, { minutes: wholeMinutes(session.startedAt) }).catch((e) => reportError('touchSession', e))
        }, PLAY_SESSION_TOUCH_MS)
      })
      .catch((e) => reportError('startSession', e))
    return () => {
      open = false
      if (timer) clearInterval(timer)
      const id = session.id
      session.id = null
      if (!id) return
      const minutes = wholeMinutes(session.startedAt)
      void endSession(id, {
        attempts: session.attempts,
        correct: session.correct,
        starsEarned: 0,
        nodesCompleted: [],
        ...(subject === 'math' ? {} : { subject }),
      }).catch((e) => reportError('endSession', e))
      void touchSession(id, { minutes }).catch(() => undefined)
    }
  }, [childId, subject])
  return ref
}
