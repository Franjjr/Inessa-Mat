/* Exercise view "bar-problem" (problemas con barras, PLAN_DOCENTE §5). The story, then the bar diagram: the child puts
   each number on the piece of the bar that it is (tap a number and then the piece, or drag it there). The unknown
   piece shows «?». Then the child chooses the operation of each step and writes the results. Without the drawing
   (withBar false, the second rung of the ladder) only the story, the operations and the results remain. */
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import clsx from 'clsx'
import type { BarOp, BarProblemExercise, BarSlot, ExerciseViewProps } from '@/types'
import { barChips } from '@/engine'
import { NumberInput } from '@/ink'
import { speech } from '@/audio'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow } from '../groups/flow'
import s from './BarProblemView.module.css'

const OPS: { op: BarOp; label: string; sign: string }[] = [
  { op: 'add', label: 'Juntar', sign: '+' },
  { op: 'sub', label: 'Quitar', sign: '−' },
  { op: 'mul', label: 'Repetir', sign: '×' },
  { op: 'div', label: 'Repartir', sign: '÷' },
]

const hashSeed = (text: string): number => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export default function BarProblemView(props: ExerciseViewProps) {
  const { exercise, onAnswered, guided, allowHints = true, showFeedback = true, compact } = props
  if (exercise.kind !== 'bar-problem') return null
  return (
    <BarRound
      key={exercise.id}
      ex={exercise}
      onAnswered={onAnswered}
      guided={guided}
      allowHints={allowHints}
      showFeedback={showFeedback}
      compact={compact}
    />
  )
}

interface RoundProps {
  ex: BarProblemExercise
  onAnswered: ExerciseViewProps['onAnswered']
  guided?: boolean
  allowHints: boolean
  showFeedback: boolean
  compact?: boolean
}

