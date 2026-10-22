/* Dinero (money:*): recognise a coin or note, pay an exact price by tapping or dragging pieces into a tray, give the
   change, add prices, compare them, and convert euros and céntimos. The tray never shows a total: the child counts.
   Amounts with céntimos are typed in two boxes (euros and céntimos); a whole number of céntimos in one box. */
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { euros, pieceName } from '@/engine'
import { useActivityHost } from '@/activities/host'
import type {
  Answer, ExerciseViewProps, MoneyAddExercise, MoneyChangeExercise, MoneyCompareExercise, MoneyConvertExercise,
  MoneyItem, MoneyPayExercise, MoneyRecogniseExercise,
} from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import { useAnswerFlow, type AnswerFlow } from '../groups/flow'
import { MoneyPiece } from './MoneyPiece'
import s from './NumericViews.module.css'
import m from './MoneyViews.module.css'

/** The pieces in the purse: the coins and the notes up to 50 €. */
const PURSE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]

type MoneyEx = MoneyRecogniseExercise | MoneyPayExercise | MoneyChangeExercise | MoneyAddExercise | MoneyCompareExercise | MoneyConvertExercise

export default function MoneyView({ exercise, onAnswered, showFeedback = true, allowHints = true }: ExerciseViewProps) {
  if (exercise.kind !== 'money') return null
  return (
    <MoneyRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} />
  )
}

function MoneyRound({ ex, onAnswered, showFeedback, allowHints }: { ex: MoneyEx } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useAnswerFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = statusOf(flow)
  return (
    <section className={s.view} aria-label="Dinero" data-kind="money" data-mode={ex.mode} data-status={status}>
      {(() => {
        switch (ex.mode) {
          case 'recognise': return <Recognise ex={ex} flow={flow} />
          case 'pay': return <Pay ex={ex} flow={flow} />
          case 'change': return <Change ex={ex} flow={flow} />
          case 'add': return <Add ex={ex} flow={flow} />
          case 'compare': return <Compare ex={ex} flow={flow} />
          case 'convert': return ex.direction === 'to-cents' ? <ConvertToCents ex={ex} flow={flow} /> : <ConvertToEuros ex={ex} flow={flow} />
        }
      })()}
    </section>
  )
}

/** Submits through the flow; a correct check is celebrated. */
function submitWith(flow: AnswerFlow, answer: Answer) {
  const c = flow.submit(answer)
  if (c.correct) celebrate('small')
  return c
}

const statusOf = (flow: AnswerFlow): 'idle' | 'correct' | 'wrong' => (flow.result ? (flow.result.correct ? 'correct' : 'wrong') : 'idle')

// ---------------------------------------------------------------- recognise

function Recognise({ ex, flow }: { ex: MoneyRecogniseExercise; flow: AnswerFlow }) {
  const [picked, setPicked] = useState<number | null>(null)
  const locked = !!flow.result?.correct
  return (
    <>
      <p className={s.instructions}>¿Cuánto vale esta moneda o este billete?</p>
      <div className={m.stage}>
        <MoneyPiece value={ex.piece} size="lg" label />
      </div>
      <div className={m.choices} role="group" aria-label="Valor">
        {ex.options.map((v) => (
          <button
            key={v}
            type="button"
            className={clsx(m.choice, picked === v && m.choiceOn)}
            aria-pressed={picked === v}
            onClick={() => { if (!locked) setPicked(v) }}
          >
            {pieceName(v)}
          </button>
        ))}
      </div>
      <AnswerBar
        flow={flow}
        onCheck={() => { if (picked !== null) submitWith(flow, { type: 'option', value: String(picked) }) }}
        canCheck={picked !== null}
      />
    </>
  )
}

// ---------------------------------------------------------------- pay (tap or drag into the tray)

