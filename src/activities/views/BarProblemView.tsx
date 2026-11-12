/* Exercise view "bar-problem" (problemas con barras, PLAN_DOCENTE §5). The story, then the bar diagram: the child puts
   each number on the piece of the bar that it is (tap a number and then the piece, or drag it there). The unknown
   piece shows «?». Then the child chooses the operation of each step and writes the results. Without the drawing
   (withBar false, the second rung of the ladder) only the story, the operations and the results remain.
   One thing per screen (P3PE-16): «1. Pon cada número en su sitio» (the bar), then each step of the calculation on its
   own screen («2. ¿Qué hacemos…?», then «3. Escribe el resultado»), with «Seguir» and «Atrás». The story stays on top
   on every screen and there is one «Comprobar», on the last one. */
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import clsx from 'clsx'
import type { BarOp, BarProblemExercise, BarSlot, ExerciseViewProps } from '@/types'
import { barChips } from '@/engine'
import { NumberInput } from '@/ink'
import { useActivityHost } from '@/activities/host'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { AnswerBar } from '../groups/AnswerBar'
import { initialOf, RETRY_WRONG_CLASS, useRetryFlow, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { ExerciseLayout } from './ExerciseLayout'
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
      retry={props}
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
  /** «Inténtalo otra vez»: the numbers placed, the operations and the results the child wrote, and what was wrong. */
  retry?: RetryProps
}

/** Where each placed number came from (at[slot] = the slot of its chip), rebuilt from the values placed on the last try:
    a value goes back to a chip with that value (its own slot first), each chip once. */
export function atFromPlaced(ex: BarProblemExercise, placed: readonly (number | null)[]): (number | null)[] {
  const used = new Set<number>()
  const origins = ex.bar.flatMap((b, i) => (b.value === null ? [] : [i]))
  return ex.bar.map((b, slot) => {
    const v = placed[slot]
    if (!ex.withBar || b.value === null || v === null || v === undefined) return null
    const origin = [slot, ...origins].find((o) => !used.has(o) && ex.bar[o].value === v)
    if (origin === undefined) return null
    used.add(origin)
    return origin
  })
}

/** What to mark on a try again: the pieces of the bar with another number (the corrector looks at the drawing first),
    or else the steps the corrector found wrong (the last one when it names none). */
export function barRetryMarks(ex: BarProblemExercise, retry: RetryProps | undefined): { slots: Set<number>; steps: Set<number> } {
  const before = initialOf(retry, 'bar')
  if (!before) return { slots: new Set(), steps: new Set() }
  const slots = ex.withBar ? ex.bar.flatMap((b, i) => (b.value !== null && before.placed[i] !== b.value ? [i] : [])) : []
  if (slots.length) return { slots: new Set(slots), steps: new Set() }
  const named = (retry?.wrongColumns ?? []).filter((k) => k >= 0 && k < ex.steps.length)
  const last = ex.steps.length - 1
  return { slots: new Set(), steps: new Set(named.length ? named : before.results[last] !== ex.answer ? [last] : []) }
}

