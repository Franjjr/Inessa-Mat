/* A "try it" step: one mini exercise generated from the step's selector. The child answers through ExerciseView;
   a correct answer unlocks "Siguiente". The slot owns the feedback (showFeedback off), so the child never sees two
   "Siguiente" buttons. One help ladder, always on the SAME exercise:
   1. A miss: the corrector's own message (what went wrong, not a generic «¡Casi!») and the first hint, then «Inténtalo
      otra vez» with the same numbers.
   2. A second miss: the exercise stays on screen, solved step by step below it («Así se resuelve», engine/solution.ts),
      and the child may write the answer again to keep it. The step is settled at once: errors are clues, never a wall.
   A multiplication fact (teach 'full') ends at its copy step instead: the view already gave two tries and showed the
   worked step, so the step settles at once with the solution shown. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ExerciseView, useActivityHost } from '@/activities'
import { SolutionPanel } from '@/activities/shared/SolutionPanel'
import { speech } from '@/audio'
import { createRng, generate, hintsFor } from '@/engine'
import { solutionFor } from '@/engine/solution'
import type { DivMethod, Exercise, ExerciseOutcome, SkillSelector, SubMethod, TableMethod } from '@/types'
import { Button } from '@/ui'
import s from './TrySlot.module.css'

/** Misses allowed before the lesson shows the solution and continues (exercises that end at their first wrong answer). */
export const MAX_MISSES = 2

/** Smallest scale the exercise is shrunk to; below this the answer controls would be too small to tap (56px rule). */
export const MIN_FIT_SCALE = 0.8

/** The line under a missed try: what to do now, before the corrector's own message. */
export const MISSED_LINE = 'Casi. Fíjate en lo que te digo y corrígelo.'
/** The line over the solution after the last miss (and when the child comes back to that step). */
export const SOLVED_LINE = 'Así se hace. Lo vemos otra vez más adelante.'
/** A wrong copy of the answer after the solution: said, never a silent wipe. */
export const COPY_MISSED_LINE = 'No es igual. Mira la solución y escríbela otra vez.'

/** idle: answering. missed: one miss, the message and «Inténtalo otra vez». gaveUp: the solution is shown (the child may
    write the answer again). copied: the answer was written again after the solution. correct: solved. */
type Status = 'idle' | 'correct' | 'missed' | 'gaveUp' | 'copied'

interface Props {
  selector: SkillSelector
  /** Stable text that seeds the generated exercise (lesson id + step index). */
  seedKey: string
  /** Called once when the step is settled: solved, or given up after MAX_MISSES misses. A given-up step passes the
      answer of its solution («451», «4, y sobran 2»), so the lesson can show it again later. */
  onSettled: (solved: boolean, shownAnswer?: string | null) => void
  /** Set when the step was already settled (the child came back to it): shows the exercise solved, offers no exercise. */
  settled?: boolean
  /** The answer of a step given up, as passed to onSettled (kept for the lessons that stored it; the solution is rebuilt). */
  givenUpAnswer?: string | number | null
  /** Subtraction method the exercise is solved with (a lesson step that teaches one method). */
  method?: SubMethod
  /** Division method the exercise is solved with (the division methods lesson). */
  divMethod?: DivMethod
  /** The tables trick the lesson teaches: the hints and the solution of a fact use it (P6-12). */
  tableMethod?: TableMethod
  /** Offer the hint button (default true; a lesson step with `hints: false` turns it off). */
  allowHints?: boolean
  /** The lesson has grown to hold this try (the board takes the exercise's height, see LessonPlayer). */
  grown?: boolean
  /** Called when the exercise does not fit the board even at MIN_FIT_SCALE and one of its controls is out of reach: the lesson grows. */
  onOverflow?: () => void
}