function Pay({ ex, flow }: { ex: MoneyPayExercise; flow: AnswerFlow }) {
  const [tray, setTray] = useState<number[]>([])
  const [dragging, setDragging] = useState<number | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number; value: number } | null>(null)
  const drag = useRef<{ value: number; x: number; y: number; moved: boolean } | null>(null)
  const justDragged = useRef(false)
  const locked = !!flow.result?.correct

  const removeAt = (i: number) => {
    if (!locked) setTray((t) => t.filter((_, k) => k !== i))
  }

  // Drag from the purse into the tray. Pointer events: the same path for Pencil, finger and mouse.
  const onPurseDown = (e: ReactPointerEvent, value: number) => {
    if (!locked) drag.current = { value, x: e.clientX, y: e.clientY, moved: false }
  }
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
        d.moved = true
        setDragging(d.value)
      }
      if (d.moved) setGhost({ x: e.clientX, y: e.clientY, value: d.value })
    }
    const up = (e: PointerEvent) => {
      const d = drag.current
      drag.current = null
      setDragging(null)
      setGhost(null)
      if (!d || !d.moved) return
      justDragged.current = true
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el?.closest?.('[data-tray]')) setTray((t) => [...t, d.value])
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  const onPurseClick = (value: number) => {
    if (justDragged.current) { justDragged.current = false; return }
    if (!locked) setTray((t) => [...t, value])
  }

  return (
    <>
      <p className={s.instructions}>Paga justo. Toca las monedas y billetes o arrástralos a la bandeja.</p>
      <div className={m.price} aria-label={`Precio: ${euros(ex.price)}`}>
        <span className={m.priceLabel}>Precio</span>
        <span className={m.priceValue}>{euros(ex.price)}</span>
      </div>
      <div className={clsx(m.tray, tray.length === 0 && m.trayEmpty)} data-tray aria-label="Bandeja" role="group">
        {tray.length === 0 && <span className={m.trayHint}>Aquí van las monedas y los billetes que pagas</span>}
        {tray.map((v, i) => (
          <button
            key={`${v}-${i}`}
            type="button"
            className={m.trayPiece}
            onClick={() => removeAt(i)}
            aria-label={`Quitar ${pieceName(v)}`}
            disabled={locked}
          >
            <MoneyPiece value={v} size="sm" />
          </button>
        ))}
      </div>
      <div className={m.trayActions}>
        <button type="button" className={m.undo} onClick={() => removeAt(tray.length - 1)} disabled={tray.length === 0 || locked}>
          ↶ Quitar
        </button>
      </div>
      <div className={m.purse} role="group" aria-label="Monedas y billetes">
        {PURSE.map((v) => (
          <button
            key={v}
            type="button"
            className={clsx(m.purseBtn, dragging === v && m.purseDrag)}
            onPointerDown={(e) => onPurseDown(e, v)}
            onClick={() => onPurseClick(v)}
            aria-label={`Añadir ${pieceName(v)}`}
          >
            <MoneyPiece value={v} size="md" />
          </button>
        ))}
      </div>
      {ghost && (
        <div className={m.ghost} style={{ transform: `translate(${ghost.x - 36}px, ${ghost.y - 36}px)` }} aria-hidden>
          <MoneyPiece value={ghost.value} size="sm" />
        </div>
      )}
      <AnswerBar
        flow={flow}
        onCheck={() => { if (tray.length > 0) submitWith(flow, { type: 'pieces', pieces: tray }) }}
        canCheck={tray.length > 0}
      />
    </>
  )
}

// ---------------------------------------------------------------- change (a story)

