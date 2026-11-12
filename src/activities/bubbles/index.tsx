/* "Burbujas del bosque": a fact floats above; pop the bubble with the right answer. A wrong pop is a gentle clue
   (the bubble wobbles and stays spent); the second wrong pop ends the question and shows the answer. The soft timer
   runs only for facts the child already knows (mastery box KNOWN_BOX or more), and the family can switch timers off.
   Running out of time is not a wrong fact: nothing is logged for the child's knowledge. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { check, generate } from '@/engine'
import { haptics, sfx, speech } from '@/audio'
import { celebrate } from '@/fx'
import type { ActivityProps, FactMulExercise } from '@/types'
import { useActivityHost } from '../host'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { now } from '../facts/shared/flow'
import { KNOWN_BOX, shuffleWith } from '../facts/shared/items'
import { useSession } from '../facts/shared/session'
import { requeueWrong, startQueue } from '../shared/requeue'
import { speakFact } from '../facts/shared/speak'
import shared from '../facts/shared/shared.module.css'
import s from './bubbles.module.css'

const TIMER_MS = 12000
const ADVANCE_MS = 700
/** Wrong taps allowed on one question before its answer is shown. */
const MAX_TAPS = 2
/** popped state: a value, or one of these sentinels: the time ran out, or the answer was shown after the wrong taps. */
const TIMED_OUT = -1
const REVEALED = -2

interface Question { ex: FactMulExercise; options: number[] }

/** Near misses: the answers a child is most likely to confuse with the right one. Never a + b (MD-8): a bubble with the
    sum is a trap that teaches nothing, and its message («has sumado») talks about writing, not about tapping. */
export function distractors(a: number, b: number): number[] {
  const p = a * b
  const ok = (x: number) => x > 0 && x !== p && x !== a + b
  const candidates = [p + 1, p - 1, p + a, p - a, p + b, p - b, a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b]
  const out = [...new Set(candidates.filter(ok))]
  // Small facts (1×1, 2×1…) have few near misses: pad with nearby numbers so there are always enough bubbles.
  for (let d = 1; out.length < 6; d++) {
    for (const x of [p + d, p - d]) if (ok(x) && !out.includes(x)) out.push(x)
  }
  return out
}

/** The clue after a wrong bubble: about tapping, never the engine's message for a written answer (MD-8). To be replaced
    by FEEDBACK.tapWrong of src/engine/feedback.ts once it exists. */