/** FNV-1a, so the same lesson step always starts with the same exercise. */
function seedOf(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** The right answer shown after giving up: the answer of the solution, for every kind (a division with what is left
    over, a time as the clock says it, a comparison with its sign…). Never empty. */
export function shownAnswerOf(exercise: Exercise): string {
  return solutionFor(exercise).answer
}

/** Scale that fits the exercise (natural height) into the space left next to the footer. Never above 1. */
export function fitScale(available: number, natural: number): number {
  if (natural <= 0 || available >= natural) return 1
  return Math.max(MIN_FIT_SCALE, available / natural)
}

const CONTROLS = 'button, input, textarea, select'

/** Whether every control of the try (the exercise's, and the footer's «Inténtalo otra vez») is seen at `scale`, without growing:
    the lowest one's bottom is above the bottom of the wrap (the try's box on the board, which scrolls) and above the window's,
    whichever is higher. The exercise is drawn from its top centre, so its top stays where it is: its controls are read at the
    `applied` scale (the one drawn now) and projected to `scale`. The footer sits under the exercise's box at natural × scale plus
    the row gap, because the box carries that height once a measure has set it; the first measure has no footer control yet,
    so the projection is only used where it holds. The footer's controls are read from the footer's top. No control: the
    exercise's own bottom. */
function controlsReachable(wrap: HTMLElement, inner: HTMLElement, footer: HTMLElement | null, applied: number, scale: number, natural: number): boolean {
  const top = inner.getBoundingClientRect().top
  const gap = parseFloat(getComputedStyle(wrap).rowGap) || 0
  let lowest = Number.NEGATIVE_INFINITY
  for (const c of inner.querySelectorAll<HTMLElement>(CONTROLS)) {
    lowest = Math.max(lowest, top + ((c.getBoundingClientRect().bottom - top) / applied) * scale)
  }
  if (footer) {
    const footerTop = footer.getBoundingClientRect().top
    for (const c of footer.querySelectorAll<HTMLElement>(CONTROLS)) {
      lowest = Math.max(lowest, top + natural * scale + gap + (c.getBoundingClientRect().bottom - footerTop))
    }
  }
  if (lowest === Number.NEGATIVE_INFINITY) lowest = top + natural * scale
  const visibleBottom = Math.min(wrap.getBoundingClientRect().bottom, window.innerHeight)
  return lowest <= visibleBottom - 1
}

export default function TrySlot({ selector, seedKey, onSettled, settled, method, divMethod, tableMethod, allowHints = true, grown = false, onOverflow }: Props) {
  const host = useActivityHost()
  /** Each «Inténtalo otra vez» (and the copy after the solution) draws the same exercise again, cleared. */
  const [round, setRound] = useState(0)
  const [misses, setMisses] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  /** The corrector's message for the last miss (what went wrong in this exercise). */
  const [feedback, setFeedback] = useState('')
  /** After the solution: idle (the view stays as it was), writing (the child asked to write it), missed (the copy was wrong). */
  const [copy, setCopy] = useState<'idle' | 'writing' | 'missed'>('idle')
  const wrapRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState({ scale: 1, height: 0 })
  /** The scale the exercise is drawn with now (the last one measured): positions are read at it and projected to the next. */
  const appliedScale = useRef(1)
  /** The step was settled before this slot was drawn (the child came back to it). Settling it here, the lesson passes
      `settled` too: that must not take the exercise off the screen, so only the value at mount counts. */
  const [cameBack] = useState(settled !== undefined)

  // One exercise per step: a retry keeps the same numbers (the seed does not change with the tries).
  const exercise = useMemo(
    () => generate(selector, 1, { rng: createRng(seedOf(`${seedKey}:0`)) })[0],
    [selector, seedKey],
  )
  const solutionOpts = useMemo(() => ({ subMethod: method, divMethod, tableMethod }), [method, divMethod, tableMethod])

  // No exercise could be generated for this selector: nothing to check, so the step is settled at once.
  useEffect(() => {
    if (!exercise) onSettled(true)
  }, [exercise, onSettled])

  // The exercise is designed for a full screen; on a lesson board it is shrunk to fit, so nothing is clipped.
  const live = !cameBack && !!exercise
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const inner = innerRef.current
    if (!live || !wrap || !inner) return
    const measure = () => {
      const cs = getComputedStyle(wrap)
      const gap = parseFloat(cs.rowGap) || 0
      const padding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      const footer = footerRef.current?.offsetHeight ?? 0
      const available = wrap.clientHeight - padding - footer - gap
      const natural = inner.offsetHeight
      const scale = fitScale(available, natural)
      setFit({ scale, height: natural })
      // Taller than the board even at the smallest scale AND a control of the try out of reach: the lesson has to grow to hold it.
      // A tall exercise whose controls are all in view keeps its size (its lower part scrolls inside the board).
      if (!grown && natural * scale > available + 1 && !controlsReachable(wrap, inner, footerRef.current, appliedScale.current, scale, natural)) onOverflow?.()
      appliedScale.current = scale
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(wrap)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [live, exercise, status, grown, onOverflow])

  /** Says a line aloud when the child has the voice on (the speech module reads numbers and signs as words). */
  const say = (text: string) => {
    if (host.prefs.voice) void speech.say(host.t(text), { interrupt: true })
  }

  if (cameBack) {
    // Back on a settled step: the exercise solved (its solution), not a loose line.
    return (
      <div className={s.wrap} data-status={settled ? 'correct' : 'gaveUp'}>
        <div className={s.footer} role="status">
          {settled ? <p className={s.good}>{host.t('¡Muy bien, {child}!')}</p> : <p className={s.hint}>{SOLVED_LINE}</p>}
          {exercise && <SolutionPanel exercise={exercise} opts={solutionOpts} />}
        </div>
      </div>
    )
  }

  if (!exercise) return <div className={s.wrap} />

  const solution = () => solutionFor(exercise, solutionOpts)

  const giveUp = () => {
    setStatus('gaveUp')
    const sol = solution()
    onSettled(false, sol.answer)
    say(`${SOLVED_LINE} ${sol.steps.join(' ')} La respuesta es ${sol.answer}.`)
  }

  const answered = (outcome: ExerciseOutcome) => {
    const { check } = outcome
    // Writing the answer again after the solution is practice: nothing is reported or graded.
    if (status === 'gaveUp' || status === 'copied') {
      if (check.correct) {
        setStatus('copied')
        say('¡Eso es!')
      } else {
        // A wrong copy is never a silent wipe: the child is told, and the same exercise comes back to write again.
        setCopy('missed')
        say(COPY_MISSED_LINE)
        setRound((r) => r + 1)
      }
      return
    }
    host.reportAttempt({
      exercise,
      check,
      ms: outcome.ms,
      inputMode: outcome.inputMode,
      hintsUsed: outcome.hintsUsed,
      recognitionFixes: outcome.recognitionFixes,
      method: method ?? divMethod ?? tableMethod ?? undefined,
      // Only the first try of the step grades mastery; a retry is saved with its count and does not grade again.
      ...(misses > 0 ? { retries: misses, graded: false } : {}),
      ...(misses > 0 && check.correct ? { solvedOnRetry: true } : {}),
    })
    // The view ended at its copy step: the answer is on screen and was written, so the step ends here without a new miss.
    if (outcome.revealed) {
      giveUp()
      return
    }
    if (check.correct) {
      host.react('correct')
      setStatus('correct')
      onSettled(true)
      say('¡Muy bien!')
      return
    }
    host.react('wrong', { errorType: check.errorType })
    const nextMisses = misses + 1
    setMisses(nextMisses)
    if (nextMisses >= MAX_MISSES) {
      giveUp()
    } else {
      const clue = check.feedback?.trim() || hintsFor(exercise, method, { divMethod, tableMethod })[0]?.text || ''
      setFeedback(clue)
      setStatus('missed')
      say(`${MISSED_LINE} ${clue}`)
    }
  }

  const retry = () => {
    setRound((r) => r + 1)
    setStatus('idle')
  }

  /** After the solution: the same exercise again, empty, to write the answer once more (optional: the step is settled). */
  const copyAgain = () => {
    setCopy('writing')
    setRound((r) => r + 1)
  }

  const firstHint = status === 'missed' ? hintsFor(exercise, method, { divMethod, tableMethod })[0]?.text : undefined
  const solvedShown = status === 'gaveUp' || status === 'copied'

  return (
    <div ref={wrapRef} className={clsx(s.wrap, grown && s.wrapGrown)} data-status={status}>
      <div className={s.fit} style={{ height: fit.height ? fit.height * fit.scale : undefined }}>
        <div ref={innerRef} className={s.exercise} style={{ transform: `scale(${fit.scale})` }}>
          {/* teach full: a missed fact shows its worked step and the child copies the answer before the view ends. */}
          <ExerciseView
            key={`${round}`}
            exercise={exercise}
            onAnswered={answered}
            guided={allowHints && !solvedShown}
            allowHints={allowHints && !solvedShown}
            showFeedback={false}
            teach="full"
            method={method}
            divMethod={divMethod}
            tableMethod={tableMethod ?? host.prefs.tableMethod}
          />
        </div>
      </div>
      <div ref={footerRef} className={s.footer} role="status" aria-live="polite">
        {status === 'correct' && <p className={s.good}>{host.t('¡Muy bien, {child}!')}</p>}
        {status === 'missed' && (
          <>
            <p className={s.hint}>{MISSED_LINE}</p>
            {feedback && <p className={s.feedback}>{host.t(feedback)}</p>}
            {firstHint && firstHint !== feedback && <p className={s.hint}>{host.t(firstHint)}</p>}
            <Button variant="secondary" onClick={retry}>Inténtalo otra vez</Button>
          </>
        )}
        {solvedShown && (
          <>
            <p className={s.hint}>{status === 'copied' ? '¡Eso es! Lo vemos otra vez más adelante.' : SOLVED_LINE}</p>
            <SolutionPanel exercise={exercise} opts={solutionOpts} />
            {status === 'gaveUp' && exercise.kind !== 'fact-mul' && copy === 'idle' && (
              <>
                <p className={s.hint}>Si quieres escribirla tú, pulsa «Escribirla otra vez».</p>
                <Button variant="secondary" size="sm" onClick={copyAgain}>Escribirla otra vez</Button>
              </>
            )}
            {status === 'gaveUp' && copy === 'writing' && <p className={s.hint}>Escribe la respuesta arriba, mirando la solución.</p>}
            {status === 'gaveUp' && copy === 'missed' && <p className={s.feedback}>{COPY_MISSED_LINE}</p>}
          </>
        )}
      </div>
    </div>
  )
}
