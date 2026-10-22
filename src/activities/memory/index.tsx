/* "Parejas del arcoíris": match each multiplication card with its product card. A wrong pair is a gentle clue;
   the fact of a wrong try is logged as an attempt. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { check } from '@/engine'
import { haptics, sfx } from '@/audio'
import { celebrate } from '@/fx'
import type { ActivityProps, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { now } from '../facts/shared/flow'
import { useItems } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import s from './memory.module.css'

interface Pair { ex: FactMulExercise; product: number }
interface Card { id: number; pair: number; side: 'fact' | 'product'; label: string }

/** Keeps one exercise per product and per unordered pair of factors, so every product card is unambiguous. */
function uniquePairs(exs: FactMulExercise[], max: number): Pair[] {
  const products = new Set<number>()
  const out: Pair[] = []
  for (const ex of exs) {
    if (ex.kind !== 'fact-mul') continue
    const product = ex.a * ex.b
    if (products.has(product)) continue
    products.add(product)
    out.push({ ex, product })
    if (out.length >= max) break
  }
  return out
}

export default function MemoryActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const want = Math.max(2, Math.min(config.count ?? 6, 8))
  const generated = useItems(config, want * 3, host)
  const pairs = useMemo(() => uniquePairs(generated as FactMulExercise[], want), [generated, want])
  const session = useSession({ total: pairs.length, thresholds: config.starThresholds })
  const cards = useMemo<Card[]>(() => {
    const all = pairs.flatMap((p, i): Card[] => [
      { id: i * 2, pair: i, side: 'fact', label: `${p.ex.a} × ${p.ex.b}` },
      { id: i * 2 + 1, pair: i, side: 'product', label: String(p.product) },
    ])
    const order = [...all]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(host.rng() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    return order
    // The board is built once per activity run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairs])

  const [matched, setMatched] = useState<Set<number>>(() => new Set())
  const [selected, setSelected] = useState<Card | null>(null)
  const [mistakes, setMistakes] = useState<Set<number>>(() => new Set())
  const [shake, setShake] = useState<{ ids: number[]; key: number } | null>(null)
  const [clue, setClue] = useState<string | null>(null)
  const [pairStart, setPairStart] = useState(() => now())

  if (session.result) {
    const result = session.result
    return (
      <div className={s.center}>
        <ResultCard result={result} onContinue={() => onDone(result)} />
      </div>
    )
  }

  const pick = (card: Card) => {
    if (matched.has(card.pair) || selected?.id === card.id) return
    if (!selected || selected.side === card.side) {
      setSelected(card)
      if (!selected) setPairStart(now())
      sfx.play('select')
      return
    }
    const factCard = selected.side === 'fact' ? selected : card
    const productCard = selected.side === 'product' ? selected : card
    const pair = pairs[factCard.pair]
    if (factCard.pair === productCard.pair) {
      const ms = Math.round(now() - pairStart)
      const value = Number(productCard.label)
      const res = check(pair.ex, { type: 'number', value })
      host.reportAttempt({ exercise: pair.ex, check: res, ms, inputMode: 'tap', hintsUsed: 0 })
      const ok = !mistakes.has(factCard.pair)
      setMatched((m) => new Set([...m, factCard.pair]))
      setSelected(null)
      setClue(null)
      sfx.play('correct')
      haptics.success()
      celebrate('small')
      host.react('correct')
      window.setTimeout(() => session.answered(ok), 350)
      return
    }
    // Wrong pair: the fact of the card that was chosen is the one to practise.
    const value = Number(productCard.label)
    const res = check(pair.ex, { type: 'number', value })
    host.reportAttempt({ exercise: pair.ex, check: res, ms: Math.round(now() - pairStart), inputMode: 'tap', hintsUsed: 0 })
    setMistakes((m) => new Set([...m, factCard.pair]))
    setShake({ ids: [selected.id, card.id], key: Date.now() })
    setSelected(null)
    sfx.play('wrong')
    haptics.error()
    host.react('wrong', { errorType: res.errorType })
    setClue(res.feedback ? host.t(res.feedback) : '¡Casi! Esa pareja no encaja. ¡Prueba otra!')
  }

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={pairs.length}
      accent="var(--w7)"
      accentSoft="var(--w7-soft)"
      onExit={onExit}
    >
      <div className={s.board} style={{ gridTemplateColumns: `repeat(${cards.length > 8 ? 4 : 3}, minmax(0, 1fr))` }} role="group" aria-label="Tablero de parejas">
        {cards.map((card) => {
          const done = matched.has(card.pair)
          const picked = selected?.id === card.id
          const wrong = shake?.ids.includes(card.id) ?? false
          return (
            <motion.button
              key={card.id}
              type="button"
              className={clsx(s.card, card.side === 'product' ? s.product : s.fact, picked && s.picked, done && s.done)}
              onClick={() => pick(card)}
              disabled={done}
              aria-pressed={picked}
              aria-label={card.side === 'fact' ? `Multiplicación ${card.label}` : `Resultado ${card.label}`}
              animate={
                done && !reduce
                  ? { scale: 0.92, opacity: 0.55 }
                  : wrong && !reduce
                    ? { x: [0, -8, 8, -5, 5, 0] }
                    : { scale: 1, opacity: 1, x: 0 }
              }
              transition={{ duration: 0.35 }}
              data-shake={wrong && shake ? shake.key : undefined}
            >
              {done ? '✓' : card.label}
            </motion.button>
          )
        })}
      </div>
      <p className={clsx(shared.clue, !clue && s.quiet)} role="status" aria-live="polite">
        {clue ?? 'Toca una multiplicación y después su resultado.'}
      </p>
    </ActivityFrame>
  )
}
