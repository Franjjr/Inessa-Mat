/* Route /play/cancion/:table — «La canción del 7». The voice of the app sings the table over the song music, verse by
   verse on the first beat of a bar (karaoke), then «¡Tu turno!»: the voice stops on the facts this child finds hard and
   she taps the right bubble. No clock (PEDAGOGY §8): the music loops while she thinks. Stars are progress flags.
   Design: docs/superpowers/specs/2026-11-08-canciones-tablas-design.md. */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { music, speech } from '@/audio'
import { CompanionArt } from '@/art'
import { makeFactMul, strategyForFact } from '@/engine'
import { useActivityHost } from '@/activities'
import { ResultCard } from '@/activities/facts/shared/ActivityFrame'
import { updateProgress, useActiveChild, useMastery, useProgress } from '@/data'
import { GameHostProvider } from '@/world/host/GameHost'
import { BackButton, Button, Screen, Spinner } from '@/ui'
import type { ChildProfile, MasteryMap, MusicTheme } from '@/types'
import {
  bubbleChoices, songFlagKey, songGaps, songLevel, songLines, songStars, songTables, songTexts, type FactLine,
} from './logic'
import { runSong, type SongRun } from './sequencer'
import s from './cancion.module.css'

const PRELOAD_MS = 6000
/** Verses on screen at once: a window around the one sounding (fits a 360 × 740 phone). */
const WINDOW = 5

type Phase = 'ready' | 'preparing' | 'playing' | 'result'
interface Asking { line: FactLine; choices: number[]; dimmed: number[]; startedAt: number }

export default function CancionScreen() {
  const { table: raw } = useParams()
  const { child } = useActiveChild()
  const progress = useProgress(child?.id)
  const mastery = useMastery(child?.id)
  const table = Number(raw)

  if (!child) return <Spinner />
  if (!songTables(child.grade).includes(table)) return <Navigate to="/play/free" replace />
  if (!progress || mastery === undefined) return <Spinner label="Preparando la canción…" />

  return (
    <GameHostProvider>
      <SongPlayer child={child} table={table} flags={progress.flags} mastery={mastery} />
    </GameHostProvider>
  )
}

