/* Gráficos (chart), probabilidad (chance), series (pattern) and posición (position): one view module for the four
   kinds. The picture comes first (a pictogram, a bar chart, a list, a bag, a row of tiles, a grid with arrows), then
   either big option buttons or the writing pad, and the AnswerBar with «Comprobar» and the hint. */
import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import type { ChanceExercise, ChartExercise, ChartTable, ExerciseViewProps, PatternExercise, PositionExercise } from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { bare } from '@/engine'
import { useAnswerFlow, type AnswerFlow } from '../groups/flow'
import g from './FractionsGeometry.module.css'
import s from './DataViews.module.css'

type DataEx = ChartExercise | ChanceExercise | PatternExercise | PositionExercise

export default function DataView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'chart' && exercise.kind !== 'chance' && exercise.kind !== 'pattern' && exercise.kind !== 'position') return null
  return <DataRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
}

function DataRound({ ex, onAnswered, showFeedback, allowHints }: { ex: DataEx } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const label = ex.kind === 'chart' ? 'Gráfico' : ex.kind === 'chance' ? 'Probabilidad' : ex.kind === 'pattern' ? 'Serie' : 'Posición'
  return (
    <section className={g.view} aria-label={label} data-kind={ex.kind} data-status={status}>
      {ex.kind === 'chart' && <ChartRound ex={ex} flow={flow} />}
      {ex.kind === 'chance' && <ChoiceRound flow={flow} options={ex.options} question={ex.question}><Bag ex={ex} /></ChoiceRound>}
      {ex.kind === 'pattern' && <PatternRound ex={ex} flow={flow} />}
      {ex.kind === 'position' && <ChoiceRound flow={flow} options={ex.options} question={ex.question}><Grid ex={ex} /></ChoiceRound>}
    </section>
  )
}

// ---------------------------------------------------------------- answers

function ChoiceRound({ flow, options, question, children, emoji = false }: { flow: AnswerFlow; options: string[]; question: string; children: ReactNode; emoji?: boolean }) {
  const [picked, setPicked] = useState<number | null>(null)
  const submit = () => {
    if (picked === null) return
    if (flow.submit({ type: 'choice', index: picked }).correct) celebrate('small')
  }
  return (
    <>
      {children}
      <p className={g.prompt}>{question}</p>
      <div className={g.optionGrid} role="group" aria-label="Respuestas">
        {options.map((o, i) => (
          <button
            key={i}
            type="button"
            className={clsx(g.option, picked === i && g.optionOn, emoji && s.emojiOption)}
            aria-pressed={picked === i}
            onClick={() => { if (!flow.result?.correct) setPicked(i) }}
          >
            {o}
          </button>
        ))}
      </div>
      <AnswerBar flow={flow} onCheck={submit} canCheck={picked !== null} />
    </>
  )
}

function NumberRound({ flow, question, ariaLabel, children, maxDigits = 3 }: { flow: AnswerFlow; question: string; ariaLabel: string; children: ReactNode; maxDigits?: number }) {
  const [value, setValue] = useState<number | null>(null)
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const submit = (v: number | null = value) => {
    if (v === null) return
    if (flow.submit({ type: 'number', value: v }).correct) celebrate('small')
  }
  return (
    <>
      {children}
      <p className={g.prompt}>{question}</p>
      <div className={g.inputRow}>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={maxDigits}
          size="lg"
          status={status}
          ariaLabel={ariaLabel}
          placeholder="?"
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={value !== null} />
    </>
  )
}

// ---------------------------------------------------------------- gráficos

function ChartRound({ ex, flow }: { ex: ChartExercise; flow: AnswerFlow }) {
  const picture = (
    <>
      <p className={s.title}>{ex.title}</p>
      <div className={s.card}>
        {ex.mode === 'pictogram' && <Pictogram ex={ex} />}
        {ex.mode === 'bars' && <BarChart ex={ex} />}
        {ex.mode === 'table' && ex.table && <TwoWayTable table={ex.table} />}
        {(ex.mode === 'data' || ex.mode === 'tally') && (
          <ul className={s.chips} aria-label="Datos">
            {ex.data.map((v, i) => <li key={i} className={s.chip}>{v}</li>)}
          </ul>
        )}
      </div>
    </>
  )
  if (ex.options.length) return <ChoiceRound flow={flow} options={ex.options} question={ex.question}>{picture}</ChoiceRound>
  const small = ex.mode === 'data' || ex.mode === 'tally' || ex.mode === 'table'
  return <NumberRound flow={flow} question={ex.question} ariaLabel="Respuesta" maxDigits={small ? 2 : 3}>{picture}</NumberRound>
}

