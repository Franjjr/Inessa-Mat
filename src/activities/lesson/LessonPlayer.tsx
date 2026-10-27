/* Animated lesson player: Lumi explains a short sequence of steps, each step drawn by a visual of
   ./visuals (or by an exercise the child must solve). Tap or keyboard to move on; voice reads each step aloud. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { MotionConfig, motion } from 'motion/react'
import clsx from 'clsx'
import { Character } from '@/art'
import { sfx, speech } from '@/audio'
import type { LessonDef, LessonStep, SubMethod } from '@/types'
import { BackButton, Button } from '@/ui'
import { useActivityHost } from '../host'
import { LESSON_VISUALS } from './visuals'
import { SafeVisual } from './SafeVisual'
import TrySlot from './TrySlot'
import ChoiceSlot from './ChoiceSlot'
import { computeRuns, isAnswerStep, keyAction, stageCharacter, voiceFor } from './navigation'
import { usePortrait, useReducedMotionFlag } from './useLessonMedia'
import styles from './LessonPlayer.module.css'

/** Which favourite a choose step saves: the subtraction method unless the step says otherwise. */
function preferenceOf(step: LessonStep | undefined): 'subMethod' | 'divMethod' | 'tableMethod' {
  return step?.preference ?? 'subMethod'
}

export interface LessonPlayerProps {
  lesson: LessonDef
  onDone: () => void
  onExit?: () => void
}

/** Shows the lesson. Keeps the step index only; visuals and exercises are derived from the lesson. */
export default function LessonPlayer(props: LessonPlayerProps) {
  return (
    <MotionConfig reducedMotion="user">
      <Player {...props} />
    </MotionConfig>
  )
}