function SongPlayer({ child, table, flags, mastery }: { child: ChildProfile; table: number; flags?: Record<string, boolean>; mastery: MasteryMap }) {
  const host = useActivityHost()
  const navigate = useNavigate()
  const lines = useMemo(() => songLines(table), [table])
  const stars = songStars(flags, table)

  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState<1 | 2>(1)
  const [lineIdx, setLineIdx] = useState<number | null>(null)
  const [asking, setAsking] = useState<Asking | null>(null)
  // «¡Tu turno!»: the gaps keep their result hidden on screen until the child answers them.
  const [gaps, setGaps] = useState<number[]>([])
  const [answered, setAnswered] = useState<number[]>([])
  const [result, setResult] = useState<{ stars: number; right: number; total: number } | null>(null)

  const run = useRef<SongRun | null>(null)
  const prevMusic = useRef<MusicTheme | null>(null)
  const answer = useRef<((r: { firstTry: boolean }) => void) | null>(null)
  const misses = useRef(0)
  const busy = useRef(false)
  const device = useRef(false)
  const firstTries = useRef(0)
  /** A song is under way (preparing or playing): what hiding the app or leaving must stop. */
  const active = useRef(false)

  const say = (text: string) => speech.say(text, { voice: 'lumi', force: true, deviceOnly: device.current })

  /** Stops the song for good: voice, song music (the previous music comes back) and any pending question. */
  const stop = () => {
    active.current = false
    run.current?.abort()
    run.current = null
    answer.current = null
    speech.stop()
    if (prevMusic.current !== null) music.play(prevMusic.current)
    prevMusic.current = null
  }

  const start = async () => {
    if (phase !== 'ready' || active.current) return
    active.current = true
    setPhase('preparing')
    prevMusic.current = music.current()
    const gaps = songGaps(table, mastery, songLevel(stars))
    setGaps(gaps)
    setAnswered([])
    const ok = await speech.preload(songTexts(table), { voice: 'lumi', timeoutMs: PRELOAD_MS })
    // Left, or the app was hidden, while preparing: the song does not start.
    if (!active.current || document.visibilityState === 'hidden') {
      if (active.current) {
        stop()
        setPhase('ready')
      }
      return
    }
    device.current = !ok
    music.play('song', { force: true })
    firstTries.current = 0
    setRound(1)
    setPhase('playing')
    const r = runSong(table, lines, gaps, {
      say,
      waitBar: () => new Promise((res) => setTimeout(res, Math.max(0, (music.nextBarIn() ?? 0) * 1000))),
      ask: (line) => new Promise((res) => {
        misses.current = 0
        busy.current = false
        answer.current = res
        setAsking({ line, choices: bubbleChoices(table, line.n, Math.random), dimmed: [], startedAt: performance.now() })
      }),
      onLine: setLineIdx,
      onRound: setRound,
    })
    run.current = r
    const res = await r.done
    if (!res || run.current !== r) return
    run.current = null
    active.current = false
    let total = stars
    if (res.allFirstTry && stars < 3) {
      total = stars + 1
      const key = songFlagKey(table, total as 1 | 2 | 3)
      void updateProgress(child.id, (p) => (p.flags?.[key] ? p : { ...p, flags: { ...p.flags, [key]: true }, updatedAt: new Date().toISOString() }))
        .catch(() => undefined)
    }
    if (prevMusic.current !== null) music.play(prevMusic.current)
    prevMusic.current = null
    setResult({ stars: total, right: firstTries.current, total: gaps.length })
    setPhase('result')
  }

  const tap = async (choice: number) => {
    const a = asking
    if (!a || busy.current || a.dimmed.includes(choice)) return
    busy.current = true
    const right = choice === a.line.answer
    host.reportAttempt({
      exercise: makeFactMul(table, a.line.n),
      check: { correct: right, given: String(choice), expected: String(a.line.answer), ...(right ? {} : { errorType: 'fact' as const }) },
      ms: Math.round(performance.now() - a.startedAt),
      inputMode: 'tap',
      hintsUsed: 0,
      graded: false,
    })
    if (right) {
      if (misses.current === 0) firstTries.current += 1
      setAnswered((xs) => [...xs, a.line.n])
      const res = answer.current
      answer.current = null
      setAsking(null)
      res?.({ firstTry: misses.current === 0 })
      return
    }
    misses.current += 1
    setAsking({ ...a, dimmed: [...a.dimmed, choice] })
    // The trick of that fact, never a «mal» (PEDAGOGY §6); the bubbles wait meanwhile.
    await say(strategyForFact(table, a.line.n).text)
    busy.current = false
  }

  const exit = () => {
    stop()
    navigate('/play/free')
  }

  // Leaving the screen, or hiding the app: the song stops (nothing keeps talking), back to the start button.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'hidden' || !active.current) return
      stop()
      setAsking(null)
      setLineIdx(null)
      setPhase('ready')
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'result' && result) {
    return (
      <Screen className={s.root} background="var(--c-bg)">
        <div className={s.resultWrap}>
          <h1 className={s.title}>¡Tabla del {table} cantada!</h1>
          <ResultCard
            result={{ correct: result.right, total: result.total, stars: result.stars as 0 | 1 | 2 | 3, ms: 0 }}
            untimed
            onContinue={() => navigate('/play/free')}
          />
        </div>
      </Screen>
    )
  }

  /** In round 2 a gap not answered yet shows «7 × 8 = ?», and the rhymes (which say the results) are hidden. */
  const shown = (l: (typeof lines)[number]) => {
    if (round !== 2) return l.show
    if (l.kind === 'rhyme') return '♪ …'
    return gaps.includes(l.n) && !answered.includes(l.n) ? `${table} × ${l.n} = ?` : l.show
  }

  const from = lineIdx === null ? 0 : Math.max(0, Math.min(lines.length - WINDOW, lineIdx - 2))
  const visible = lines.slice(from, from + WINDOW)

  return (
    <Screen className={s.root} background="var(--c-bg)">
      <header className={s.header}>
        <BackButton variant="exit" label="Salir" onClick={exit} />
        <h1 className={s.title}>La canción del {table}</h1>
        <span className={s.pill}>{phase === 'playing' ? (round === 1 ? 'Escucha y canta' : '¡Tu turno!') : `${stars} ★`}</span>
      </header>

      <div className={s.stage}>
        <div className={s.buddy} data-playing={phase === 'playing' || undefined}>
          <CompanionArt species={child.companion.species} colorway={child.companion.colorway} equipped={child.companion.equipped} size={96} animated />
        </div>

        {phase === 'ready' && (
          <div className={s.start}>
            <p className={s.hint}>Primero la cantamos juntos. Luego te toca a ti.</p>
            <Button size="lg" variant="magic" onClick={() => void start()}>▶ ¡A cantar!</Button>
          </div>
        )}
        {phase === 'preparing' && <Spinner label="Preparando la canción…" />}

        {phase === 'playing' && (
          <>
            <ol className={s.lines} aria-label={`La canción del ${table}`}>
              {visible.map((l, k) => {
                const i = from + k
                const state = i === lineIdx ? 'now' : lineIdx !== null && i < lineIdx ? 'done' : undefined
                return (
                  <li key={i} className={s.line} data-state={state} data-rhyme={l.kind === 'rhyme' || undefined}>
                    {shown(l)}
                  </li>
                )
              })}
            </ol>

            {asking && (
              <div className={s.ask}>
                <p className={s.askLead} data-testid="song-ask">{table} × {asking.line.n} = ?</p>
                <div className={s.bubbles} role="group" aria-label="Elige el resultado">
                  {asking.choices.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={s.bubble}
                      data-bubble="1"
                      disabled={asking.dimmed.includes(c)}
                      onClick={() => void tap(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {round === 1 && (
              <Button variant="secondary" onClick={() => run.current?.skipToTurn()}>¡Ir a mi turno!</Button>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
