/* The answer bar of the facts views (FactView, MissingFactorView, SkipCountView, DoubleChainView, FactFamilyView):
   «Pista» and the one «✓ Comprobar» of the screen, in the same bar the other views have (AnswerBar), so the exercise
   layout puts it in the same place. These views grade by themselves (a flow with its own tries and clues), so the bar
   has no «Siguiente»: when the exercise is done, the screen around it moves on. While the bar is mounted the writing
   pads hide their own ✓; a tap on «Comprobar» right after writing first reads the pending ink (as AnswerBar does). */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/ui'
import { useInkStoreState } from '@/ink/hooks'
import { READ_PAUSE_MS } from '../groups/AnswerBar'
import s from '../groups/AnswerBar.module.css'

export interface FactViewBarProps {
  /** Show the hint button. */
  allowHints: boolean
  hintsShown: number
  hintsTotal: number
  canHint: boolean
  onHint: () => void
  /** Runs the view's own check (the same path as Enter). */
  onCheck: () => void
  /** There is something written to check. */
  canCheck: boolean
  /** The exercise is finished: no more checking. */
  done: boolean
}

export function FactViewBar({ allowHints, hintsShown, hintsTotal, canHint, onHint, onCheck, canCheck, done }: FactViewBarProps) {
  const store = useInkStoreState()
  useEffect(() => store.mountBar(), [store])
  const [reading, setReading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  // The view's check of the latest render: after reading the ink, the digits just read are in its state.
  const checkRef = useRef(onCheck)
  useLayoutEffect(() => { checkRef.current = onCheck })

  const busy = store.isBusy()
  const runCheck = () => {
    if (reading) return
    if (!store.flushInk()) { onCheck(); return }
    setReading(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setReading(false)
      checkRef.current()
    }, READ_PAUSE_MS)
  }
  const checkable = canCheck || busy

  return (
    <div className={s.bar} role="group" aria-label="Respuesta">
      <div className={s.side}>
        {allowHints && (
          <Button variant="secondary" size="md" onClick={onHint} disabled={!canHint}>
            {`💡 Pista ${hintsShown} de ${hintsTotal}`}
          </Button>
        )}
      </div>
      <div className={s.message} aria-live="polite" />
      <div className={s.side}>
        {!done && (
          <Button variant="success" size="lg" onClick={runCheck} disabled={!checkable || reading} aria-busy={reading || busy || undefined}>
            {reading || busy ? 'Leyendo…' : '✓ Comprobar'}
          </Button>
        )}
      </div>
    </div>
  )
}
