/* Mi sesión de hoy (route /play/sesion) and Mi sesión de Lengua (route /play/lengua): the 15-minute daily session as one run
   through the real exercise views. The subject picks the planner and its blocks. Maths: calentamiento (no hints) → lo nuevo
   (worked example first) → mezcla → problema → cierre. Lengua: calentamiento → lo nuevo (its class first when it has one) →
   lectura (a story: its text, then its questions) → mezcla → cierre. A wrong answer comes back 2–4 items later in the same
   run; the time-box ends the run after the current item, with a gentle close. The run is pausable. Completing the run (not
   each correct answer) gives the stars, once per day (one key per subject). */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityHost } from '@/activities'
import { speech } from '@/audio'
import { StarIcon } from '@/art'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import { classForTopic, getNode, getWorld, nextNode, renderTemplate, templateContext } from '@/content'
import { syllabusFor, syllabusForGrade, topicTitle } from '@/content/syllabus'
import { DAILY_BLOCK_LABEL, DAILY_MINUTES, planDailySession, planLenguaSession, storyFlag, type DailyPlan, type LessonSubject } from '@/engine'
import { listAttempts, updateProgress, useActiveChild, useMastery, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import type { AttemptRecord, ChildProfile, ProgressState, ReadingDef } from '@/types'
import type { RunQueue } from '@/activities/shared/requeue'
import { afterAnswer, postpone, SESSION_STARS, sessionDoneKey, sessionRewardKey, startRun, summarizeRun, isTimeUp, type RunItem, type RunSummary } from './logic'
import s from './session.module.css'

export interface DailySessionProps {
  /** maths (default) or Lengua: the planner, the blocks and the reward key follow it. */
  subject?: LessonSubject
  onDone: () => void
  onExit: () => void
}

/** The screen: the host gives the run its attempts and reward hooks; the planner decides the content. */
export default function DailySession({ subject = 'math', ...props }: DailySessionProps) {
  return (
    <GameHostProvider activity={subject === 'language' ? 'sesion-lengua' : 'sesion'} subject={subject}>
      <SessionRunner subject={subject} {...props} />
    </GameHostProvider>
  )
}

/** The blocks the intro lists, per subject (the planner's blocks, in order, with their timing). */
const INTRO_BLOCKS: Record<LessonSubject, [string, string][]> = {
  math: [['Calentamiento', '2 min · de cabeza'], ['Lo nuevo', '5 min · con un ejemplo'], ['Mezcla', '5 min · de todo un poco'], ['Problema', '2 min · con historia']],
  language: [['Calentamiento', '2 min · de cabeza'], ['Lo nuevo', '5 min · con la clase'], ['Lectura', '4 min · un cuento y sus preguntas'], ['Mezcla', '4 min · ortografía y palabras']],
}

/** Active seconds of the run: stops while paused and when the run is not on screen. */
function useActiveSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0)
  const acc = useRef(0)
  const since = useRef<number | null>(null)
  useEffect(() => {
    const flush = () => {
      if (since.current !== null) acc.current += Date.now() - since.current
      since.current = null
      setSeconds(Math.floor(acc.current / 1000))
    }
    if (!running) { flush(); return }
    since.current = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      acc.current += now - (since.current ?? now)
      since.current = now
      setSeconds(Math.floor(acc.current / 1000))
    }, 1000)
    return () => { window.clearInterval(id); flush() }
  }, [running])
  return seconds
}

type Phase = 'intro' | 'play' | 'closing' | 'empty'

