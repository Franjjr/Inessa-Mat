/* Activity "board": Carrera al Castillo. The child rolls the die and answers one fact. A right answer walks the number
   of squares rolled; a wrong one keeps the child where it is. The opponent (Lumi by default) walks one square per turn.
   Special squares (params.specials) send the walker forward or back. The race ends at the castle, when the opponent
   gets there first, or when the questions run out. */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ActivityProps, CharacterId, Exercise, ExerciseOutcome } from '@/types'
import { generate, starsFor } from '@/engine'
import { useActivityHost } from '@/activities/host'
import { ExerciseView } from '@/activities'
import { Character } from '@/art'
import { sfx } from '@/audio'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { NoRounds, OpsShell } from '../groups/OpsShell'
import s from './board.module.css'

interface Special { at: number; emoji: string; text: string; move: number }
type Opponent = Exclude<CharacterId, 'companion' | 'narrator'>
type Phase = 'roll' | 'question' | 'walking' | 'turnEnd' | 'done'

const STEP_MS = 230
const TURN_END_MS = 900
const ROLL_MS = 620
const COLS = 5
const OPPONENTS: Opponent[] = ['lumi', 'borron', 'owl', 'frog', 'ladybug', 'polarbear', 'octopus', 'fairy', 'dragon', 'queen']

function readSpecials(raw: unknown, squares: number): Special[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((x): x is Special => !!x && typeof x.at === 'number' && typeof x.move === 'number' && typeof x.text === 'string' && typeof x.emoji === 'string')
    .filter((x) => x.at > 1 && x.at < squares)
}

export default function BoardActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const squares = Math.max(6, Math.min(30, Number(config.params?.squares) || 20))
  const specials = useMemo(() => readSpecials(config.params?.specials, squares), [config.params, squares])
  const rawOpponent = config.params?.opponent
  const opponent: Opponent = OPPONENTS.find((id) => id === rawOpponent) ?? 'lumi'
  const exercises = useMemo(
    () => generate(config.selector, config.count ?? 12, { rng: host.rng, mastery: host.mastery }),
    // The questions of one race are fixed once generated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config],
  )
  if (exercises.length === 0) return <NoRounds title={config.title} onExit={onExit} />
  return (
    <Race
      title={config.title}
      exercises={exercises}
      squares={squares}
      specials={specials}
      opponent={opponent}
      starThresholds={config.starThresholds}
      onDone={onDone}
      onExit={onExit}
    />
  )
}

interface RaceProps {
  title: string
  exercises: Exercise[]
  squares: number
  specials: Special[]
  opponent: Opponent
  starThresholds: ActivityProps['config']['starThresholds']
  onDone: ActivityProps['onDone']
  onExit?: () => void
}

