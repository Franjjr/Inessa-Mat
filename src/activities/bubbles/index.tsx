/* "Burbujas del bosque": a fact floats above; pop the bubble with the right answer. A first wrong pop is a
   gentle clue (the bubble wobbles). Timed games give each fact a soft timer that the family can switch off. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { check, generate } from '@/engine'
import { haptics, sfx } from '@/audio'
import { celebrate } from '@/fx'
import type { ActivityProps, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { now } from '../facts/shared/flow'
import { shuffleWith } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import { speakFact } from '../facts/shared/speak'
import shared from '../facts/shared/shared.module.css'
import s from './bubbles.module.css'

const TIMER_MS = 12000
const ADVANCE_MS = 700
/** popped state: a value, or this sentinel when the time ran out (the bubbles drift away). */
const TIMED_OUT = -1

interface Question { ex: FactMulExercise; options: number[] }

/** Near misses: the answers a child is most likely to confuse with the right one. */
export function distractors(a: number, b: number): number[] {
  const p = a * b
  const candidates = [p + 1, p - 1, p + a, p - a, p + b, p - b, a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b]
  const out = [...new Set(candidates.filter((x) => x > 0 && x !== p))]
  // Small facts (1×1, 2×1…) have few near misses: pad with nearby numbers so there are always enough bubbles.
  for (let d = 1; out.length < 6; d++) {
    for (const x of [p + d, p - d]) if (x > 0 && x !== p && !out.includes(x)) out.push(x)
  }
  return out
}

