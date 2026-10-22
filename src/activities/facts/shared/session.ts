/* Session bookkeeping for an activity run: counts correct answers, tracks elapsed time and builds the result. */
import { useRef, useState } from 'react'
import { starsFor } from '@/engine'
import type { ActivityResult } from '@/types'
import { now } from './flow'

export interface SessionOptions {
  total: number
  thresholds?: [number, number, number]
}

export interface Session {
  /** 0-based index of the current item. */
  index: number
  correct: number
  total: number
  /** Set once the run has ended; the activity shows the result card until the child presses continue. */
  result: ActivityResult | null
  /** Record one finished item. Ends the run after the last planned item (and after any re-asks scheduled by
   *  `requeued`, see shared/requeue.ts: a re-ask extends the run by one item). */
  answered: (ok: boolean, requeued?: boolean) => void
  /** Elapsed ms since the run started. */
  elapsed: () => number
  startedAt: number
}

export function useSession({ total, thresholds }: SessionOptions): Session {
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [result, setResult] = useState<ActivityResult | null>(null)
  const started = useRef(now())
  const indexRef = useRef(0)
  const correctRef = useRef(0)
  const endedRef = useRef(false)
  const extraRef = useRef(0)

  const answered = (ok: boolean, requeued = false) => {
    if (endedRef.current) return
    if (ok) {
      correctRef.current += 1
      setCorrect(correctRef.current)
    }
    if (requeued) extraRef.current += 1
    indexRef.current += 1
    setIndex(indexRef.current)
    if (indexRef.current >= total + extraRef.current) {
      endedRef.current = true
      const ms = Math.round(now() - started.current)
      setResult({
        correct: correctRef.current,
        total,
        stars: starsFor(correctRef.current, total, thresholds),
        ms,
      })
    }
  }

  return {
    index,
    correct,
    total,
    result,
    answered,
    elapsed: () => Math.round(now() - started.current),
    startedAt: started.current,
  }
}
