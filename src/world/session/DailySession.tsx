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
import { SoundSwitch } from '@/audio/SoundSwitch'
import { StarIcon } from '@/art'
import { childText } from '@/world/rewards/childText'
import { GameHostProvider } from '@/world/host/GameHost'
import { ExerciseStep } from '@/world/review/ExerciseStep'
import { classForTopic, getNode, getWorld, nextNode, renderTemplate, templateContext } from '@/content'
import { syllabusFor, syllabusForGrade, topicTitle } from '@/content/syllabus'
import { DAILY_BLOCK_LABEL, DAILY_MINUTES, ENGLISH_SESSION_MINUTES, planDailySession, planEnglishSession, planLenguaSession, storyFlag, type DailyPlan, type LessonSubject } from '@/engine'
import { listAttempts, updateProgress, useActiveChild, useMastery, useProgress } from '@/data'
import { BackButton, Button, Screen, Spinner, toast } from '@/ui'
import type { AttemptRecord, ChildProfile, ProgressState, ReadingDef } from '@/types'
import type { RunQueue } from '@/activities/shared/requeue'
import { CancionOffer } from './CancionOffer'
import { songTables } from '@/world/cancion/logic'
import { CaligrafiaOffer, useCaligrafiaOffered } from './CaligrafiaOffer'
import { showCaligrafiaAtEnd } from '@/engine/caligrafia/offer'
import { afterAnswer, blockTimeText, canPostpone, earnsStars, missedTable, postpone, SESSION_STARS, SUBJECT_LIMIT_SECONDS, sessionDoneKey, sessionRewardKey, startRun, summarizeRun, isTimeUp, type RunItem, type RunSummary } from './logic'
import s from './session.module.css'

export interface DailySessionProps {
  /** maths (default), Lengua or English: the planner, the blocks and the reward key follow it. */
  subject?: LessonSubject
  onDone: () => void
  onExit: () => void
}

/** What each subject's session shows and runs: the activity name of its attempts, its title and minutes, the blocks the intro
    lists, whether its class comes first (its «Empezar» opens the class), and whether the adventure is offered at the end. */
const SESSION_SETUP: Record<LessonSubject, {
  activity: string; title: string; minutes: number; classFirst: boolean; adventure: boolean; blocks: [string, string][]
}> = {
  math: {
    activity: 'sesion', title: 'Mi sesión de hoy', minutes: DAILY_MINUTES, classFirst: false, adventure: true,
    blocks: [['Calentamiento', '2 min · de cabeza'], ['Lo nuevo', '5 min · con un ejemplo'], ['Mezcla', '5 min · de todo un poco'], ['Problema', '2 min · con historia']],
  },
  language: {
    activity: 'sesion-lengua', title: 'Mi sesión de Lengua', minutes: DAILY_MINUTES, classFirst: true, adventure: false,
    blocks: [['Calentamiento', '2 min · de cabeza'], ['Lo nuevo', '5 min · con la clase'], ['Lectura', '4 min · un cuento y sus preguntas'], ['Mezcla', '4 min · ortografía y palabras']],
  },
  english: {
    activity: 'sesion-ingles', title: 'Mi sesión de Inglés', minutes: ENGLISH_SESSION_MINUTES, classFirst: true, adventure: false,
    blocks: [['Calentamiento', '2 min · de cabeza'], ['Lo nuevo', '4 min · con la clase'], ['Mezcla', '3 min · lo que se te resiste'], ['Juego', '2 min · memoria, letras o números']],
  },
}