export default function BubblesActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const choices = Math.max(2, Math.min(typeof config.params?.choices === 'number' ? (config.params.choices as number) : 4, 6))
  const total = Math.max(1, Math.min(config.count ?? 8, 12))
  const timed = host.prefs.timedActivities
  const questions = useMemo<Question[]>(() => {
    const exs = generate({ ...config.selector, kinds: ['fact-mul'], adaptive: config.selector.adaptive ?? true }, total, {
      rng: host.rng,
      mastery: host.mastery,
    }).filter((e): e is FactMulExercise => e.kind === 'fact-mul')
    return exs.map((ex) => {
      const wrong = shuffleWith(distractors(ex.a, ex.b), host.rng).slice(0, choices - 1)
      return { ex, options: shuffleWith([ex.answer, ...wrong], host.rng) }
    })
    // Built once per activity run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const session = useSession({ total: questions.length, thresholds: config.starThresholds })
  const [answeredFirst, setAnsweredFirst] = useState(false)
  const [popped, setPopped] = useState<number | null>(null)
  const [wobble, setWobble] = useState<{ value: number; key: number } | null>(null)
  const [clue, setClue] = useState<string | null>(null)
  const [start, setStart] = useState(() => now())
  const [timeLeft, setTimeLeft] = useState(TIMER_MS)
  const q = questions[session.index]

  // Fresh state for every question.
  useEffect(() => {
    setAnsweredFirst(false)
    setPopped(null)
    setWobble(null)
    setClue(null)
    setStart(now())
    setTimeLeft(TIMER_MS)
    if (q && host.prefs.voice) speakFact(q.ex.a, q.ex.b, '×', q.ex.answer)
  }, [session.index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Soft timer (only when the family allows timed games).
  useEffect(() => {
    if (!timed || !q || popped !== null || session.result) return
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 250)), 250)
    return () => window.clearInterval(id)
  }, [timed, q, popped, session.result])

  // Time ran out: log the fact once, show the answer and let the bubbles drift away.
  useEffect(() => {
    if (!timed || !q || popped !== null || timeLeft > 0) return
    const res = check(q.ex, { type: 'number', value: null })
    host.reportAttempt({ exercise: q.ex, check: res, ms: Math.round(now() - start), inputMode: 'tap', hintsUsed: 0 })
    setPopped(TIMED_OUT)
    setClue(`¡Se fueron volando! La respuesta era ${q.ex.answer}.`)
    // Kept out of the effect above on purpose: changing `popped` must not cancel the advance.
  }, [timeLeft, timed, q, popped, host, start])

  const timedOut = popped === TIMED_OUT
  useEffect(() => {
    if (!timedOut) return
    const id = window.setTimeout(() => session.answered(false), ADVANCE_MS * 2)
    return () => window.clearTimeout(id)
    // `session.answered` only reads refs, so a stale closure is safe; `session` changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut])

  if (session.result) {
    const result = session.result
    return (
      <div className={s.center}>
        <ResultCard result={result} onContinue={() => onDone(result)} untimed={!timed} />
      </div>
    )
  }

  const tap = (value: number) => {
    if (!q || popped !== null) return
    const ms = Math.round(now() - start)
    const res = check(q.ex, { type: 'number', value })
    // The first tap decides the attempt: it is logged once, whatever happens next.
    if (!answeredFirst) {
      host.reportAttempt({ exercise: q.ex, check: res, ms, inputMode: 'tap', hintsUsed: 0 })
      setAnsweredFirst(true)
    }
    if (res.correct) {
      setPopped(value)
      sfx.play('pop')
      haptics.success()
      celebrate('small')
      host.react('correct')
      const ok = !answeredFirst
      window.setTimeout(() => session.answered(ok), ADVANCE_MS)
      return
    }
    sfx.play('wrong')
    haptics.error()
    setWobble({ value, key: Date.now() })
    setClue(res.feedback ? host.t(res.feedback) : '¡Casi! Mira otra burbuja.')
    host.react('wrong', { errorType: res.errorType })
  }

  const slots = q ? q.options.length : 0
  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={questions.length}
      accent="var(--w2)"
      accentSoft="var(--w2-soft)"
      onExit={onExit}
      badge={timed ? <span className={shared.statPill} aria-hidden>{Math.ceil(timeLeft / 1000)} s</span> : <span className={shared.statPill}>Sin prisa</span>}
    >
      {q && (
        <div key={`${q.ex.id}-${session.index}`} className={s.stage}>
          {timed && (
            <div className={s.timer} aria-hidden>
              <span style={{ width: `${(timeLeft / TIMER_MS) * 100}%` }} />
            </div>
          )}
          <div className={clsx(shared.card, s.question)}>
            <div className={shared.equation}>
              <span>{q.ex.a}</span>
              <span className={shared.sign} aria-hidden>×</span>
              <span>{q.ex.b}</span>
              <span className={shared.sign} aria-hidden>=</span>
              <span aria-label="¿Cuánto es?">?</span>
            </div>
          </div>
          <div className={s.field} role="group" aria-label="Burbujas con resultados">
            {q.options.map((value, i) => {
              const left = ((i + 0.5) / slots) * 100
              const top = 20 + ((i * 37) % 45)
              const isPopped = popped === value
              const isTimedOut = popped === TIMED_OUT
              const isWobble = wobble?.value === value
              return (
                <motion.button
                  key={`${value}-${i}`}
                  type="button"
                  className={clsx(s.bubble, (isPopped || isTimedOut) && s.gone)}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={() => tap(value)}
                  disabled={popped !== null}
                  aria-label={`Burbuja ${value}`}
                  animate={
                    isPopped
                      ? { scale: 1.8, opacity: 0 }
                      : isTimedOut
                        ? { y: -260, opacity: 0 }
                        : isWobble && !reduce
                          ? { x: [0, -10, 10, -6, 6, 0] }
                          : reduce
                            ? { y: 0 }
                            : { y: [0, -12, 0] }
                  }
                  transition={
                    isPopped || isTimedOut || isWobble
                      ? { duration: 0.4 }
                      : { duration: 3 + (i % 3) * 0.6, repeat: Infinity, ease: 'easeInOut' }
                  }
                >
                  {value}
                </motion.button>
              )
            })}
          </div>
          <p className={clsx(shared.clue, !clue && s.quiet)} role="status" aria-live="polite">
            {clue ?? 'Toca la burbuja con el resultado correcto.'}
          </p>
        </div>
      )}
    </ActivityFrame>
  )
}