function BarRound({ ex, onAnswered, guided, allowHints, showFeedback, compact, retry }: RoundProps) {
  const host = useActivityHost()
  const flow = useRetryFlow(ex, { onAnswered, showFeedback, allowHints })
  // A try again starts with what the child did: the numbers on the bar, the operations and the results.
  const [before] = useState(() => initialOf(retry, 'bar'))
  const [marks] = useState(() => barRetryMarks(ex, retry))
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  const chips = useMemo(() => barChips(ex, hashSeed(ex.id)), [ex])
  const steps = ex.steps.length
  const knownSlots = ex.bar.flatMap((b, i) => (b.value === null ? [] : [i]))

  // at[slot] = the slot the chip came from (each given number is one chip), or null when the piece is empty.
  const [at, setAt] = useState<(number | null)[]>(() => (before ? atFromPlaced(ex, before.placed) : ex.bar.map(() => null)))
  const [sel, setSel] = useState<number | null>(null)
  const [ops, setOps] = useState<(BarOp | null)[]>(() => ex.steps.map((_, k) => before?.ops[k] ?? null))
  const [res, setRes] = useState<(number | null)[]>(() => ex.steps.map((_, k) => before?.results[k] ?? null))
  const [dragging, setDragging] = useState<number | null>(null)
  const drag = useRef<{ origin: number; x: number; y: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)

  const placedCount = knownSlots.filter((i) => at[i] !== null).length
  const placedAll = !ex.withBar || placedCount === knownSlots.length
  const opsAll = ops.every((o) => o !== null)
  const resAll = res.every((r) => r !== null)
  const canCheck = placedAll && opsAll && resAll

  // The screens: the bar first (with the drawing), then one per step of the calculation.
  const screens: ('place' | number)[] = [...(ex.withBar ? ['place' as const] : []), ...ex.steps.map((_, k) => k)]
  // A try again opens on the first screen with something to fix: the bar, or the first wrong step.
  const [screen, setScreen] = useState(() => {
    if (!before || marks.slots.size) return 0
    const k = Math.min(...marks.steps)
    return Number.isFinite(k) ? Math.max(0, screens.indexOf(k)) : 0
  })
  const current = screens[screen]
  const last = screen === screens.length - 1
  const screenDone = current === 'place' ? placedAll : ops[current] !== null && res[current] !== null
  const next = () => { if (screenDone && !last) setScreen((n) => n + 1) }
  const back = () => { if (screen > 0) setScreen((n) => n - 1) }

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

  const status = flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle'
  /** Before checking again, a piece or a result the child had wrong stays soft red until she changes it. */
  const slotMarked = (i: number) => !flow.result && marks.slots.has(i) && before !== undefined && at[i] === atFromPlaced(ex, before.placed)[i]
  const stepStatus = (k: number) => (!flow.result && marks.steps.has(k) && res[k] === (before?.results[k] ?? null) ? 'wrong' as const : status)
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
        <div key={i} className={clsx(s.total, target && s.targetTotal, filled && s.filled, slotMarked(i) && RETRY_WRONG_CLASS)}
          data-slot={target ? i : undefined} role={target ? 'button' : undefined} aria-label={label}
          onClick={() => onSlotTap(i)}>
          <span className={s.totalName}>{b.name}</span>
          <strong className={s.totalValue}>{shownValue || '…'}</strong>
        </div>
      )
    }
    if (b.kind === 'count') {
      return (
        <div key={i} className={clsx(s.count, target && s.targetCount, filled && s.filled, slotMarked(i) && RETRY_WRONG_CLASS)}
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
        className={clsx(s.seg, !known && s.segUnknown, target && s.target, filled && s.filled, slotMarked(i) && RETRY_WRONG_CLASS)}
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

  const firstFree = chipsFree[0]
  const guideText = (n: number, k: number | 'place', part: 'op' | 'result'): string => {
    if (k === 'place') {
      return firstFree
        ? `${n}. Pon cada número en su sitio. ¿Dónde va el ${firstFree.value}? Tócalo y luego toca su parte de la barra.`
        : `${n}. ¡Todos en su sitio! Toca «Seguir».`
    }
    const stepWord = steps > 1 ? (k === 0 ? 'Primero: ' : 'Después: ') : ''
    return part === 'op'
      ? `${n}. ${stepWord}¿Qué hacemos con los números: juntar, quitar, repetir o repartir?`
      : `${n + 1}. Haz la cuenta y escribe el resultado.`
  }
  const base = ex.withBar ? 2 : 1

  const barDrawing = (interactive: boolean) => (
    <section className={clsx(s.barCard, !interactive && s.barStill)} aria-label="Barra">
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
      {interactive && (
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
      )}
    </section>
  )

  return (
    <ExerciseLayout
      workClassName={clsx(s.view, compact && s.compact)}
      aria-label="Problema con barras"
      data-screen={String(current)}
      prompt={text}
      actions={(
        <>
          {screens.length > 1 && (
            <div className={s.nav}>
              {screen > 0 && <Button size="md" variant="secondary" onClick={back}>← Atrás</Button>}
              {!last && <Button size="lg" variant="primary" onClick={next} disabled={!screenDone}>Seguir →</Button>}
              <span className={s.navCount} aria-label={`Pantalla ${screen + 1} de ${screens.length}`}>{screen + 1} / {screens.length}</span>
            </div>
          )}
          {/* One «Comprobar», on the last screen; before it only the hint (selfChecking hides the check). */}
          <AnswerBar flow={flow} onCheck={() => submit()} canCheck={canCheck} selfChecking={!last} />
        </>
      )}
    >
      {current === 'place' && (
        <>
          <p className={s.guideStep} data-guide="">{host.t(guideText(1, 'place', 'op'))}</p>
          {barDrawing(true)}
        </>
      )}

      {typeof current === 'number' && (() => {
        const k = current
        return (
          <div className={s.step} role="group" aria-label={steps > 1 ? `Paso ${k + 1}` : '¿Qué operación?'}>
            {ex.withBar && barDrawing(false)}
            <p className={s.guideStep} data-guide="">{host.t(guideText(base + k * 2, k, 'op'))}</p>
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
            {ops[k] !== null && (
              <>
                <p className={s.guideStep} data-guide="">{host.t(guideText(base + k * 2, k, 'result'))}</p>
                <div className={s.answer}>
                  <span className={s.answerLabel}>{k < steps - 1 ? host.t(k === 0 ? 'Primero:' : 'Después:') : host.t('Respuesta:')}</span>
                  <NumberInput
                    value={res[k]}
                    onChange={(v) => setResult(k, v)}
                    onSubmit={(v) => {
                      const nextRes = res.map((r, i) => (i === k ? v : r))
                      setResult(k, v)
                      if (!last) { if (ops[k] !== null && v !== null) setScreen((n) => n + 1); return }
                      if (ops.every((o) => o !== null) && nextRes.every((r) => r !== null) && placedAll) submit(ops, nextRes)
                    }}
                    maxDigits={4}
                    size="lg"
                    status={stepStatus(k)}
                    ariaLabel={steps > 1 && k < steps - 1 ? `Resultado del paso ${k + 1}` : 'Respuesta'}
                    placeholder="?"
                    checkButton={false}
                    autoFocus
                  />
                  <span className={s.unit}>{k === steps - 1 ? ex.unit : ''}</span>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {!compact && guided && <p className={s.guide}>{host.t('Primero piensa qué pasa en la historia, luego dibuja.')}</p>}
    </ExerciseLayout>
  )
}