function Race({ title, exercises, squares, specials, opponent, starThresholds, onDone, onExit }: RaceProps) {
  const host = useActivityHost()
  const hostRef = useRef(host)
  hostRef.current = host
  const started = useRef(Date.now())
  const [pos, setPos] = useState(1)
  const [goal, setGoal] = useState(1)
  const [oppPos, setOppPos] = useState(1)
  const [phase, setPhase] = useState<Phase>('roll')
  const [die, setDie] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [won, setWon] = useState<boolean | null>(null)
  const usedSpecials = useRef(new Set<number>())
  const finished = useRef(false)
  const rollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(rollTimer.current), [])

  // Walking: one square per tick towards the goal. On arrival a special square may send the walker on.
  useEffect(() => {
    if (phase !== 'walking') return
    let t: ReturnType<typeof setTimeout> | undefined
    if (pos < goal) t = setTimeout(() => setPos((p) => p + 1), STEP_MS)
    else if (pos > goal) t = setTimeout(() => setPos((p) => p - 1), STEP_MS)
    else {
      const sp = specials.find((x) => x.at === pos && !usedSpecials.current.has(x.at))
      if (sp) {
        usedSpecials.current.add(sp.at)
        sfx.play(sp.move >= 0 ? 'whoosh' : 'pop', { volume: 0.6 })
        setMessage(hostRef.current.t(sp.text))
        setGoal(Math.max(1, Math.min(squares, pos + sp.move)))
      } else {
        setPhase('turnEnd')
      }
    }
    return () => clearTimeout(t)
  }, [phase, pos, goal, specials, squares])

  const endRace = (win: boolean) => {
    setWon(win)
    setPhase('done')
    if (win) celebrate('big')
    else sfx.play('timeup', { volume: 0.5 })
  }

  // Turn end: the opponent walks one square, then the next question (or the end of the race).
  useEffect(() => {
    if (phase !== 'turnEnd') return
    const t = setTimeout(() => {
      const nextOpp = oppPos + 1
      setOppPos(Math.min(squares, nextOpp))
      if (pos >= squares) return endRace(true)
      if (nextOpp >= squares) return endRace(false)
      if (qIdx + 1 >= exercises.length) return endRace(false)
      setQIdx((i) => i + 1)
      setDie(null)
      setMessage(null)
      setPhase('roll')
    }, TURN_END_MS)
    return () => clearTimeout(t)
  }, [phase, oppPos, pos, qIdx, squares, exercises.length])

  const roll = () => {
    if (phase !== 'roll' || rolling) return
    setRolling(true)
    sfx.play('dice', { volume: 0.7 })
    const value = 1 + Math.floor(host.rng() * 6)
    rollTimer.current = setTimeout(() => {
      setDie(value)
      setRolling(false)
      setPhase('question')
    }, ROLL_MS)
  }

  const exercise = exercises[qIdx]
  const onAnswered = (outcome: ExerciseOutcome) => {
    if (!exercise) return
    host.reportAttempt({
      exercise,
      check: outcome.check,
      ms: outcome.ms,
      inputMode: outcome.inputMode,
      hintsUsed: outcome.hintsUsed,
      recognitionFixes: outcome.recognitionFixes,
    })
    host.react(outcome.check.correct ? 'correct' : 'wrong', { errorType: outcome.check.errorType })
    setAnswered((n) => n + 1)
    if (outcome.check.correct) {
      setCorrect((n) => n + 1)
      const steps = die ?? 1
      setMessage(host.t(`¡Bien! Avanzas ${steps} ${steps === 1 ? 'casilla' : 'casillas'}.`))
      setGoal(Math.min(squares, pos + steps))
      setPhase('walking')
    } else {
      setMessage(host.t('Esta vez no avanzas. ¡Mira el truco y prueba en el siguiente turno!'))
      setPhase('turnEnd')
    }
  }

  const finish = () => {
    if (finished.current) return
    finished.current = true
    const total = Math.max(answered, 1)
    onDone({
      correct,
      total,
      stars: starsFor(correct, total, starThresholds),
      ms: Date.now() - started.current,
    })
  }

  const rows = Math.ceil(squares / COLS)
  // Snake layout: square 1 at the bottom left, the path goes right on even rows and left on odd rows.
  const layout = (n: number) => {
    const k = Math.floor((n - 1) / COLS)
    const c = (n - 1) % COLS
    const col = k % 2 === 0 ? c : COLS - 1 - c
    return { row: rows - k, col: col + 1 }
  }
  const specialAt = (n: number) => specials.find((x) => x.at === n)
  const stars = starsFor(correct, Math.max(answered, 1), starThresholds)

  if (phase === 'done') {
    return (
      <OpsShell title={title} index={qIdx + 1} total={exercises.length} onExit={onExit} className={s.shell}>
        <section className={s.end} aria-label="Fin de la carrera">
          <div className={s.endCard}>
            <span className={s.endIcon} aria-hidden>{won ? '🏰' : '🎲'}</span>
            <h2 className={s.endTitle}>{host.t(won ? '¡Has llegado al castillo, {child}!' : '¡Buena carrera, {child}!')}</h2>
            <p className={s.endText}>{host.t(`Has acertado ${correct} de ${answered}.`)}</p>
            <p className={s.endStars} aria-label={`${stars} de 3 estrellas`}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</p>
            <Button variant="magic" size="lg" onClick={finish}>{host.t('Continuar')}</Button>
          </div>
        </section>
      </OpsShell>
    )
  }

  return (
    <OpsShell title={title} index={qIdx} total={exercises.length} onExit={onExit} className={s.shell}>
      <section className={s.race} aria-label="Carrera al castillo">
        <div className={s.track} style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}>
          {Array.from({ length: squares }, (_, i) => i + 1).map((n) => {
            const { row, col } = layout(n)
            const sp = specialAt(n)
            return (
              <div
                key={n}
                className={`${s.square} ${n === 1 ? s.start : ''} ${n === squares ? s.castle : ''} ${sp ? s.special : ''}`}
                style={{ gridRow: row, gridColumn: col }}
                aria-label={`casilla ${n}${sp ? `, ${sp.emoji}` : ''}`}
              >
                <span className={s.num} aria-hidden>{n === 1 ? '🏠' : n === squares ? '🏰' : n}</span>
                {sp && <span className={s.spEmoji} aria-hidden>{sp.emoji}</span>}
                <span className={s.tokens}>
                  {n === pos && <span className={s.me} aria-label="Tú">🐾</span>}
                  {n === oppPos && (
                    <span className={s.opp} aria-label="Lumi">
                      <Character id={opponent} size={44} animated={false} />
                    </span>
                  )}
                </span>
              </div>
            )
          })}
        </div>

        <div className={s.side}>
          <div className={s.dieBox}>
            <button
              type="button"
              className={`${s.die} ${rolling ? s.rolling : ''}`}
              onClick={roll}
              disabled={phase !== 'roll'}
              aria-label={die ? `Dado: ${die}` : 'Tirar el dado'}
            >
              <span aria-hidden>{die ?? '🎲'}</span>
            </button>
            <span className={s.dieHint}>
              {phase === 'roll' ? host.t('Toca el dado') : die ? host.t(`Has sacado ${die}`) : ''}
            </span>
          </div>

          {phase === 'question' && exercise && die !== null && (
            <div className={s.question}>
              <p className={s.qText}>
                {host.t(`Si aciertas, avanzas ${die} ${die === 1 ? 'casilla' : 'casillas'}.`)}
              </p>
              <ExerciseView exercise={exercise} onAnswered={onAnswered} showFeedback allowHints />
            </div>
          )}

          {message && phase !== 'question' && <p className={s.msg} aria-live="polite">{message}</p>}
        </div>
      </section>
    </OpsShell>
  )
}
