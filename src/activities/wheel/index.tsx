/* "La rueda del 6": a spinning wheel with the table in its centre. The pointer picks the next number of the ring;
   the child writes centre × number, then the wheel turns and the ring fills with the products. A wrong answer
   comes back 2–4 questions later (shared/requeue.ts); the product shows in its slot only when it has no more chances. */
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { makeFactMul } from '@/engine'
import { sfx } from '@/audio'
import type { ActivityProps, ExerciseOutcome, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import FactView from '../views/FactView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { useSession } from '../facts/shared/session'
import { requeueWrong, startQueue } from '../shared/requeue'
import shared from '../facts/shared/shared.module.css'
import s from './wheel.module.css'

/** A filled slot: the product, and whether it is shown as the answer the child did not reach (revealed). */
interface Filled { value: number; revealed: boolean }

const ADVANCE_OK_MS = 900
const ADVANCE_WRONG_MS = 1100
const CX = 150
const CY = 150
const R = 104

function numbersFrom(params: Record<string, unknown> | undefined): { center: number; numbers: number[] } {
  const center = typeof params?.center === 'number' ? params.center : 6
  const list = Array.isArray(params?.numbers) ? (params.numbers as unknown[]).filter((x): x is number => typeof x === 'number') : []
  return { center, numbers: list.length ? list : [2, 3, 4, 5, 6, 7, 8, 9] }
}

export default function WheelActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const { center, numbers } = numbersFrom(config.params)
  const [items] = useState<FactMulExercise[]>(() => numbers.map((n) => makeFactMul(center, n)))
  const session = useSession({ total: items.length, thresholds: config.starThresholds })
  // Planned numbers plus the re-asks of wrong answers: the queue sets the order, the ring keeps its slots.
  const [run, setRun] = useState(() => startQueue(items))
  const [products, setProducts] = useState<(Filled | null)[]>(() => numbers.map(() => null))
  const n = numbers.length
  const step = 360 / Math.max(1, n)
  const slot = run.slots[session.index]
  const ex: FactMulExercise | undefined = slot?.item
  // Position of the current number in the ring.
  const pos = ex ? items.indexOf(ex) : 0
  // The wheel turns so that the current number sits under the pointer at the top.
  const rotation = -pos * step

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const handle = (o: ExerciseOutcome) => {
    if (!ex || !slot) return
    // A re-ask is practice: it is not reported again and does not count as a planned answer.
    if (!slot.retry) host.reportAttempt({ exercise: ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    const ok = o.check.correct
    const requeued = ok || slot.retry ? null : requeueWrong(run, session.index)
    if (requeued) setRun(requeued)
    // The slot fills with the product on a right answer, and shows it as revealed once the fact has no more chances.
    if (ok || !requeued) {
      setProducts((p) => p.map((v, i) => (i === pos ? { value: center * numbers[i], revealed: !ok } : v)))
    }
    sfx.play('whoosh')
    host.react(ok ? 'correct' : 'wrong', { errorType: o.check.errorType })
    window.setTimeout(() => session.answered(ok && !slot.retry, !!requeued), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={run.slots.length}
      accent="var(--w5)"
      accentSoft="var(--w5-soft)"
      onExit={onExit}
    >
      <div className={s.wheelWrap}>
        <svg viewBox="0 0 300 300" className={s.wheel} role="img" aria-label={`Rueda del ${center}`}>
          <circle cx={CX} cy={CY} r={R + 34} className={s.rim} />
          <motion.g
            style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: 'view-box' }}
            animate={{ rotate: rotation }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
          >
            {numbers.map((num, i) => {
              const angle = (-90 + i * step) * (Math.PI / 180)
              const x = CX + R * Math.cos(angle)
              const y = CY + R * Math.sin(angle)
              const filled = products[i]
              const done = filled !== null
              const current = i === pos
              return (
                // Each slot turns back by the wheel's angle, so its number always reads upright.
                <motion.g
                  key={i}
                  data-state={done ? (filled.revealed ? 'revealed' : 'done') : current ? 'current' : 'open'}
                  style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
                  animate={{ rotate: -rotation }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
                >
                  <circle cx={x} cy={y} r={25} className={`${s.slot} ${done ? s.slotDone : ''} ${filled?.revealed ? s.slotRevealed : ''} ${current ? s.slotCurrent : ''}`} />
                  <text x={x} y={y + 9} textAnchor="middle" className={s.num}>{done ? filled.value : num}</text>
                </motion.g>
              )
            })}
          </motion.g>
          <circle cx={CX} cy={CY} r={38} className={s.hub} />
          <text x={CX} y={CY + 13} textAnchor="middle" className={s.hubNum}>×{center}</text>
          <polygon points={`${CX - 14},${CY - R - 42} ${CX + 14},${CY - R - 42} ${CX},${CY - R - 14}`} className={s.pointer} />
        </svg>
        <p className={s.caption}>
          {slot?.retry ? 'Otra vez. ' : ''}Número {pos + 1} de {n}: {numbers[pos]}
        </p>
      </div>
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          {/* After the help the child writes the product (teach 'full'): seeing the answer is not enough. */}
          <FactView exercise={ex} onAnswered={handle} allowHints compact teach="full" />
        </div>
      )}
    </ActivityFrame>
  )
}