function SessionRunner({ subject, onDone, onExit }: DailySessionProps & { subject: LessonSubject }) {
  const host = useActivityHost()
  const navigate = useNavigate()
  const { child, loading } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)
  const [attempts, setAttempts] = useState<AttemptRecord[] | null>(null)
  const [plan, setPlan] = useState<DailyPlan | null>(null)

  const [phase, setPhase] = useState<Phase>('intro')
  const [queue, setQueue] = useState<RunQueue<RunItem> | null>(null)
  const [pos, setPos] = useState(0)
  const [results, setResults] = useState<{ uid: string; correct: boolean }[]>([])
  const [exampleSeen, setExampleSeen] = useState(false)
  const [passagesSeen, setPassagesSeen] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [endedByTime, setEndedByTime] = useState(false)

  const running = phase === 'play' && !paused
  const seconds = useActiveSeconds(running)

  // Attempts (for the visual support) once per visit; the plan is made once, so live updates do not reshuffle it.
  useEffect(() => {
    if (!child) return
    let alive = true
    listAttempts(child.id, { limit: 300 })
      .then((list) => { if (alive) setAttempts(list) })
      .catch(() => { if (alive) setAttempts([]) })
    return () => { alive = false }
  }, [child?.id])

  useEffect(() => {
    if (plan || !child || !mastery || !attempts || !progress) return
    const now = new Date()
    const made = subject === 'language'
      ? planLenguaSession({ child, mastery, syllabus: syllabusFor('language', child.grade), now, progress, voice: speech.available() })
      : planDailySession({ child, mastery, attempts, syllabus: syllabusForGrade(child.grade), now })
    setPlan(made)
    if (made.blocks.every((b) => b.items.length === 0)) setPhase('empty')
  }, [child, mastery, attempts, progress, plan, subject])

  useEffect(() => {
    if (phase === 'play' && isTimeUp(seconds)) setFinishing(true)
  }, [phase, seconds])

  const slots = queue?.slots ?? []
  const slot = slots[pos]
  const needsExample = !!plan?.example && !exampleSeen && !!slot && !slot.retry && slot.item.item.block === 'new'
  const passage = slot && !slot.retry ? slot.item.item.passage : undefined
  const needsPassage = !!passage && !passagesSeen.includes(passage.id)
  const gated = needsExample || needsPassage

  // The time is up and the child is between items: close now, before the next one.
  useEffect(() => {
    if (phase === 'play' && finishing && gated) close(false)
  }, [phase, finishing, gated]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !child || !progress || !mastery || !attempts || !plan) {
    return <Spinner label="Preparando tu sesión…" />
  }
  const isLenguaRun = subject === 'language'
  const sessionTitle = isLenguaRun ? 'Mi sesión de Lengua' : 'Mi sesión de hoy'

  function start() {
    if (!plan) return
    const q = startRun(plan)
    setQueue(q)
    setPos(0)
    setResults([])
    setPhase('play')
  }

  function close(finished: boolean) {
    setEndedByTime(!finished)
    setPhase('closing')
  }

  // «Ahora no»: nothing is reported. The next item slides into this position; the run closes when none is left.
  const onPostponed = () => {
    if (!queue) return
    const q = postpone(queue, pos)
    setQueue(q)
    if (finishing) return close(false)
    if (pos < q.slots.length) return
    close(true)
  }

  const onAnswered = (correct: boolean, isRetry: boolean) => {
    if (!queue || !slot) return
    const q = afterAnswer(queue, pos, correct)
    setQueue(q)
    if (!isRetry) setResults((r) => [...r, { uid: slot.item.uid, correct }])
    // The last question of a story marks the story read: the next session offers the next one.
    const finished = slot.item.item.finishesReading
    if (finished && !isRetry) {
      void updateProgress(child.id, (p) => ({ ...p, flags: { ...p.flags, [storyFlag(finished)]: true } })).catch(() => undefined)
    }
    if (finishing) return close(false)
    if (pos + 1 < q.slots.length) setPos(pos + 1)
    else close(true)
  }

  const topic = plan.topic
  const topicName = topic ? topicTitle(topic) : ''
  const topicClass = topic ? classForTopic(topic.id, child.grade, subject) : undefined
  // Lengua: the class of the topic comes before «Lo nuevo» when the child has not done it yet.
  const pendingClass = isLenguaRun ? plan.classTopicId ?? null : null
  const summary: RunSummary = summarizeRun(queue ?? { slots: [], retried: [] }, results, !endedByTime)
  const ctx = templateContext(child)

  const header = (title: string) => (
    <header className={s.header}>
      <BackButton variant="exit" onClick={() => setPaused(true)} />
      <h1 className={s.headerTitle}>{title}</h1>
      {phase === 'play' ? <span className={s.clock} aria-live="off">{formatClock(seconds)} de {DAILY_MINUTES}</span> : <span />}
    </header>
  )

  if (phase === 'empty') {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {header(sessionTitle)}
        <div className={s.stage}>
          <div className={s.calm}>
            <h2 className={s.title}>{childText(child, '¡Hoy no hay ejercicios, {child}!')}</h2>
            <p className={s.text}>Vuelve mañana o sigue tu aventura con Lumi.</p>
            <Button size="lg" onClick={onExit}>Volver</Button>
          </div>
        </div>
      </Screen>
    )
  }

  if (phase === 'intro') {
    return (
      <Screen background="var(--c-bg)" className={s.root}>
        {header(sessionTitle)}
        <div className={s.stage}>
          <div className={`${s.card} ${s.intro}`}>
            <p className={s.kicker}>Unos {DAILY_MINUTES} minutos</p>
            <h2 className={s.title}>{childText(child, '¡Vamos, {child}!')}</h2>
            {topic && <p className={s.topicChip}>Hoy aprendemos: <strong>{topicName}</strong></p>}
            <ol className={s.blocks}>
              {INTRO_BLOCKS[subject].map(([name, time]) => <li key={name}><span>{name}</span><small>{time}</small></li>)}
            </ol>
            {pendingClass ? (
              <Button size="lg" variant="success" onClick={() => navigate(`/play/clase/${pendingClass}`)}>¡Empezar la clase!</Button>
            ) : (
              <Button size="lg" variant="success" onClick={start}>¡Empezar!</Button>
            )}
          </div>
        </div>
      </Screen>
    )
  }

  if (phase === 'closing') {
    return (
      <Closing
        child={child}
        progress={progress}
        subject={subject}
        summary={summary}
        topicName={topic ? topicName : null}
        finished={!endedByTime}
        onDone={onDone}
        onGo={(worldId, nodeId) => navigate(`/play/w/${worldId}/${nodeId}`)}
        ctx={ctx}
      />
    )
  }

  // phase: play
  const label = slot ? DAILY_BLOCK_LABEL[slot.item.item.block] : ''
  const done = results.length
  const planned = summary.total
  return (
    <Screen background="var(--c-bg)" className={s.root}>
      {header(sessionTitle)}
      <div className={s.progressTrack} role="progressbar" aria-label={`Ejercicio ${Math.min(done + 1, planned)} de ${planned}`} aria-valuemin={0} aria-valuemax={planned} aria-valuenow={done}>
        <div className={s.progressFill} style={{ width: `${planned ? Math.round((done / planned) * 100) : 0}%` }} />
      </div>
      <div className={s.stage}>
        {needsExample && plan.example ? (
          <ExampleCard
            statement={plan.example.statement}
            steps={plan.example.steps.map((t) => host.t(t))}
            topicName={topicName}
            onNext={() => { setExampleSeen(true) }}
            onClass={topicClass ? () => navigate(`/play/clase/${topicClass.topicId}`) : undefined}
          />
        ) : needsPassage && passage ? (
          <PassageCard
            reading={passage}
            paragraphs={passage.text.map((p) => renderTemplate(p, ctx))}
            soundOn={child.settings.sound}
            onNext={() => setPassagesSeen((seen) => [...seen, passage.id])}
          />
        ) : slot ? (
          <div className={s.card}>
            <p className={s.blockChip}>{label}{slot.retry ? ' · vuelve para repasar' : ''}</p>
            <ExerciseStep
              key={`${pos}:${slot.item.uid}`}
              exercise={slot.item.item.exercise}
              allowHints={slot.item.item.block !== 'warmup'}
              okLabel={pos + 1 < slots.length && !finishing ? 'Siguiente' : 'Ver mi resultado'}
              report={!slot.retry}
              onContinue={(o) => onAnswered(o.check.correct, slot.retry)}
              onSkip={onPostponed}
              allowRetry
              allowDontKnow={slot.item.item.block !== 'warmup'}
            />
          </div>
        ) : null}
      </div>
      {paused && (
        <div className={s.pause} role="dialog" aria-modal="true" aria-label="Pausa">
          <div className={s.pauseCard}>
            <h2 className={s.title}>Pausa</h2>
            <p className={s.text}>Lo que ya has contestado está guardado. Puedes seguir cuando quieras.</p>
            <div className={s.actions}>
              <Button size="lg" variant="success" onClick={() => setPaused(false)}>Seguir</Button>
              <Button size="lg" variant="secondary" onClick={onExit}>Salir por hoy</Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}

function ExampleCard({ statement, steps, topicName, onNext, onClass }: {
  statement: string; steps: string[]; topicName: string; onNext: () => void; onClass?: () => void
}) {
  return (
    <div className={`${s.card} ${s.example}`}>
      <p className={s.blockChip}>Lo nuevo · ejemplo{topicName ? `: ${topicName}` : ''}</p>
      <p className={s.exampleStatement}>{statement}</p>
      <ol className={s.exampleSteps}>
        {steps.map((t, i) => <li key={i}>{t}</li>)}
      </ol>
      <div className={s.actions}>
        <Button size="lg" variant="success" onClick={onNext}>¡Entendido, a por ello!</Button>
        {onClass && <Button size="lg" variant="secondary" onClick={onClass}>Ver la clase otra vez</Button>}
      </div>
    </div>
  )
}

/** The text of a story before its questions («Lectura»): read it, or listen to it when the sound is on (R16: the press
    speaks, as in the dictation). */
function PassageCard({ reading, paragraphs, soundOn, onNext }: {
  reading: ReadingDef; paragraphs: string[]; soundOn: boolean; onNext: () => void
}) {
  const [speaking, setSpeaking] = useState(false)
  const run = useRef(0)
  useEffect(() => () => {
    run.current += 1
    speech.stop()
  }, [])
  const listen = () => {
    const mine = ++run.current
    setSpeaking(true)
    void (async () => {
      for (let i = 0; i < paragraphs.length; i++) {
        if (run.current !== mine) return
        await speech.say(paragraphs[i], { interrupt: i === 0, force: true })
      }
      if (run.current === mine) setSpeaking(false)
    })().catch(() => setSpeaking(false))
  }
  return (
    <div className={`${s.card} ${s.passage}`}>
      <p className={s.blockChip}>Lectura</p>
      <h2 className={s.title}>{reading.title}</h2>
      <div className={s.passageBody}>
        {paragraphs.map((p, i) => <p key={i} className={s.passageText}>{p}</p>)}
      </div>
      <div className={s.actions}>
        {soundOn ? (
          <Button variant="secondary" size="lg" onClick={listen}>{speaking ? '🔊 Escuchando…' : '🔊 Escuchar'}</Button>
        ) : (
          <p className={s.text}>Activa el sonido para escuchar el texto</p>
        )}
        <Button size="lg" variant="success" onClick={onNext}>¡Ahora las preguntas!</Button>
      </div>
    </div>
  )
}

function Closing({ child, progress, subject, summary, topicName, finished, onDone, onGo, ctx }: {
  child: ChildProfile; progress: ProgressState; subject: LessonSubject; summary: RunSummary; topicName: string | null; finished: boolean
  onDone: () => void; onGo: (worldId: string, nodeId: string) => void; ctx: ReturnType<typeof templateContext>
}) {
  const key = sessionRewardKey(new Date(), subject)
  const alreadyToday = !!progress.flags?.[key]
  const [awarded, setAwarded] = useState(false)
  const started = useRef(false)
  const marked = useRef(false)

  // Any run with answers marks the day for its subject (the home switches on it), finished or cut by the time.
  useEffect(() => {
    if (marked.current || summary.answered === 0) return
    marked.current = true
    const doneKey = sessionDoneKey(new Date(), subject)
    void updateProgress(child.id, (p) => (p.flags?.[doneKey] ? p : {
      ...p, flags: { ...p.flags, [doneKey]: true }, updatedAt: new Date().toISOString(),
    })).catch(() => undefined)
  }, [summary.answered, subject, child.id])

  useEffect(() => {
    if (started.current || alreadyToday || !finished || summary.answered === 0) return
    started.current = true
    updateProgress(child.id, (p) => (p.flags?.[key] ? p : {
      ...p, stars: p.stars + SESSION_STARS, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString(),
    }))
      .then(() => setAwarded(true))
      .catch(() => toast('Tus estrellas se guardarán en cuanto haya conexión.'))
  }, [alreadyToday, finished, summary.answered, child.id, key])

  // The adventure is maths: a Lengua session does not point at the map.
  const next = subject === 'language' ? null : safeNext(progress)
  const nextWorld = next ? getWorld(next.worldId, progress.seasonId) : undefined
  const nextDef = next ? getNode(next.worldId, next.nodeId, progress.seasonId) : undefined
  const hook = nextWorld && nextDef ? renderTemplate(nextWorld.hook, ctx) : null

  return (
    <Screen background="var(--c-bg)" className={s.root}>
      <header className={s.header}>
        <span />
        <h1 className={s.headerTitle}>Sesión terminada</h1>
        <span />
      </header>
      <div className={s.stage}>
        <div className={`${s.card} ${s.calm}`}>
          <div className={s.stars} aria-label={`${SESSION_STARS} estrellas`}>
            {[0, 1, 2].map((i) => <StarIcon key={i} size={56} filled={finished && i < SESSION_STARS} />)}
          </div>
          <h2 className={s.title}>
            {finished ? childText(child, '¡Lo has conseguido, {child}!') : childText(child, '¡Buen trabajo, {child}!')}
          </h2>
          <p className={s.text}>
            {summary.answered > 0 ? `Has acertado ${summary.correct} de ${summary.total} ejercicios.` : 'Hoy no has llegado a contestar ninguno.'}
            {' '}{finished ? 'Descansa y vuelve mañana.' : 'Hemos llegado al tiempo de hoy: lo que has hecho cuenta.'}
          </p>
          {topicName && <p className={s.topicChip}>Hoy has trabajado: <strong>{topicName}</strong></p>}
          {awarded && <p className={s.reward}>+{SESSION_STARS} estrellas para tu cuerno</p>}
          {alreadyToday && <p className={s.text}>Ya tienes las estrellas de hoy.</p>}
          {hook && <p className={s.story}>Tu aventura: {hook}</p>}
          <div className={s.actions}>
            {next && <Button size="lg" variant="secondary" onClick={() => onGo(next.worldId, next.nodeId)}>Seguir la aventura</Button>}
            <Button size="lg" variant="success" onClick={onDone}>Volver al inicio</Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}

function safeNext(progress: ProgressState) {
  try {
    return nextNode(progress) ?? null
  } catch {
    return null
  }
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const sec = totalSeconds % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
