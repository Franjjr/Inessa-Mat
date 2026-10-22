/* "El laberinto": from the unicorn to the gem, stepping right or down only and only on numbers of the table.
   Each tap is a fact: the attempt is logged per tapped cell. Wrong taps are gentle clues, never failures. */
import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { check, makeFactMul } from '@/engine'
import { haptics, sfx } from '@/audio'
import type { ActivityProps, Exercise } from '@/types'
import { useActivityHost } from '../host'
import { ActivityFrame, ResultCard } from '../facts/shared/ActivityFrame'
import { now } from '../facts/shared/flow'
import { useSession } from '../facts/shared/session'
import shared from '../facts/shared/shared.module.css'
import { buildMaze, type Maze } from './grid'
import s from './maze.module.css'

type Step = { maze: number; pos: number }

export default function MazeActivity({ config, onDone, onExit }: ActivityProps) {
  const host = useActivityHost()
  const reduce = useReducedMotion()
  const params = (config.params ?? {}) as { table?: number; rows?: number; cols?: number }
  const table = params.table ?? (config.selector.tables?.[0] ?? 6)
  const rows = params.rows ?? 6
  const cols = params.cols ?? 6
  const mazeCount = Math.max(1, Math.min(config.count ?? 1, 3))
  const mazes = useMemo<Maze[]>(() => Array.from({ length: mazeCount }, () => buildMaze(table, rows, cols, host.rng)), [])
  const totalSteps = mazes.reduce((sum, m) => sum + Math.max(0, m.path.length - 2), 0)
  const session = useSession({ total: totalSteps, thresholds: config.starThresholds })
  const [step, setStep] = useState<Step>({ maze: 0, pos: 0 })
  const [wrongHere, setWrongHere] = useState(0)
  const [clue, setClue] = useState<string | null>(null)
  const [shakeCell, setShakeCell] = useState<{ cell: number; key: number } | null>(null)
  const [stepStart, setStepStart] = useState(() => now())

  if (session.result) {
    return (
      <div className={s.center}>
        <ResultCard result={session.result} onContinue={() => onDone(session.result!)} />
      </div>
    )
  }

  const maze = mazes[step.maze]
  const cur = maze.path[step.pos]
  const expected = maze.path[step.pos + 1]
  const kOf = (cell: number) => maze.values[cell] / table
  const isGoal = (cell: number) => cell === maze.path[maze.path.length - 1]

  const log = (cell: number, ok: boolean, ms: number) => {
    const value = maze.values[cell]
    const exercise: Exercise = makeFactMul(table, ok ? kOf(cell) : kOf(expected))
    const res = check(exercise, { type: 'number', value })
    host.reportAttempt({ exercise, check: res, ms, inputMode: 'tap', hintsUsed: 0 })
    return res
  }

  const tap = (cell: number) => {
    if (cell === cur || isGoal(cell) && cell !== expected) return
    const ms = Math.round(now() - stepStart)
    if (cell === expected && !isGoal(cell)) {
      const res = log(cell, true, ms)
      sfx.play('step')
      haptics.tap()
      host.react('correct', { errorType: res.errorType })
      const ok = wrongHere === 0
      const nextPos = step.pos + 1
      setClue(null)
      setWrongHere(0)
      setStepStart(now())
      // Every number of the maze is one item. After the last number the maze is done (the gem needs no tap).
      const mazeDone = nextPos === maze.path.length - 2
      session.answered(ok)
      if (mazeDone && step.maze < mazes.length - 1) {
        setStep({ maze: step.maze + 1, pos: 0 })
      } else if (!mazeDone) {
        setStep({ maze: step.maze, pos: nextPos })
      }
      return
    }
    // Wrong tap.
    const isOnPath = maze.path.includes(cell)
    const multiple = maze.values[cell] % table === 0 && maze.values[cell] > 0
    if (isOnPath && maze.path.indexOf(cell) < step.pos) {
      setClue('Ya has pasado por ahí. ¡Mira hacia delante!')
      return
    }
    log(cell, false, ms)
    sfx.play('wrong')
    haptics.error()
    host.react('wrong')
    setWrongHere((w) => w + 1)
    setShakeCell({ cell, key: Date.now() })
    setClue(
      multiple
        ? `Ese sí es del ${table}, pero el camino va a la derecha o hacia abajo.`
        : `Ese número no es de la tabla del ${table}. ¡Busca otro!`,
    )
  }

  const cellsOut = maze.values.map((v, cell) => {
    const isStart = cell === 0
    const isGem = isGoal(cell)
    const visited = maze.path.indexOf(cell) !== -1 && maze.path.indexOf(cell) <= step.pos
    const hint = wrongHere >= 2 && cell === expected
    return (
      <motion.button
        key={`${step.maze}-${cell}`}
        type="button"
        className={clsx(s.cell, visited && s.visited, cell === cur && s.here, hint && s.hintCell, isStart && s.start, isGem && s.gem)}
        aria-label={isStart ? 'Unicornio' : isGem ? 'Cristal' : `Casilla ${v}`}
        onClick={() => tap(cell)}
        animate={shakeCell?.cell === cell && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        {isStart ? '🦄' : isGem ? '💎' : cell === cur ? '🦄' : v}
      </motion.button>
    )
  })

  return (
    <ActivityFrame
      title={config.title}
      instructions={config.instructions}
      index={session.index}
      total={totalSteps}
      accent="var(--w1)"
      accentSoft="var(--w1-soft)"
      onExit={onExit}
      badge={mazeCount > 1 ? <span className={shared.statPill}>Laberinto {step.maze + 1} de {mazeCount}</span> : undefined}
    >
      <div className={s.board} style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }} role="group" aria-label={`Laberinto de la tabla del ${table}`}>
        {cellsOut}
      </div>
      <p className={clsx(shared.clue, clue ? undefined : s.quiet)} role="status" aria-live="polite">
        {clue ?? `Pisa solo números de la tabla del ${table}, a la derecha o hacia abajo.`}
      </p>
    </ActivityFrame>
  )
}