/** A double-entry table: the groups down the side, the options across the top, one count in each cell. */
function TwoWayTable({ table }: { table: ChartTable }) {
  return (
    // The wrapper scrolls the table itself if it is ever wider than the card; the page never scrolls sideways.
    <div className={s.tableWrap}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" aria-label="Grupo" />
            {table.cols.map((c) => (
              <th key={c.label} scope="col">
                <span className={s.tableEmoji} aria-hidden>{c.emoji}</span>
                <span className={s.tableHead}>{bare(c.label)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={row}>
              <th scope="row">{row}</th>
              {table.cells[r].map((v, c) => <td key={c}>{v}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pictogram({ ex }: { ex: ChartExercise }) {
  return (
    <>
      <ul className={s.pictRows}>
        {ex.categories.map((c) => (
          <li key={c.label} className={s.pictRow}>
            <span className={s.pictLabel}>{c.label.replace(/^(el|la|los|las) /, '').replace(/^./, (x) => x.toUpperCase())}</span>
            <span className={s.pictIcons} role="img" aria-label={`${c.value / ex.per} dibujos`}>
              {Array.from({ length: c.value / ex.per }, (_, k) => <span key={k} aria-hidden>{c.emoji}</span>)}
            </span>
          </li>
        ))}
      </ul>
      <p className={s.legend}>Cada dibujo vale {ex.per}.</p>
    </>
  )
}

/** Vertical bars with a scale on the left and the picture of each category below its bar. */
function BarChart({ ex }: { ex: ChartExercise }) {
  const top = Math.max(10, Math.ceil(Math.max(...ex.categories.map((c) => c.value)) / ex.per) * ex.per)
  // Compact on purpose: on a phone the drawing shrinks to the screen, and the scale must stay readable.
  const W = 70 + ex.categories.length * 80
  const H = 300
  const left = 44
  const bottom = H - 52
  const up = 16
  const y = (v: number) => bottom - ((bottom - up) * v) / top
  const ticks = Array.from({ length: top / ex.per + 1 }, (_, k) => k * ex.per)
  return (
    <svg className={s.bars} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Gráfica de barras de ${ex.categories.length} columnas`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} x2={W - 12} y1={y(t)} y2={y(t)} className={s.gridLine} />
          {(top <= 10 || t % (2 * ex.per) === 0) && <text x={left - 8} y={y(t) + 7} textAnchor="end" className={s.scale}>{t}</text>}
        </g>
      ))}
      {ex.categories.map((c, i) => {
        const x = left + 18 + i * 80
        return (
          <g key={c.label}>
            <rect x={x} y={y(c.value)} width={48} height={bottom - y(c.value)} rx={6} className={s.bar} />
            <text x={x + 24} y={H - 12} textAnchor="middle" className={s.barEmoji}>{c.emoji}</text>
          </g>
        )
      })}
      <line x1={left} x2={left} y1={up - 6} y2={bottom} className={s.axis} />
      <line x1={left} x2={W - 12} y1={bottom} y2={bottom} className={s.axis} />
    </svg>
  )
}

// ---------------------------------------------------------------- probabilidad

function Bag({ ex }: { ex: ChanceExercise }) {
  const balls = ex.bag.flatMap((b) => Array.from({ length: b.count }, () => b.emoji))
  const text = ex.bag.map((b) => `${b.count} ${b.count === 1 ? b.label : /[aeiou]$/.test(b.label) ? `${b.label}s` : `${b.label}es`}`).join(', ')
  return (
    <div className={s.bag} role="img" aria-label={`En la bolsa hay ${text}`}>
      {balls.map((e, i) => <span key={i} aria-hidden>{e}</span>)}
    </div>
  )
}

// ---------------------------------------------------------------- series

function PatternRound({ ex, flow }: { ex: PatternExercise; flow: AnswerFlow }) {
  const tiles = (
    <ul className={s.tiles} aria-label="Serie">
      {ex.items.map((v, i) => (
        <li key={i} className={clsx(s.tile, v === null && s.tileGap)} aria-label={v === null ? 'Hueco' : undefined}>
          {v === null ? '?' : v}
        </li>
      ))}
      {ex.mode === 'predict' && <li className={s.tile} aria-hidden>…</li>}
    </ul>
  )
  if (ex.mode === 'shapes') return <ChoiceRound flow={flow} options={ex.options} question="¿Qué figura va en el hueco?" emoji>{tiles}</ChoiceRound>
  const question = ex.mode === 'predict' ? `Si la serie sigue igual, ¿qué número estará en el puesto ${ex.position}?` : '¿Qué número falta en la serie?'
  return <NumberRound flow={flow} question={question} ariaLabel="Número" maxDigits={4}>{tiles}</NumberRound>
}

// ---------------------------------------------------------------- posición

function Grid({ ex }: { ex: PositionExercise }) {
  return (
    <>
      <div className={s.grid} style={{ gridTemplateColumns: `repeat(${ex.cols}, 1fr)` }} role="img" aria-label="Cuadrícula">
        {Array.from({ length: ex.rows * ex.cols }, (_, k) => {
          const r = Math.floor(k / ex.cols)
          const c = k % ex.cols
          const i = ex.cells.findIndex((x) => x.row === r && x.col === c)
          const cell = i >= 0 ? ex.cells[i] : null
          return (
            <span key={k} className={clsx(s.cell, ex.start === i && i >= 0 && s.cellStart)}>
              {cell && <span role="img" aria-label={cell.name}>{cell.emoji}</span>}
            </span>
          )
        })}
      </div>
      <div className={s.sides} aria-hidden><span>← izquierda</span><span>derecha →</span></div>
      {ex.mode === 'route' && (
        <ul className={s.moves} aria-label="Pasos">
          {ex.moves.map((m, k) => (
            <li key={k} className={s.move}>{ARROWS[m.dir].repeat(m.n)}</li>
          ))}
        </ul>
      )}
    </>
  )
}

const ARROWS = { left: '←', right: '→', up: '↑', down: '↓' } as const
