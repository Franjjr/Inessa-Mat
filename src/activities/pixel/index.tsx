/* "El cristal escondido": a hidden picture. Each question is a fact; answering it reveals every cell that shares
   its product (the '.' cells are revealed by a generic fact). The picture appears as the child answers. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { celebrate } from '@/fx'
import { makeFactMul } from '@/engine'
import type { ActivityProps, ExerciseOutcome, Exercise } from '@/types'
import { useActivityHost } from '../host'
import FactView from '../views/FactView'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { shuffleWith } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './pixel.module.css'

interface Legend { product?: number; color: string; name: string }
interface Question { key: string; ex: Exercise }

const ADVANCE_OK_MS = 900
const ADVANCE_WRONG_MS = 1200

function factsWithProduct(p: number, tables: number[] | undefined, range: [number, number]): [number, number][] {
  const out: [number, number][] = []
  for (let a = 1; a <= 10; a++) {
    for (let b = 1; b <= 10; b++) {
      if (a * b !== p) continue
      if (tables && tables.length && !tables.includes(a) && !tables.includes(b)) continue
      if (b < range[0] || b > range[1] || a < range[0] || a > range[1]) continue
      out.push([a, b])
    }
  }
  return out
}

function legendOf(params: Record<string, unknown> | undefined): { picture: string[]; legend: Record<string, Legend> } {
  const picture = Array.isArray(params?.picture) ? (params!.picture as string[]) : ['0']
  const legend = (params?.legend ?? {}) as Record<string, Legend>
  return { picture, legend }
}

export default function PixelActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const { picture, legend } = legendOf(config.params)
  const tables = config.selector.tables
  const range: [number, number] = config.selector.factorRange ?? [1, 10]
  const cols = Math.max(...picture.map((row) => row.length))
  const keys = useMemo(() => {
    const out: string[] = []
    for (const row of picture) for (const ch of row) if (!out.includes(ch)) out.push(ch)
    return out
  }, [picture])

  const questions = useMemo<Question[]>(() => {
    const productKeys = keys.filter((k) => legend[k]?.product !== undefined)
    const usedProducts = new Set(productKeys.map((k) => legend[k].product!))
    const list: Question[] = []
    for (const k of shuffleWith(productKeys, host.rng)) {
      const p = legend[k].product!
      const options = factsWithProduct(p, tables, range)
      if (options.length === 0) continue
      const [a, b] = options[Math.floor(host.rng() * options.length)]
      list.push({ key: k, ex: makeFactMul(a, b) })
    }
    if (keys.includes('.') && !legend['.']?.product) {
      // Generic fact: any other product from the selector's tables, not used by a coloured group.
      const pool: [number, number][] = []
      for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
        const p = a * b
        if (usedProducts.has(p)) continue
        if (tables && tables.length && !tables.includes(a) && !tables.includes(b)) continue
        if (b < range[0] || b > range[1]) continue
        pool.push([a, b])
      }
      if (pool.length) {
        const [a, b] = pool[Math.floor(host.rng() * pool.length)]
        list.push({ key: '.', ex: makeFactMul(a, b) })
      }
    }
    const max = config.count ?? list.length
    return list.slice(0, Math.max(1, Math.min(max, list.length)))
    // The picture is fixed per activity node, so the questions are built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const session = useSession({ total: questions.length, thresholds: config.starThresholds })
  // Groups without a usable fact are shown from the start; the others open when their question is answered.
  const [revealed, setRevealed] = useState<Set<string>>(() => {
    const asked = new Set(questions.map((q) => q.key))
    return new Set(keys.filter((k) => !asked.has(k)))
  })

  const current = questions[session.index]
  const activeKey = current?.key

  const handle = (o: ExerciseOutcome) => {
    if (!current) return
    host.reportAttempt({ exercise: current.ex, check: o.check, ms: o.ms, inputMode: o.inputMode, hintsUsed: o.hintsUsed, recognitionFixes: o.recognitionFixes })
    const ok = o.check.correct
    host.react(ok ? 'correct' : 'wrong', { errorType: o.check.errorType })
    if (ok) celebrate('small')
    setRevealed((r) => new Set([...r, current.key]))
    window.setTimeout(() => session.answered(ok), ok ? ADVANCE_OK_MS : ADVANCE_WRONG_MS)
  }

  const cellEl = (ch: string, r: number, c: number) => {
    const spec = legend[ch]
    const isRevealed = revealed.has(ch)
    const isActive = !isRevealed && ch === activeKey
    return (
      <motion.span
        key={`${r}-${c}-${isRevealed ? 'on' : 'off'}`}
        className={clsx(s.cell, isRevealed ? s.on : s.off, isActive && s.active)}
        style={isRevealed && spec ? { background: spec.color } : undefined}
        initial={isRevealed && !reduce ? { scale: 0.4, opacity: 0.3 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: isRevealed ? (r + c) * 0.01 : 0 }}
        aria-hidden
      >
        {!isRevealed && '?'}
      </motion.span>
    )
  }

  const allRevealed = keys.every((k) => revealed.has(k))
  const pictureEl = (
    <div className={s.picture} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label="Dibujo escondido">
      {picture.map((row, r) =>
        Array.from({ length: cols }, (_, c) => {
          const ch = row[c] ?? '.'
          return <span key={`${r}-${c}`} className={s.slot}>{cellEl(ch, r, c)}</span>
        }),
      )}
    </div>
  )

  if (session.result) {
    const result = session.result
    return (
      <div className={s.stage}>
        {pictureEl}
        <ResultCard
          result={result}
          onContinue={() => onDone(result)}
          extra={allRevealed ? <p className={s.caption}>¡Has descubierto el cristal!</p> : undefined}
        />
      </div>
    )
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={questions.length}
      accent="var(--w6)"
      accentSoft="var(--w6-soft)"
      onExit={onExit}
    >
      {pictureEl}
      <div className={s.legend} aria-hidden>
        {Object.entries(legend).filter(([k]) => picture.some((row) => row.includes(k))).map(([k, v]) => (
          <span key={k} className={s.key}>
            <span className={s.swatch} style={{ background: v.color }} />
            {v.name}{v.product !== undefined ? ` · ${v.product}` : ''}
          </span>
        ))}
      </div>
      {current && (
        <div key={`${current.ex.id}-${session.index}`} className={shared.card}>
          <FactView exercise={current.ex} onAnswered={handle} allowHints compact />
        </div>
      )}
    </ActivityFrame>
  )
}
