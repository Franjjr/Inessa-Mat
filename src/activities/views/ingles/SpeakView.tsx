/* Inglés de 3.º, «Ahora dilo tú» (eng-speak): the English word and its Spanish gloss; the child presses, says the word, and
   presses again (or the 10 s limit ends it). The clip is scored by /api/pronunciation: one to three stars and a line that
   encourages. Silence («nothing heard») is not a result: the child is asked to try again. «Saltar» is always there and cancels
   everything still pending (a microphone that opens later is released, a late score is ignored). Nothing here is a mastery
   attempt, and the stars never reach the wallet: the result is kept on this device only (recordSpeaking, no audio). A denied
   microphone or a service that refuses skips the item without penalty, and no more speaking is tried that day. */
import { useEffect, useRef, useState } from 'react'
import { startTake, TAKE_MAX_SECONDS, type Take } from '@/audio/recorder'
import { scoreSpeech } from '@/audio/pronunciation'
import { StarIcon } from '@/art'
import { recordSpeaking, updateProgress, useActiveChild } from '@/data'
import { Button } from '@/ui'
import { pronunciationStars, speakAttemptKey, speakAttemptsToday, speakOffKey } from '@/engine'
import type { EngSpeakExercise, ExerciseOutcome, ExerciseViewProps } from '@/types'
import { useSoundOn, sayEnglish } from './sound'
import s from './Ingles.module.css'

/** Silent tries («No te he oído») allowed in one item: the second one moves on without a recording, the child is never kept looping. */
const SILENT_MAX = 2

/** Days on which the service failed or the microphone was refused: this page load tries no more speaking that day. */
const offDays = new Set<string>()
const dayOf = (now: Date) => now.toISOString().slice(0, 10)
/** Tests only. */
export function __resetSpeakOffForTests(): void {
  offDays.clear()
}

const FEEDBACK = {
  three: '¡Clavado! Lo dices muy bien.',
  two: '¡Muy bien! Casi perfecto, sigue así.',
  one: '¡Muy bien por intentarlo! Cada vez sale mejor.',
  saltar: 'No pasa nada. Seguimos con lo siguiente.',
  unavailable: 'Hoy no podemos escucharte, pero no pasa nada. ¡Seguimos!',
  noSpeech: 'No te he oído. ¿Probamos otra vez?',
} as const

type Phase = 'ready' | 'recording' | 'sending' | 'done'

export default function SpeakView({ exercise, onAnswered }: ExerciseViewProps) {
  if (exercise.kind !== 'eng-speak') return null
  return <SpeakRound key={exercise.id} ex={exercise} onAnswered={onAnswered} />
}