/** The screen: the host gives the run its attempts and reward hooks; the planner decides the content. */
export default function DailySession({ subject = 'math', ...props }: DailySessionProps) {
  return (
    <GameHostProvider activity={SESSION_SETUP[subject].activity} subject={subject}>
      <SessionRunner subject={subject} {...props} />
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
  /** «Ahora no» presses in this run (see canPostpone). */
  const [postpones, setPostpones] = useState(0)

  const running = phase === 'play' && !paused
  const seconds = useActiveSeconds(running)

  // Attempts (for the visual support) once per visit; the plan is made once, so live updates do not reshuffle it.
  useEffect(() => {
    if (!child) return
    let alive = true
    listAttempts(child.id, { limit: 300, skipHandwriting: true })
      .then((list) => { if (alive) setAttempts(list) })
      .catch(() => { if (alive) setAttempts([]) })
    return () => { alive = false }
  }, [child?.id])

  useEffect(() => {
    if (plan || !child || !mastery || !attempts || !progress) return
    const now = new Date()
    const made = subject === 'english'
      ? planEnglishSession({ child, mastery, attempts, syllabus: syllabusFor('english', child.grade), now, progress, sound: child.settings.sound && speech.available() })
      : subject === 'language'
        ? planLenguaSession({ child, mastery, syllabus: syllabusFor('language', child.grade), now, progress, voice: speech.available() })
        : planDailySession({ child, mastery, attempts, syllabus: syllabusForGrade(child.grade), now, progress })
    setPlan(made)
    if (made.blocks.every((b) => b.items.length === 0)) setPhase('empty')
  }, [child, mastery, attempts, progress, plan, subject])

  useEffect(() => {
    if (phase === 'play' && isTimeUp(seconds, SUBJECT_LIMIT_SECONDS[subject])) setFinishing(true)
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
  const setup = SESSION_SETUP[subject]
  const sessionTitle = setup.title

  function start() {
    if (!plan) return
    const q = startRun(plan)
    setQueue(q)
    setPos(0)
    setResults([])
    setPostpones(0)
    setPhase('play')
  }

  function close(finished: boolean) {
    setEndedByTime(!finished)
    setPhase('closing')
  }

  // «Ahora no»: nothing is reported. The next item slides into this position; the run closes when none is left.
  const onPostponed = () => {
    if (!queue || !canPostpone(queue, pos, postpones)) return
    const q = postpone(queue, pos)
    setPostpones((n) => n + 1)
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
  const pendingClass = setup.classFirst ? plan.classTopicId ?? null : null
  const summary: RunSummary = summarizeRun(queue ?? { slots: [], retried: [] }, results, !endedByTime)
  // A maths session with a missed times-table fact ends offering the song of that table.
  const missed = subject === 'math' ? missedTable(queue ?? { slots: [], retried: [] }, results, songTables(child.grade)) : null
  const ctx = templateContext(child)

  const header = (title: string) => (
    <header className={s.header}>
      <BackButton variant="exit" onClick={() => setPaused(true)} />
      <h1 className={s.headerTitle}>{title}</h1>
      {phase === 'play' ? <span className={s.clock} aria-live="off">{formatClock(seconds)} de {SESSION_SETUP[subject].minutes}</span> : <span />}
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
            <p className={s.kicker}>Unos {setup.minutes} minutos</p>
            <h2 className={s.title}>{childText(child, '¡Vamos, {child}!')}</h2>
            {topic && <p className={s.topicChip}>Hoy aprendemos: <strong>{topicName}</strong></p>}
            <ol className={s.blocks}>
              {setup.blocks.map(([name, time]) => <li key={name}><span>{name}</span><small>{blockTimeText(plan, name, time)}</small></li>)}
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
        missed={missed}
        topicName={topic ? topicName : null}
        rule={topicClass ? renderTemplate(topicClass.lesson.steps[topicClass.lesson.steps.length - 1].text, ctx) : null}
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
              onSkip={queue && canPostpone(queue, pos, postpones) ? onPostponed : undefined}
              allowRetry
              allowDontKnow={slot.item.item.block !== 'warmup'}
              teach={slot.item.item.block === 'warmup' ? 'clue' : 'full'}
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
  // The text scrolls inside its own box; the buttons stay below it, outside the scroll, and a fade shows there is more.
  const scroller = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const measure = () => {
    const el = scroller.current
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [paragraphs])
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
    <div className={s.passageFrame}>
      <div className={s.passageViewport}>
        <div ref={scroller} className={`${s.card} ${s.passage}`} onScroll={measure}>
          <p className={s.blockChip}>Lectura</p>
          <h2 className={s.title}>{reading.title}</h2>
          <div className={s.passageBody}>
            {paragraphs.map((p, i) => <p key={i} className={s.passageText}>{p}</p>)}
          </div>
        </div>
        {more && <div className={s.passageMore} aria-hidden="true" />}
      </div>
      <div className={s.actions}>
        {soundOn ? (
          <Button variant="secondary" size="lg" onClick={listen}>{speaking ? '🔊 Escuchando…' : '🔊 Escuchar'}</Button>
        ) : (
          <><p className={s.text}>Activa el sonido para escuchar el texto</p><SoundSwitch /></>
        )}
        <Button size="lg" variant="success" onClick={onNext}>¡Ahora las preguntas!</Button>
      </div>
    </div>
  )
}

function Closing({ child, progress, subject, summary, missed, topicName, rule, finished, onDone, onGo, ctx }: {
  child: ChildProfile; progress: ProgressState; subject: LessonSubject; summary: RunSummary; missed: number | null; topicName: string | null
  /** The closing step of the topic's class (it starts with «La regla: …»), when the topic has a class: what the child takes home. */
  rule: string | null; finished: boolean
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

  // The stars are for practice (half of the planned items answered), finished or cut by the time; a skipped run gets none.
  const earns = earnsStars(summary)
  useEffect(() => {
    if (started.current || alreadyToday || !earns) return
    started.current = true
    updateProgress(child.id, (p) => (p.flags?.[key] ? p : {
      ...p, stars: p.stars + SESSION_STARS, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString(),
    }))
      .then(() => setAwarded(true))
      .catch(() => toast('Tus estrellas se guardarán en cuanto haya conexión.'))
  }, [alreadyToday, earns, child.id, key])

  // The Lengua end offers the handwriting practice (pen only, after an answered Lengua run); otherwise the end is as before.
  const offered = useCaligrafiaOffered(child)
  const caligrafiaAtEnd = showCaligrafiaAtEnd({ offered, subject, answered: summary.answered })
  // The adventure is maths: a Lengua session does not point at the map.
  const next = SESSION_SETUP[subject].adventure ? safeNext(progress) : null
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
            {[0, 1, 2].map((i) => <StarIcon key={i} size={56} filled={earns && i < SESSION_STARS} />)}
          </div>
          <h2 className={s.title}>
            {finished ? childText(child, '¡Lo has conseguido, {child}!') : childText(child, '¡Buen trabajo, {child}!')}
          </h2>
          <p className={s.text}>
            {summary.answered === 0
              ? 'Hoy no has llegado a contestar ninguno.'
              : summary.total > 0 ? `Has acertado ${summary.correct} de ${summary.total} ejercicios.` : 'Hoy has hablado en inglés.'}
            {' '}{finished ? 'Descansa y vuelve mañana.' : summary.answered > 0 && `Hoy has trabajado ${summary.answered} ${summary.answered === 1 ? 'ejercicio' : 'ejercicios'}. Mañana sigues desde aquí.`}
          </p>
          {topicName && <p className={s.topicChip}>Hoy has trabajado: <strong>{topicName}</strong></p>}
          {rule && <p className={s.text}>{rule}</p>}
          {awarded && <p className={s.reward}>+{SESSION_STARS} estrellas para tu cuerno</p>}
          {alreadyToday && <p className={s.text}>Ya tienes las estrellas de hoy.</p>}
          {hook && <p className={s.story}>Tu aventura: {hook}</p>}
          {caligrafiaAtEnd ? (
            <CaligrafiaOffer onLater={onDone} />
          ) : missed !== null ? (
            <CancionOffer table={missed} onLater={onDone} />
          ) : (
            <div className={s.actions}>
              {next && <Button size="lg" variant="secondary" onClick={() => onGo(next.worldId, next.nodeId)}>Seguir la aventura</Button>}
              <Button size="lg" variant="success" onClick={onDone}>Volver al inicio</Button>
            </div>
          )}
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