function Player({ lesson, onDone, onExit }: LessonPlayerProps) {
  const host = useActivityHost()
  const reduced = useReducedMotionFlag()
  const portrait = usePortrait()
  const steps = lesson.steps
  const total = steps.length
  const runs = useMemo(() => computeRuns(steps), [steps])
  const [index, setIndex] = useState(0)
  /** How each try step was settled: true when solved, false when given up. Going back keeps that outcome. */
  const [settled, setSettled] = useState<ReadonlyMap<number, boolean>>(() => new Map())
  const current = Math.min(Math.max(index, 0), Math.max(total - 1, 0))
  const step = steps[current]
  const run = runs[current]
  const isTry = !!step && step.interaction === 'try' && !!step.trySelector
  const outcome = settled.get(current)
  /** A "choose" step: the child picks one option (saved through the host) before going on. */
  const isChoose = !!step && step.interaction === 'choose' && !!step.choices?.length
  const [picks, setPicks] = useState<ReadonlyMap<number, string>>(() => new Map())
  const canContinue = total === 0 || (!isTry && !isChoose) || outcome !== undefined
  const isLast = current >= total - 1
  const speaker = step?.speaker
  const voice = voiceFor(speaker)
  const text = step ? host.t(step.text) : ''
  const stageId = stageCharacter(speaker)
  const Visual = step && !isAnswerStep(step) ? LESSON_VISUALS[step.visual] : undefined

  // Voice: read each step aloud when it appears (the speech module ignores the call when voice is off).
  useEffect(() => {
    if (!step || !host.prefs.voice) return
    void speech.say(host.t(step.text), { voice, interrupt: true })
    // Only the step itself should trigger speech; host and voice are stable for a lesson.
  }, [current])

  useEffect(() => () => speech.stop(), [])

  const goTo = useCallback((i: number) => {
    setIndex(Math.min(Math.max(i, 0), Math.max(total - 1, 0)))
  }, [total])

  const next = useCallback(() => {
    if (!canContinue) return
    if (isLast) {
      onDone()
      return
    }
    sfx.play('page')
    goTo(current + 1)
  }, [canContinue, isLast, onDone, current, goTo])

  const back = useCallback(() => {
    if (current <= 0) return
    sfx.play('tap')
    goTo(current - 1)
  }, [current, goTo])

  // A try step is settled when solved or given up after the last allowed miss: the lesson then goes on.
  const settle = useCallback((solvedNow: boolean) => {
    setSettled((prev) => (prev.has(current) ? prev : new Map(prev).set(current, solvedNow)))
  }, [current])

  // Choosing settles the step at once and saves the pick as the child's preference.
  const pick = useCallback((value: string) => {
    setPicks((prev) => new Map(prev).set(current, value))
    host.setPreference?.(preferenceOf(lesson.steps[current]), value as SubMethod)
    setSettled((prev) => (prev.has(current) ? prev : new Map(prev).set(current, true)))
  }, [current, host, lesson.steps])

  // Keyboard: arrows and Page keys move, Escape exits, Enter continues when nothing else has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null
      const action = keyAction({
        key: e.key,
        editable: !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)),
        interactive: !!target && !!target.closest('button, a[href], [role="button"], [role="slider"], [role="textbox"], [tabindex]:not([tabindex="-1"]), canvas'),
        modified: e.ctrlKey || e.metaKey || e.altKey,
        onBody: !target || target === document.body,
      })
      if (!action) return
      if (action === 'exit') {
        if (onExit) {
          e.preventDefault()
          onExit()
        }
        return
      }
      e.preventDefault()
      if (action === 'next') next()
      else back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, onExit])

  if (total === 0) {
    return (
      <main className={styles.player}>
        <div className={styles.empty}>
          <Button onClick={onDone}>Continuar</Button>
        </div>
      </main>
    )
  }

  const pose = isTry && outcome === true ? 'cheer' : 'talk'
  const avatarSize = portrait ? 150 : 200

  return (
    <main className={styles.player} aria-label={host.t(lesson.title)}>
      <header className={styles.top}>
        {onExit ? (
          <BackButton variant="exit" onClick={onExit} aria-label="Salir de la lección" />
        ) : (
          <span />
        )}
        <h1 className={styles.title}>{host.t(lesson.title)}</h1>
        {host.prefs.voice ? (
          <Button variant="secondary" size="sm" onClick={() => void speech.say(text, { voice, interrupt: true })} aria-label="Escuchar otra vez">
            🔊 Escuchar
          </Button>
        ) : (
          <span />
        )}
      </header>

      <div className={styles.stage}>
        <div className={styles.board}>
          {run && (
            <motion.div
              key={`run-${run.start}-${isTry ? 'try' : 'show'}`}
              className={styles.frame}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              {isTry && step.trySelector ? (
                <SafeVisual>
                  <TrySlot key={current} selector={step.trySelector} seedKey={`${lesson.id}:${current}`} settled={outcome} onSettled={settle} method={step.method} divMethod={step.divMethod} allowHints={step.hints !== false} />
                </SafeVisual>
              ) : isChoose && step.choices ? (
                <SafeVisual>
                  <ChoiceSlot choices={step.choices.map((c) => ({ label: c.label, value: c.value }))} picked={picks.get(current)} onPick={pick} />
                </SafeVisual>
              ) : Visual ? (
                <SafeVisual>
                  <Visual params={step.params ?? {}} phase={run.phase} runLength={run.length} reduced={reduced} />
                </SafeVisual>
              ) : null}
            </motion.div>
          )}
        </div>

        <aside className={clsx(styles.speaker, portrait && styles.speakerPortrait)}>
          <div className={styles.avatar}>
            <Character id={stageId} pose={pose} size={avatarSize} animated={!reduced} />
          </div>
          <div className={styles.bubble} aria-live="polite">
            <p className={styles.text} key={current} data-testid="lesson-text">{text}</p>
          </div>
        </aside>
      </div>

      <footer className={styles.controls}>
        <Button variant="secondary" onClick={back} disabled={current === 0}>
          ‹ Atrás
        </Button>
        <div className={styles.progress} role="progressbar" aria-label={`Paso ${current + 1} de ${total}`} aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1}>
          {steps.map((_, i) => (
            <span key={i} aria-hidden className={clsx(styles.dot, i === current && styles.dotActive, i < current && styles.dotDone)} />
          ))}
        </div>
        <Button variant={isLast ? 'gold' : 'primary'} onClick={next} disabled={!canContinue}>
          {isLast ? '¡Lo he entendido!' : 'Siguiente ›'}
        </Button>
      </footer>
    </main>
  )
}