function SpeakRound({ ex, onAnswered }: { ex: EngSpeakExercise; onAnswered: ExerciseViewProps['onAnswered'] }) {
  const { child } = useActiveChild()
  const { soundOn } = useSoundOn()
  const [phase, setPhase] = useState<Phase>('ready')
  const [stars, setStars] = useState<1 | 2 | 3 | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const take = useRef<Take | null>(null)
  /** Set by «Saltar» (and on leaving the page): every step still running stops here and writes nothing. */
  const cancelled = useRef(false)
  const answered = useRef(false)
  /** Silent tries so far in this item (see SILENT_MAX). */
  const silentTries = useRef(0)
  const startedAt = useRef(performance.now())
  const childId = child?.id

  /** One outcome per item: the step moves on with it. Always «correct» for the run: a speaking item is never asked again. */
  const finish = (feedback: string) => {
    if (answered.current) return
    answered.current = true
    const outcome: ExerciseOutcome = {
      check: { correct: true, given: '', expected: ex.word, feedback },
      ms: Math.round(performance.now() - startedAt.current),
      inputMode: 'tap',
      hintsUsed: 0,
      recognitionFixes: 0,
    }
    onAnswered(outcome)
  }

  /** The service or the microphone failed: the item is skipped and no more speaking is tried today (persisted as a flag). */
  const unavailable = () => {
    offDays.add(dayOf(new Date()))
    if (childId) void updateProgress(childId, (p) => ({ ...p, flags: { ...p.flags, [speakOffKey(new Date())]: true } })).catch(() => undefined)
    finish(FEEDBACK.unavailable)
  }

  // A day already switched off in this page load: the next speaking item is skipped at once, without the microphone.
  useEffect(() => {
    if (offDays.has(dayOf(new Date()))) finish(FEEDBACK.unavailable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Leaving the item (or the page) cancels what is pending and releases the microphone. The reset on mount keeps
  // React StrictMode's double mount working.
  useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
      take.current?.stop()
    }
  }, [])

  const press = async () => {
    if (phase === 'recording') { take.current?.stop(); return }
    if (phase !== 'ready' || cancelled.current) return
    setNotice(null)
    setPhase('recording')
    let current: Take
    try {
      current = await startTake(TAKE_MAX_SECONDS)
    } catch {
      if (cancelled.current) return
      setPhase('ready')
      unavailable()
      return
    }
    // «Saltar» pressed while the browser asked for the microphone: this take is released at once, and nothing is written.
    if (cancelled.current) {
      current.stop()
      return
    }
    take.current = current
    const clip = await current.done
    take.current = null
    if (cancelled.current) return
    setPhase('sending')
    const result = await scoreSpeech(ex.word, clip)
    if (cancelled.current) return
    if ('noSpeech' in result) {
      silentTries.current += 1
      if (silentTries.current >= SILENT_MAX) {
        finish(FEEDBACK.saltar)
        return
      }
      setPhase('ready')
      setNotice(FEEDBACK.noSpeech)
      return
    }
    if (!('score' in result)) {
      unavailable()
      return
    }
    const got = pronunciationStars(result.score)
    setStars(got)
    setPhase('done')
    if (childId) {
      const now = new Date()
      void recordSpeaking(childId, ex.word, got).catch(() => undefined)
      void updateProgress(childId, (p) => {
        const n = speakAttemptsToday(p.flags, now) + 1
        return { ...p, flags: { ...p.flags, [speakAttemptKey(now, n)]: true } }
      }).catch(() => undefined)
    }
    finish(got === 3 ? FEEDBACK.three : got === 2 ? FEEDBACK.two : FEEDBACK.one)
  }

  const skip = () => {
    cancelled.current = true
    take.current?.stop()
    finish(FEEDBACK.saltar)
  }

  const label = phase === 'recording' ? '⏹ Ya he terminado' : notice ? '🎤 Otra vez' : '🎤 Pulsa y dilo'
  return (
    <section className={s.view} aria-label="Ahora dilo tú" data-kind={ex.kind}>
      <p className={s.prompt}>Ahora dilo tú</p>
      <div className={s.card} aria-label={`La palabra: ${ex.word}`}>
        <span>{ex.word}</span>
        <span className={s.gloss}>{ex.es}</span>
      </div>
      {soundOn && phase === 'ready' && (
        <div className={s.listen}>
          <Button variant="secondary" size="md" onClick={() => sayEnglish(ex.word, true)}>🔊 Escúchala</Button>
        </div>
      )}
      {phase === 'done' && stars !== null ? (
        <div className={s.stars} role="img" aria-label={`${stars} ${stars === 1 ? 'estrella' : 'estrellas'}`}>
          {[1, 2, 3].map((n) => <StarIcon key={n} size={44} filled={n <= stars} />)}
        </div>
      ) : (
        <div className={s.listen}>
          {phase === 'ready' || phase === 'recording' ? (
            <Button variant={phase === 'recording' ? 'primary' : 'success'} size="lg" onClick={() => void press()}>{label}</Button>
          ) : (
            <p className={s.prompt} role="status">Un momento…</p>
          )}
        </div>
      )}
      {notice && phase === 'ready' && <p className={s.gloss} role="status">{notice}</p>}
      {phase === 'recording' && <p className={s.gloss} role="status">Te escucho. Puedes parar cuando quieras (hasta 10 segundos).</p>}
      {phase !== 'done' && (
        <div className={s.listen}>
          <Button variant="secondary" size="lg" onClick={skip}>Saltar</Button>
        </div>
      )}
    </section>
  )
}