function BarRound({ ex, onAnswered, guided, allowHints, showFeedback, compact }: RoundProps) {
  const host = useActivityHost()
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback, allowHints })
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  const chips = useMemo(() => barChips(ex, hashSeed(ex.id)), [ex])
  const steps = ex.steps.length
  const knownSlots = ex.bar.flatMap((b, i) => (b.value === null ? [] : [i]))

  // at[slot] = the slot the chip came from (each given number is one chip), or null when the piece is empty.
  const [at, setAt] = useState<(number | null)[]>(() => ex.bar.map(() => null))
  const [sel, setSel] = useState<number | null>(null)
  const [ops, setOps] = useState<(BarOp | null)[]>(() => ex.steps.map(() => null))
  const [res, setRes] = useState<(number | null)[]>(() => ex.steps.map(() => null))
  const [dragging, setDragging] = useState<number | null>(null)
  const drag = useRef<{ origin: number; x: number; y: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)

  const placedCount = knownSlots.filter((i) => at[i] !== null).length
  const placedAll = !ex.withBar || placedCount === knownSlots.length
  const opsAll = ops.every((o) => o !== null)
  const resAll = res.every((r) => r !== null)
  const canCheck = placedAll && opsAll && resAll

  const placeAt = (slot: number, origin: number) => {
    if (ex.bar[slot].value === null) return
    setAt((prev) => {
      const next = prev.map((v) => (v === origin ? null : v))
      next[slot] = origin
      return next
    })
    setSel(null)
  }

  const onSlotTap = (slot: number) => {
    if (!ex.withBar || ex.bar[slot].value === null) return
    if (sel !== null) return placeAt(slot, sel)
    if (at[slot] !== null) setAt((prev) => prev.map((v, i) => (i === slot ? null : v)))
  }

  const onChipClick = (origin: number) => {
    if (justDragged.current) { justDragged.current = false; return }
    setSel((cur) => (cur === origin ? null : origin))
  }

  // Dragging a number onto its piece (pointer events; the tap path above works the same).
  const onChipDown = (e: ReactPointerEvent, origin: number) => {
    drag.current = { origin, x: e.clientX, y: e.clientY, moved: false }
  }
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        d.moved = true
        setDragging(d.origin)
      }
    }
    const up = (e: PointerEvent) => {
      const d = drag.current
      drag.current = null
      if (!d) return
      if (!d.moved) return
      justDragged.current = true
      setDragging(null)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const target = el?.closest?.('[data-slot]') as HTMLElement | null
      if (target && target.dataset.slot !== undefined) placeAt(Number(target.dataset.slot), d.origin)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    // placeAt only uses state setters, which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex])

  const submit = (opsNow = ops, resNow = res, atNow = at) => {
    if (!opsNow.every((o) => o !== null) || !resNow.every((r) => r !== null)) return
    const placed = ex.bar.map((_, i) => (ex.withBar && atNow[i] !== null ? ex.bar[atNow[i] as number].value : null))
    const c = flow.submit({ type: 'bar', placed, ops: opsNow, results: resNow })
    if (c.correct) celebrate('small')
  }

  const pickOp = (k: number, op: BarOp) => setOps((prev) => prev.map((o, i) => (i === k ? op : o)))
  const setResult = (k: number, v: number | null) => setRes((prev) => prev.map((r, i) => (i === k ? v : r)))

  const readAloud = () => { void speech.say(text, { interrupt: true }) }
  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  const chipsFree = chips.filter((c) => !at.includes(c.slot))

  // Bars: rows of pieces, the bracket (total) above, the count of groups as a badge.
  const rows = Array.from({ length: ex.rows }, (_, r) => ex.bar.flatMap((b, i) => (b.row === r ? [{ b, i }] : [])))
  const widthOf = (row: { b: BarSlot }[]) => {
    const known = row.flatMap((x) => (x.b.kind === 'segment' && x.b.value !== null ? [x.b.value] : []))
    const avg = known.length ? known.reduce((a, b) => a + b, 0) / known.length : 1
    return (b: BarSlot) => Math.max(1, b.value ?? avg)
  }

  const renderSlot = (b: BarSlot, i: number, row: { b: BarSlot }[]) => {
    const known = b.value !== null
    const filled = known && at[i] !== null
    const target = ex.withBar && known
    const shownValue = !known ? '?' : filled ? String(b.value) : ''
    const label = !known ? `${b.name}: ¿cuánto?` : filled ? `${b.name}: ${b.value}` : `${b.name}: pon aquí un número`
    if (b.kind === 'total') {
      return (
        <div key={i} className={clsx(s.total, target && s.targetTotal, filled && s.filled)}
          data-slot={target ? i : undefined} role={target ? 'button' : undefined} aria-label={label}
          onClick={() => onSlotTap(i)}>
          <span className={s.totalName}>{b.name}</span>
          <strong className={s.totalValue}>{shownValue || '…'}</strong>
        </div>
      )
    }
    if (b.kind === 'count') {
      return (
        <div key={i} className={clsx(s.count, target && s.targetCount, filled && s.filled)}
          data-slot={target ? i : undefined} role={target ? 'button' : undefined} aria-label={label}
          onClick={() => onSlotTap(i)}>
          <span className={s.countName}>{b.name}</span>
          <strong className={s.segValue}>{shownValue || '…'}</strong>
        </div>
      )
    }
    const grow = widthOf(row)(b)
    return (
      <div
        key={i}
        className={clsx(s.seg, !known && s.segUnknown, target && s.target, filled && s.filled)}
        style={{ flexGrow: grow, flexBasis: 96 }}
        data-slot={target ? i : undefined}
        role={target ? 'button' : undefined}
        aria-label={label}
        onClick={() => onSlotTap(i)}
      >
        <span className={s.segName}>{b.name}</span>
        <span className={s.segValue}>{shownValue}</span>
      </div>
    )
  }

  return (
    <section className={clsx(s.view, compact && s.compact)} aria-label="Problema con barras">
      <article className={s.story}>
        <p className={s.text}>{text}</p>
        {host.prefs.voice && (
          <button type="button" className={s.speak} onClick={readAloud} aria-label="Leer en voz alta">🔊 Escuchar</button>
        )}
      </article>

      {ex.withBar && (
        <section className={s.barCard} aria-label="Barra">
          <p className={s.hint}>{host.t('Pon cada número en su sitio: toca el número y luego la parte, o arrástralo.')}</p>
          {Array.from({ length: ex.rows }, (_, r) => {
            const row = rows[r]
            const total = row.find((x) => x.b.kind === 'total')
            return (
              <div key={r} className={s.row}>
                {total && renderSlot(total.b, total.i, row)}
                <div className={s.track}>
                  {row.filter((x) => x.b.kind === 'count').map((x) => renderSlot(x.b, x.i, row))}
                  {row.filter((x) => x.b.kind === 'segment').map((x) => renderSlot(x.b, x.i, row))}
                </div>
              </div>
            )
          })}
          <div className={s.chips} role="group" aria-label="Números de la historia">
            {chipsFree.length === 0 && <span className={s.done}>{host.t('¡Todos colocados!')}</span>}
            {chipsFree.map((c) => (
              <button
                key={c.slot}
                type="button"
                className={clsx(s.chip, sel === c.slot && s.chipOn, dragging === c.slot && s.chipDrag)}
                aria-pressed={sel === c.slot}
                aria-label={`Número ${c.value}`}
                onPointerDown={(e) => onChipDown(e, c.slot)}
                onClick={() => onChipClick(c.slot)}
              >
                {c.value}
              </button>
            ))}
          </div>
        </section>
      )}

      {Array.from({ length: steps }, (_, k) => (
        <div key={k} className={s.step} role="group" aria-label={steps > 1 ? `Paso ${k + 1}` : '¿Qué operación?'}>
          <p className={s.opsTitle}>{steps > 1 ? host.t(`Paso ${k + 1}: ¿qué operación?`) : host.t('¿Qué hacemos con los números?')}</p>
          <div className={s.opButtons}>
            {OPS.map((o) => (
              <button
                key={o.op}
                type="button"
                className={clsx(s.opBtn, ops[k] === o.op && s.opOn)}
                onClick={() => pickOp(k, o.op)}
                aria-pressed={ops[k] === o.op}
              >
                <span className={s.opSign} aria-hidden>{o.sign}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <div className={s.answer}>
            <span className={s.answerLabel}>{k < steps - 1 ? host.t(k === 0 ? 'Primero:' : 'Después:') : host.t('Respuesta:')}</span>
            <NumberInput
              value={res[k]}
              onChange={(v) => setResult(k, v)}
              onSubmit={(v) => {
                const nextRes = res.map((r, i) => (i === k ? v : r))
                setResult(k, v)
                if (ops.every((o) => o !== null) && nextRes.every((r) => r !== null) && placedAll) submit(ops, nextRes)
              }}
              maxDigits={4}
              size="lg"
              status={status}
              ariaLabel={steps > 1 && k < steps - 1 ? `Resultado del paso ${k + 1}` : 'Respuesta'}
              placeholder="?"
              autoFocus={k === 0}
            />
            <span className={s.unit}>{k === steps - 1 ? ex.unit : ''}</span>
          </div>
        </div>
      ))}

      {!compact && <p className={s.guide}>{guided ? host.t('Primero piensa qué pasa en la historia, luego dibuja.') : ''}</p>}

      <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} />
    </section>
  )
}
