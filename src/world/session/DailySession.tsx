/* Mi sesión de hoy (route /play/sesion): the 15-minute daily session as one run through the real exercise views.
   Blocks: calentamiento (no hints) → lo nuevo (worked example first) → mezcla → problema → cierre. A wrong answer
   comes back 2–4 items later in the same run; the time-box ends the run after the current item, with a gentle close.
   The run is pausable. Completing the run (not each correct answer) gives the stars, once per day. */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityHost } from '@/activities'
import { StarIcon } from '@/art'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import { getNode, getWorld, nextNode, renderTemplate, templateContext } from '@/content'
import { GRADE3_SYLLABUS } from '@/content/syllabus'
import { DAILY_BLOCK_LABEL, DAILY_MINUTES, planDailySession, type DailyPlan } from '@/engine'
import { listAttempts, updateProgress, useActiveChild, useMastery, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import type { AttemptRecord, ChildProfile, ProgressState } from '@/types'
import type { RunQueue } from '@/activities/shared/requeue'
import { afterAnswer, SESSION_STARS, sessionRewardKey, startRun, summarizeRun, isTimeUp, type RunItem, type RunSummary } from './logic'
import s from './session.module.css'

export interface DailySessionProps {
  onDone: () => void
  onExit: () => void
}

/** The screen: the host gives the run its attempts and reward hooks; the planner decides the content. */
export default function DailySession(props: DailySessionProps) {
  return (
    <GameHostProvider activity="sesion">
      <SessionRunner {...props} />
    </GameHostProvider>
  )
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

function SessionRunner({ onDone, onExit }: DailySessionProps) {
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
    if (plan || !child || !mastery || !attempts) return
    const now = new Date()
    const made = planDailySession({ child, mastery, attempts, syllabus: GRADE3_SYLLABUS, now })
    setPlan(made)
    if (made.blocks.every((b) => b.items.length === 0)) setPhase('empty')
  }, [child, mastery, attempts, plan])

  useEffect(() => {
    if (phase === 'play' && isTimeUp(seconds)) setFinishing(true)
  }, [phase, seconds])

  const slots = queue?.slots ?? []
  const slot = slots[pos]
  const needsExample = !!plan?.example && !exampleSeen && !!slot && !slot.retry && slot.item.item.block === 'new'

  // The time is up and the child is between items: close now, before the next one.
  useEffect(() => {
    if (phase === 'play' && finishing && needsExample) close(false)
  }, [phase, finishing, needsExample]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !child || !progress || !mastery || !attempts || !plan) {
    return <Spinner label="Preparando tu sesión…" />
  }

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

  const onAnswered = (correct: boolean, isRetry: boolean) => {
    if (!queue || !slot) return
    const q = afterAnswer(queue, pos, correct)
    setQueue(q)
    if (!isRetry) setResults((r) => [...r, { uid: slot.item.uid, correct }])
    if (finishing) return close(false)
    if (pos + 1 < q.slots.length) setPos(pos + 1)
    else close(true)
  }

  const topic = plan.topic
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
        {header('Mi sesión de hoy')}
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
        {header('Mi sesión de hoy')}
        <div className={s.stage}>
          <div className={`${s.card} ${s.intro}`}>
            <p className={s.kicker}>Unos {DAILY_MINUTES} minutos</p>
            <h2 className={s.title}>{childText(child, '¡Vamos, {child}!')}</h2>
            {topic && <p className={s.topicChip}>Hoy aprendemos: <strong>{topic.name}</strong></p>}
            <ol className={s.blocks}>
              <li><span>Calentamiento</span><small>2 min · de cabeza</small></li>
              <li><span>Lo nuevo</span><small>5 min · con un ejemplo</small></li>
              <li><span>Mezcla</span><small>5 min · de todo un poco</small></li>
              <li><span>Problema</span><small>2 min · con historia</small></li>
            </ol>
            <Button size="lg" variant="success" onClick={start}>¡Empezar!</Button>
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
        summary={summary}
        topicName={topic?.name ?? null}
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
      {header('Mi sesión de hoy')}
      <div className={s.progressTrack} role="progressbar" aria-label={`Ejercicio ${Math.min(done + 1, planned)} de ${planned}`} aria-valuemin={0} aria-valuemax={planned} aria-valuenow={done}>
        <div className={s.progressFill} style={{ width: `${planned ? Math.round((done / planned) * 100) : 0}%` }} />
      </div>
      <div className={s.stage}>
        {needsExample && plan.example ? (
          <ExampleCard
            statement={plan.example.statement}
            steps={plan.example.steps.map((t) => host.t(t))}
            topicName={topic?.name ?? ''}
            onNext={() => { setExampleSeen(true) }}
          />
        ) : slot ? (
          <div className={s.card}>
            <p className={s.blockChip}>{label}{slot.retry ? ' · vuelve para repasar' : ''}</p>
            <ExerciseStep
              key={pos}
              exercise={slot.item.item.exercise}
              allowHints={slot.item.item.block !== 'warmup'}
              okLabel={pos + 1 < slots.length && !finishing ? 'Siguiente' : 'Ver mi resultado'}
              report={!slot.retry}
              onContinue={(o) => onAnswered(o.check.correct, slot.retry)}
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

function ExampleCard({ statement, steps, topicName, onNext }: { statement: string; steps: string[]; topicName: string; onNext: () => void }) {
  return (
    <div className={`${s.card} ${s.example}`}>
      <p className={s.blockChip}>Lo nuevo · ejemplo{topicName ? `: ${topicName}` : ''}</p>
      <p className={s.exampleStatement}>{statement}</p>
      <ol className={s.exampleSteps}>
        {steps.map((t, i) => <li key={i}>{t}</li>)}
      </ol>
      <Button size="lg" variant="success" onClick={onNext}>¡Entendido, a por ello!</Button>
    </div>
  )
}

function Closing({ child, progress, summary, topicName, finished, onDone, onGo, ctx }: {
  child: ChildProfile; progress: ProgressState; summary: RunSummary; topicName: string | null; finished: boolean
  onDone: () => void; onGo: (worldId: string, nodeId: string) => void; ctx: ReturnType<typeof templateContext>
}) {
  const key = sessionRewardKey(new Date())
  const alreadyToday = !!progress.flags?.[key]
  const [awarded, setAwarded] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current || alreadyToday || !finished || summary.answered === 0) return
    started.current = true
    updateProgress(child.id, (p) => (p.flags?.[key] ? p : {
      ...p, stars: p.stars + SESSION_STARS, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString(),
    }))
      .then(() => setAwarded(true))
      .catch(() => toast('Tus estrellas se guardarán en cuanto haya conexión.'))
  }, [alreadyToday, finished, summary.answered, child.id, key])

  const next = safeNext(progress)
  const nextWorld = next ? getWorld(next.worldId) : undefined
  const nextDef = next ? getNode(next.worldId, next.nodeId) : undefined
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