export const TAP_WRONG = '¡Casi! Esa burbuja no es. Prueba con otra.'

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
  // Wrong first taps come back 2–4 questions later in the same run (PEDAGOGY 4); re-asks are not reported or scored.
  const [run, setRun] = useState(() => startQueue(questions))
  const requeuedRef = useRef(false)
  const [answeredFirst, setAnsweredFirst] = useState(false)
  const [popped, setPopped] = useState<number | null>(null)
  /** Values already tapped wrong on this question: their bubbles are spent. */
  const [missed, setMissed] = useState<number[]>([])
  const [wobble, setWobble] = useState<{ value: number; key: number } | null>(null)
  const [clue, setClue] = useState<string | null>(null)
  const [start, setStart] = useState(() => now())
  const [timeLeft, setTimeLeft] = useState(TIMER_MS)
  const slot = run.slots[session.index]
  const q = slot?.item
  // The countdown is for facts the child already knows: a fact still being learnt is never timed.
  const timedQ = timed && !!q && (host.mastery[q.ex.skill]?.box ?? -1) >= KNOWN_BOX

  // Fresh state for every question.
  useEffect(() => {
    setAnsweredFirst(false)
    setPopped(null)
    setMissed([])
    setWobble(null)
    setClue(null)
    setStart(now())
    setTimeLeft(TIMER_MS)
    requeuedRef.current = false
    // Read the question only: saying the product would answer it.
    // A new question cuts the one still being read (V13): never two facts queued one after the other.
    if (q && host.prefs.voice) {
      speech.stop()
      speakFact(q.ex.a, q.ex.b, '×')
    }
  }, [session.index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Soft timer (only for known facts, and only when the family allows timed games).
  useEffect(() => {
    if (!timedQ || !q || popped !== null || session.result) return
    const id = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 250)), 250)
    return () => window.clearInterval(id)
  }, [timedQ, q, popped, session.result])

  // Time ran out: the bubbles drift away and the question comes back later. It is not logged as a wrong fact: a slow
  // child who knows the fact is not told that they do not.
  useEffect(() => {
    if (!timedQ || !q || popped !== null || timeLeft > 0) return
    const rq = slot?.retry ? null : requeueWrong(run, session.index)
    if (rq) setRun(rq)
    requeuedRef.current = !!rq
    setPopped(TIMED_OUT)
    setClue(`¡Se fueron volando! La respuesta era ${q.ex.answer}.`)
    // Kept out of the effect above on purpose: changing `popped` must not cancel the advance.
  }, [timeLeft, timedQ, q, popped, run, session.index, slot])

  const finished = popped === TIMED_OUT || popped === REVEALED
  useEffect(() => {
    if (!finished) return
    const id = window.setTimeout(() => session.answered(false, requeuedRef.current), ADVANCE_MS * 2)
    return () => window.clearTimeout(id)
    // `session.answered` only reads refs, so a stale closure is safe; `session` changes identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  if (session.result) {
    const result = session.result
    return (
      <div className={s.center}>
        <ResultCard result={result} onContinue={() => onDone(result)} untimed={!timed} />
      </div>
    )
  }

  const tap = (value: number) => {
    if (!q || popped !== null || missed.includes(value)) return
    const ms = Math.round(now() - start)
    const res = check(q.ex, { type: 'number', value })
    // The first tap decides the attempt: it is logged once, whatever happens next.
    if (!answeredFirst) {
      if (!slot?.retry) host.reportAttempt({ exercise: q.ex, check: res, ms, inputMode: 'tap', hintsUsed: 0 })
      setAnsweredFirst(true)
    }
    if (res.correct) {
      setPopped(value)
      sfx.play('pop')
      haptics.success()
      celebrate('small')
      host.react('correct')
      const ok = !answeredFirst
      const rq = ok || slot?.retry ? null : requeueWrong(run, session.index)
      if (rq) setRun(rq)
      window.setTimeout(() => session.answered(ok && !slot?.retry, !!rq), ADVANCE_MS)
      return
    }
    sfx.play('wrong')
    haptics.error()
    host.react('wrong', { errorType: res.errorType })
    const spent = [...missed, value]
    setMissed(spent)
    if (spent.length < MAX_TAPS) {
      setWobble({ value, key: Date.now() })
      setClue(TAP_WRONG)
      return
    }
    // The last wrong tap ends the question: the answer is shown and the fact comes back later in the run.
    const rq = slot?.retry ? null : requeueWrong(run, session.index)
    if (rq) setRun(rq)
    requeuedRef.current = !!rq
    setPopped(REVEALED)
    setClue(`La respuesta era ${q.ex.answer}.${rq ? ' Volverá a salir más adelante.' : ''}`)
  }

  const slots = q ? q.options.length : 0
  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={run.slots.length}
      accent="var(--w2)"
      accentSoft="var(--w2-soft)"
      onExit={onExit}
      badge={timedQ ? <span className={shared.statPill} aria-hidden>{Math.ceil(timeLeft / 1000)} s</span> : <span className={shared.statPill}>Sin prisa</span>}
    >
      {q && (
        <div key={`${q.ex.id}-${session.index}`} className={s.stage}>
          {timedQ && (
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
              const isGone = finished
              const isWobble = wobble?.value === value
              return (
                <motion.button
                  key={`${value}-${i}`}
                  type="button"
                  className={clsx(s.bubble, (isPopped || isGone) && s.gone)}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={() => tap(value)}
                  disabled={popped !== null || missed.includes(value)}
                  aria-label={`Burbuja ${value}`}
                  animate={
                    isPopped
                      ? { scale: 1.8, opacity: 0 }
                      : isGone
                        ? { y: -260, opacity: 0 }
                        : isWobble && !reduce
                          ? { x: [0, -10, 10, -6, 6, 0] }
                          : reduce
                            ? { y: 0 }
                            : { y: [0, -12, 0] }
                  }
                  transition={
                    isPopped || isGone || isWobble
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