function Change({ ex, flow }: { ex: MoneyChangeExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  return (
    <>
      <div className={m.story}>
        <div className={m.storyNote}><MoneyPiece value={ex.paid} size="md" /></div>
        <p className={m.storyText}>{text}</p>
      </div>
      <AmountAnswer flow={flow} ask="¿Cuánto cambio te dan?" />
    </>
  )
}

// ---------------------------------------------------------------- add (cards or a story)

function Add({ ex, flow }: { ex: MoneyAddExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  return (
    <>
      {ex.story ? (
        <p className={m.storyText}>{text}</p>
      ) : (
        <>
          <p className={s.instructions}>{text}</p>
          <PriceCards items={ex.items} />
        </>
      )}
      <AmountAnswer flow={flow} ask="¿Cuánto cuestan todos?" />
    </>
  )
}

function PriceCards({ items }: { items: MoneyItem[] }) {
  return (
    <div className={m.cards} role="list" aria-label="Precios">
      {items.map((it) => (
        <div key={it.name} className={m.card} role="listitem">
          <span className={m.cardEmoji} aria-hidden>{it.emoji}</span>
          <span className={m.cardName}>{it.name}</span>
          <span className={m.tag}>{euros(it.price)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- compare

function Compare({ ex, flow }: { ex: MoneyCompareExercise; flow: AnswerFlow }) {
  const [picked, setPicked] = useState<string | null>(null)
  const locked = !!flow.result?.correct
  return (
    <>
      <p className={s.instructions}>{ex.question === 'more' ? '¿Qué cuesta más?' : '¿Qué cuesta menos?'}</p>
      <div className={m.cards} role="group" aria-label="Elige">
        {ex.items.map((it) => (
          <button
            key={it.name}
            type="button"
            className={clsx(m.card, m.cardButton, picked === it.name && m.cardOn)}
            aria-pressed={picked === it.name}
            onClick={() => { if (!locked) setPicked(it.name) }}
          >
            <span className={m.cardEmoji} aria-hidden>{it.emoji}</span>
            <span className={m.cardName}>{it.name}</span>
            <span className={m.tag}>{euros(it.price)}</span>
          </button>
        ))}
      </div>
      <AnswerBar
        flow={flow}
        onCheck={() => { if (picked !== null) submitWith(flow, { type: 'option', value: picked }) }}
        canCheck={picked !== null}
      />
    </>
  )
}

// ---------------------------------------------------------------- convert

function ConvertToCents({ ex, flow }: { ex: MoneyConvertExercise; flow: AnswerFlow }) {
  const [value, setValue] = useState<number | null>(null)
  const submit = (v: number | null) => { if (v !== null) submitWith(flow, { type: 'number', value: v }) }
  return (
    <>
      <p className={s.instructions}>Un euro tiene cien céntimos. Escribe cuántos céntimos son.</p>
      <div className={m.stage}>
        <span className={m.bigAmount}>{euros(ex.amount)}</span>
        <span className={m.equals}>son</span>
      </div>
      <div className={m.row}>
        <span className={m.unit}>céntimos:</span>
        <NumberInput
          value={value}
          onChange={setValue}
          onSubmit={(v) => { setValue(v); if (!flow.submitted) submit(v) }}
          maxDigits={4}
          size="lg"
          status={statusOf(flow)}
          ariaLabel="Céntimos"
          placeholder="?"
          autoFocus
        />
      </div>
      <AnswerBar flow={flow} onCheck={() => submit(value)} canCheck={value !== null} />
    </>
  )
}

function ConvertToEuros({ ex, flow }: { ex: MoneyConvertExercise; flow: AnswerFlow }) {
  return (
    <>
      <p className={s.instructions}>Cada cien céntimos son un euro. ¿Cuántos euros y céntimos son?</p>
      <div className={m.stage}>
        <span className={m.bigAmount}>{ex.amount} céntimos</span>
        <span className={m.equals}>son</span>
      </div>
      <AmountAnswer flow={flow} ask="" />
    </>
  )
}

// ---------------------------------------------------------------- the euros and céntimos boxes

interface Amount { e: number | null; c: number | null }
const amountReady = (a: Amount) => a.e !== null && a.c !== null

/** Two writing pads (euros, a decimal comma, céntimos) and the check. Both boxes are needed. */
function AmountAnswer({ flow, ask }: { flow: AnswerFlow; ask: string }) {
  const [amount, setAmount] = useState<Amount>({ e: null, c: null })
  const check = (a: Amount) => {
    if (amountReady(a)) submitWith(flow, { type: 'numbers', values: [a.e, a.c] })
  }
  const status = statusOf(flow)
  return (
    <>
      <div className={m.amountWrap}>
        {ask && <p className={m.ask}>{ask}</p>}
        <div className={m.row} role="group" aria-label="Cantidad en euros y céntimos">
          <div className={m.amountCol}>
            <NumberInput
              value={amount.e}
              onChange={(e) => setAmount((a) => ({ ...a, e }))}
              onSubmit={(e) => { const next = { ...amount, e }; setAmount(next); if (!flow.submitted) check(next) }}
              maxDigits={2}
              size="lg"
              status={status}
              ariaLabel="Euros"
              placeholder="€"
              autoFocus
            />
            <span className={m.unit}>euros</span>
          </div>
          <span className={m.comma} aria-hidden>,</span>
          <div className={m.amountCol}>
            <NumberInput
              value={amount.c}
              onChange={(c) => setAmount((a) => ({ ...a, c }))}
              onSubmit={(c) => { const next = { ...amount, c }; setAmount(next); if (!flow.submitted) check(next) }}
              maxDigits={2}
              size="lg"
              status={status}
              ariaLabel="Céntimos"
              placeholder="00"
            />
            <span className={m.unit}>céntimos</span>
          </div>
        </div>
      </div>
      <AnswerBar flow={flow} onCheck={() => check(amount)} canCheck={amountReady(amount)} />
    </>
  )
}
