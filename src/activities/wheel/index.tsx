/* "La rueda del 6": a spinning wheel with the table in its centre. The pointer picks the next number of the ring;
   the child writes centre × number, then the wheel turns and the ring fills with the products. */
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { makeFactMul } from '@/engine'
import { sfx } from '@/audio'
import type { ActivityProps, Exercise, ExerciseOutcome, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import FactView from '../views/FactView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './wheel.module.css'

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
  const [products, setProducts] = useState<(number | null)[]>(() => numbers.map(() => null))
  const n = numbers.length
  const step = 360 / Math.max(1, n)
  // The wheel turns so that the current number sits under the pointer at the top.
  const rotation = -session.index * step

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const ex: Exercise | undefined = items[session.index]

  const handle = (o: ExerciseOutcome) => {
    if (!ex) return
    host.reportAttempt({ exercise: ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    const ok = o.check.correct
    if (ok) {
      setProducts((p) => p.map((v, i) => (i === session.index ? center * numbers[i] : v)))
    }
    sfx.play('whoosh')
    host.react(ok ? 'correct' : 'wrong', { errorType: o.check.errorType })
    window.setTimeout(() => session.answered(ok), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={items.length}
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
              const done = products[i] !== null
              const current = i === session.index
              return (
                // Each slot turns back by the wheel's angle, so its number always reads upright.
                <motion.g
                  key={i}
                  data-state={done ? 'done' : current ? 'current' : 'open'}
                  style={{ transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
                  animate={{ rotate: -rotation }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 16 }}
                >
                  <circle cx={x} cy={y} r={25} className={`${s.slot} ${done ? s.slotDone : ''} ${current ? s.slotCurrent : ''}`} />
                  <text x={x} y={y + 9} textAnchor="middle" className={s.num}>{done ? products[i] : num}</text>
                </motion.g>
              )
            })}
          </motion.g>
          <circle cx={CX} cy={CY} r={38} className={s.hub} />
          <text x={CX} y={CY + 13} textAnchor="middle" className={s.hubNum}>×{center}</text>
          <polygon points={`${CX - 14},${CY - R - 42} ${CX + 14},${CY - R - 42} ${CX},${CY - R - 14}`} className={s.pointer} />
        </svg>
        <p className={s.caption}>Número {session.index + 1} de {n}: {numbers[session.index]}</p>
      </div>
      {ex && (
        <div key={`${ex.id}-${session.index}`} className={shared.card}>
          <FactView exercise={ex} onAnswered={handle} allowHints compact />
        </div>
      )}
    </ActivityFrame>
  )
}
