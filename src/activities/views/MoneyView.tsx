/* Dinero (money:*): recognise a coin or note, pay an exact price by tapping or dragging pieces into a tray, give the
   change, add prices, compare them, convert euros and céntimos, and the budget (¿te llega?, ¿cuánto te falta o te sobra?,
   ¿qué compra cabe?). The tray never shows a total: the child counts.
   Amounts with céntimos are typed in two boxes (euros and céntimos); a whole number of céntimos in one box. */
import clsx from 'clsx'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { NumberInput } from '@/ink'
import { celebrate } from '@/fx'
import { euros, pieceName } from '@/engine'
import { useActivityHost } from '@/activities/host'
import type {
  Answer, ExerciseViewProps, MoneyAddExercise, MoneyChangeExercise, MoneyCompareExercise, MoneyConvertExercise,
  MoneyBudgetExercise, MoneyItem, MoneyPayExercise, MoneyRecogniseExercise,
} from '@/types'
import { AnswerBar } from '../groups/AnswerBar'
import type { AnswerFlow } from '../groups/flow'
import { initialOf, RETRY_WRONG_CLASS, useRetryChoice, useRetryFlow, useRetryNumber, useRetryWrong, type RetryProps } from '@/activities/lesson/TrySlotRetry'
import { MoneyPiece } from './MoneyPiece'
import s from './NumericViews.module.css'
import m from './MoneyViews.module.css'
import { ExerciseLayout } from './ExerciseLayout'

/** The pieces in the purse: the coins and the notes up to 50 €. */
const PURSE = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]
/** Whole euros (2.º): the euro coins and the notes up to 20 €. */
const PURSE_WHOLE = [100, 200, 500, 1000, 2000]

type MoneyEx = MoneyRecogniseExercise | MoneyPayExercise | MoneyChangeExercise | MoneyAddExercise | MoneyCompareExercise | MoneyConvertExercise
  | MoneyBudgetExercise

export default function MoneyView(props: ExerciseViewProps) {
  const { exercise, onAnswered, showFeedback = true, allowHints = true } = props
  if (exercise.kind !== 'money') return null
  return (
    <MoneyRound key={exercise.id} ex={exercise} onAnswered={onAnswered} showFeedback={showFeedback} allowHints={allowHints} retry={props} />
  )
}

/** «Inténtalo otra vez»: what the child gave on the last try, for the screen of each mode (see TrySlotRetry.ts). */
const RetryContext = createContext<RetryProps | undefined>(undefined)

function MoneyRound({ ex, onAnswered, showFeedback, allowHints, retry }: { ex: MoneyEx; retry?: RetryProps } & Pick<ExerciseViewProps, 'onAnswered' | 'showFeedback' | 'allowHints'>) {
  const flow = useRetryFlow(ex, { onAnswered, showFeedback: showFeedback ?? true, allowHints: allowHints ?? true })
  const status = statusOf(flow)
  return (
    <RetryContext.Provider value={retry}>
    <section className="ex-shell" aria-label="Dinero" data-kind="money" data-mode={ex.mode} data-status={status}>
      {(() => {
        switch (ex.mode) {
          case 'recognise': return <Recognise ex={ex} flow={flow} />
          case 'pay': return <Pay ex={ex} flow={flow} />
          case 'change': return <Change ex={ex} flow={flow} />
          case 'add': return <Add ex={ex} flow={flow} />
          case 'compare': return <Compare ex={ex} flow={flow} />
          case 'convert': return ex.direction === 'to-cents' ? <ConvertToCents ex={ex} flow={flow} /> : <ConvertToEuros ex={ex} flow={flow} />
          case 'budget': return <Budget ex={ex} flow={flow} />
        }
      })()}
    </section>
    </RetryContext.Provider>
  )
}

/** The option the child tapped on the last try (a value, a name, «Sí» or «No»), and whether it is soft red now. */
function useOptionAgain(expected: string) {
  return useRetryChoice<string>(useContext(RetryContext), (a) => (a.type === 'option' ? a.value : null), expected)
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
  const again = useOptionAgain(String(ex.answer))
  const [picked, setPicked] = useState<number | null>(again.first !== null && again.first !== '' ? Number(again.first) : null)
  const locked = !!flow.result?.correct
  return (
    <ExerciseLayout
      workClassName={s.view}
      prompt="¿Cuánto vale esta moneda o este billete?"
      actions={(
        <AnswerBar
          flow={flow}
          onCheck={() => { if (picked !== null) submitWith(flow, { type: 'option', value: String(picked) }) }}
          canCheck={picked !== null}
        />
      )}
    >
      <div className={m.stage}>
        <MoneyPiece value={ex.piece} size="lg" label />
      </div>
      <div className={m.choices} role="group" aria-label="Valor">
        {ex.options.map((v) => (
          <button
            key={v}
            type="button"
            className={clsx(m.choice, picked === v && m.choiceOn, again.marked(String(v), picked === null ? null : String(picked), !!flow.result) && RETRY_WRONG_CLASS)}
            aria-pressed={picked === v}
            onClick={() => { if (!locked) setPicked(v) }}
          >
            {pieceName(v)}
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- pay (tap or drag into the tray)

function Pay({ ex, flow }: { ex: MoneyPayExercise; flow: AnswerFlow }) {
  // A try again starts with the coins and notes the child put in the tray; the tray is soft red until she changes it.
  const retry = useContext(RetryContext)
  const [before] = useState(() => initialOf(retry, 'pieces')?.pieces ?? null)
  const wrongBefore = useRetryWrong(retry, () => (before && before.reduce((a, b) => a + b, 0) !== ex.price ? [0] : []))
  const [tray, setTray] = useState<number[]>(() => before?.slice() ?? [])
  const trayMarked = !flow.result && wrongBefore.has(0) && before !== null && tray.length === before.length && tray.every((v, i) => v === before[i])
  const [dragging, setDragging] = useState<number | null>(null)
  const [ghost, setGhost] = useState<{ x: number; y: number; value: number } | null>(null)
  const drag = useRef<{ value: number; x: number; y: number; moved: boolean } | null>(null)
  const justDragged = useRef<{ value: number; at: number } | null>(null)
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
      // Swallow only the click that may follow this drag at once (a browser may send it to the coin): after a real drag
      // it often never comes, and a mark left up would eat the next tap.
      justDragged.current = { value: d.value, at: Date.now() }
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
    const dragged = justDragged.current
    justDragged.current = null
    // The click a browser may send to the coin just dragged (the same coin, at once) is not a second tap.
    if (dragged && dragged.value === value && Date.now() - dragged.at < 400) return
    if (!locked) setTray((t) => [...t, value])
  }

  return (
    <ExerciseLayout
      workClassName={s.view}
      prompt="Paga justo."
      sub="Toca las monedas y billetes o arrástralos a la bandeja."
      actions={(
        <AnswerBar
          flow={flow}
          onCheck={() => { if (tray.length > 0) submitWith(flow, { type: 'pieces', pieces: tray }) }}
          canCheck={tray.length > 0}
        />
      )}
    >
      <div className={m.price} aria-label={`Precio: ${euros(ex.price)}`}>
        <span className={m.priceLabel}>Precio</span>
        <span className={m.priceValue}>{euros(ex.price)}</span>
      </div>
      <div className={clsx(m.tray, tray.length === 0 && m.trayEmpty, trayMarked && RETRY_WRONG_CLASS)} data-tray aria-label="Bandeja" role="group">
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
      <div className={clsx(m.purse, ex.whole && m.purseFew)} role="group" aria-label="Monedas y billetes">
        {(ex.whole ? PURSE_WHOLE : PURSE).map((v) => (
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
      {/* Portal: a shrunk ancestor (FitToScreen, transform: scale) would make position: fixed relative to it. */}
      {ghost && createPortal(
        <div className={m.ghost} style={{ transform: `translate(${ghost.x - 36}px, ${ghost.y - 36}px)` }} aria-hidden>
          <MoneyPiece value={ghost.value} size="sm" />
        </div>,
        document.body,
      )}
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- change (a story)

function Change({ ex, flow }: { ex: MoneyChangeExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  // One question only: the story's own («¿Cuánto le devuelven?»), never a second one in other words (P3PE-15).
  const amount = useAmountAnswer(flow, false, ex.answer)
  return (
    <ExerciseLayout workClassName={s.view} prompt={text} actions={amount.bar}>
      <div className={m.story}>
        <div className={m.storyNote}><MoneyPiece value={ex.paid} size="md" /></div>
      </div>
      {amount.fields}
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- add (cards or a story)

function Add({ ex, flow }: { ex: MoneyAddExercise; flow: AnswerFlow }) {
  const host = useActivityHost()
  const text = useMemo(() => host.t(ex.text), [host, ex.text])
  // The statement already asks the question: no second one under it.
  const amount = useAmountAnswer(flow, ex.whole, ex.answer)
  return (
    <ExerciseLayout workClassName={s.view} prompt={text} actions={amount.bar}>
      {!ex.story && <PriceCards items={ex.items} />}
      {amount.fields}
    </ExerciseLayout>
  )
}

function PriceCards({ items }: { items: MoneyItem[] }) {
  return (
    <div className={m.cards} role="list" aria-label="Precios">
      {items.map((it) => (
        <div key={it.name} className={clsx(m.card, m.cardStatic)} role="listitem">
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
  const again = useOptionAgain(ex.answer)
  const [picked, setPicked] = useState<string | null>(again.first)
  const locked = !!flow.result?.correct
  return (
    <ExerciseLayout
      workClassName={s.view}
      prompt={ex.question === 'more' ? '¿Qué cuesta más? Tócalo.' : '¿Qué cuesta menos? Tócalo.'}
      actions={(
        <AnswerBar
          flow={flow}
          onCheck={() => { if (picked !== null) submitWith(flow, { type: 'option', value: picked }) }}
          canCheck={picked !== null}
        />
      )}
    >
      <div className={m.cards} role="group" aria-label="Elige">
        {ex.items.map((it) => (
          <button
            key={it.name}
            type="button"
            className={clsx(m.card, m.cardButton, picked === it.name && m.cardOn, again.marked(it.name, picked, !!flow.result) && RETRY_WRONG_CLASS)}
            aria-pressed={picked === it.name}
            onClick={() => { if (!locked) setPicked(it.name) }}
          >
            <span className={m.cardEmoji} aria-hidden>{it.emoji}</span>
            <span className={m.cardName}>{it.name}</span>
            <span className={m.tag}>{euros(it.price)}</span>
          </button>
        ))}
      </div>
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- convert

function ConvertToCents({ ex, flow }: { ex: MoneyConvertExercise; flow: AnswerFlow }) {
  const again = useRetryNumber(useContext(RetryContext), typeof ex.answer === 'number' ? ex.answer : null)
  const [value, setValue] = useState<number | null>(again.first)
  const submit = (v: number | null) => { if (v !== null) submitWith(flow, { type: 'number', value: v }) }
  return (
    <ExerciseLayout workClassName={s.view} prompt={'Un euro tiene cien céntimos. Escribe cuántos céntimos son.'} actions={<AnswerBar flow={flow} onCheck={() => submit(value)} canCheck={value !== null} />}>
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
          status={again.marked(value, !!flow.result) ? 'wrong' : statusOf(flow)}
          ariaLabel="Céntimos"
          placeholder="?"
          autoFocus
        />
      </div>
    </ExerciseLayout>
  )
}

function ConvertToEuros({ ex, flow }: { ex: MoneyConvertExercise; flow: AnswerFlow }) {
  const amount = useAmountAnswer(flow, false, Array.isArray(ex.answer) ? (ex.answer[0] ?? 0) * 100 + (ex.answer[1] ?? 0) : ex.amount)
  return (
    <ExerciseLayout workClassName={s.view} prompt="¿Cuántos euros y céntimos son?" sub="Cada cien céntimos son un euro." actions={amount.bar}>
      <div className={m.stage}>
        <span className={m.bigAmount}>{ex.amount} céntimos</span>
        <span className={m.equals}>son</span>
      </div>
      {amount.fields}
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- budget (¿te llega?, ¿cuánto te falta o te sobra?, ¿qué compra cabe?)

function Budget({ ex, flow }: { ex: MoneyBudgetExercise; flow: AnswerFlow }) {
  const again = useOptionAgain(String(ex.answer))
  const [picked, setPicked] = useState<string | null>(again.first)
  const locked = !!flow.result?.correct
  const ask = ex.ask
  const amount = useAmountAnswer(flow, false, typeof ex.answer === 'number' ? ex.answer : null)
  const choose = ask === 'enough' || ask === 'afford'
  return (
    <ExerciseLayout
      workClassName={s.view}
      prompt={<>{ex.text}<br /><span>{ex.question}</span></>}
      actions={choose
        ? (
          <AnswerBar
            flow={flow}
            onCheck={() => { if (picked !== null) submitWith(flow, { type: 'option', value: picked }) }}
            canCheck={picked !== null}
          />
        )
        : amount.bar}
    >
      <div className={m.stage}>
        <span className={m.bigAmount}>{euros(ex.budget)}</span>
      </div>
      {ask === 'afford' ? (
        <div className={m.cards} role="group" aria-label="Elige">
          {ex.items.map((it) => (
            <button
              key={it.name}
              type="button"
              className={clsx(m.card, m.cardButton, picked === it.name && m.cardOn, again.marked(it.name, picked, !!flow.result) && RETRY_WRONG_CLASS)}
              aria-pressed={picked === it.name}
              onClick={() => { if (!locked) setPicked(it.name) }}
            >
              <span className={m.cardEmoji} aria-hidden>{it.emoji}</span>
              <span className={m.cardName}>{it.name}</span>
              <span className={m.tag}>{euros(it.price)}</span>
            </button>
          ))}
        </div>
      ) : (
        <PriceCards items={ex.items} />
      )}
      {choose ? (
        <>
          {ask === 'enough' && (
            <div className={m.choices} role="group" aria-label="Respuesta">
              {['Sí', 'No'].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={clsx(m.choice, picked === v && m.choiceOn, again.marked(v, picked, !!flow.result) && RETRY_WRONG_CLASS)}
                  aria-pressed={picked === v}
                  onClick={() => { if (!locked) setPicked(v) }}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        amount.fields
      )}
    </ExerciseLayout>
  )
}

// ---------------------------------------------------------------- the euros and céntimos boxes

interface Amount { e: number | null; c: number | null }
/** An amount can be checked once either box is written: an empty box is 0 (2 € is «2» and nothing in the céntimos,
    50 céntimos is nothing in the euros and «50»), as the child writes it on paper (P3PE-15). With `whole` (only the
    euros box is shown) the euros must be written: nothing typed is never checked as a wrong «0 €» (P1, P2). */
export const amountReady = (a: Amount, whole = false) => (whole ? a.e !== null : a.e !== null || a.c !== null)
/** The amount sent to the check: an empty box counts as 0. */
export const amountValues = (a: Amount): [number, number] => [a.e ?? 0, a.c ?? 0]

/** Two writing pads (euros, a decimal comma, céntimos) and the answer bar, for the view's own layout (the boxes in the
    work, the bar beside the statement). `whole`: only the euros. `expected`: the right amount in céntimos, to mark the
    box the child had wrong on a try again (it starts with what she wrote). */
function useAmountAnswer(flow: AnswerFlow, whole = false, expected: number | null = null): { fields: ReactNode; bar: ReactNode } {
  const retry = useContext(RetryContext)
  const [before] = useState(() => initialOf(retry, 'numbers')?.values ?? null)
  const wrongBefore = useRetryWrong(retry, () => {
    if (!before || expected === null) return []
    const want = [Math.floor(expected / 100), expected % 100]
    return [0, 1].filter((i) => (i === 0 || !whole) && (before[i] ?? 0) !== want[i])
  })
  const [amount, setAmount] = useState<Amount>({ e: before?.[0] ?? null, c: whole ? null : before?.[1] ?? null })
  const boxStatus = (i: 0 | 1, now: number | null) =>
    !flow.result && wrongBefore.has(i) && now === (before?.[i] ?? null) ? 'wrong' as const : statusOf(flow)
  const check = (a: Amount) => {
    if (amountReady(a, whole)) submitWith(flow, { type: 'numbers', values: amountValues(a) })
  }
  const bar = <AnswerBar flow={flow} onCheck={() => check(amount)} canCheck={amountReady(amount, whole)} />
  if (whole) {
    return {
      bar,
      fields: (
        <div className={m.amountWrap}>
          <div className={m.amountRow}>
            <div className={m.amountCol}>
              <NumberInput
                value={amount.e}
                onChange={(e) => setAmount((a) => ({ ...a, e }))}
                onSubmit={(e) => { const next = { ...amount, e }; setAmount(next); if (!flow.submitted) check(next) }}
                maxDigits={2}
                size="lg"
                status={boxStatus(0, amount.e)}
                ariaLabel="Euros"
                placeholder="€"
                autoFocus
              />
              <span className={m.unit}>euros</span>
            </div>
          </div>
        </div>
      ),
    }
  }
  return {
    bar,
    fields: (
      <div className={m.amountWrap}>
        <div className={m.amountRow} role="group" aria-label="Cantidad en euros y céntimos">
          {/* The comma stays with the euros when a phone puts the céntimos on the next line. */}
          <div className={m.amountLead}>
            <div className={m.amountCol}>
              <NumberInput
                value={amount.e}
                onChange={(e) => setAmount((a) => ({ ...a, e }))}
                onSubmit={(e) => { const next = { ...amount, e }; setAmount(next); if (!flow.submitted) check(next) }}
                maxDigits={2}
                size="lg"
                status={boxStatus(0, amount.e)}
                ariaLabel="Euros"
                checkButton={false}
                placeholder="€"
                autoFocus
              />
              <span className={m.unit}>euros</span>
            </div>
            <span className={m.comma} aria-hidden>,</span>
          </div>
          <div className={m.amountCol}>
            <NumberInput
              value={amount.c}
              onChange={(c) => setAmount((a) => ({ ...a, c }))}
              onSubmit={(c) => { const next = { ...amount, c }; setAmount(next); if (!flow.submitted) check(next) }}
              maxDigits={2}
              size="lg"
              status={boxStatus(1, amount.c)}
              ariaLabel="Céntimos"
              checkButton={false}
              placeholder="00"
            />
            <span className={m.unit}>céntimos</span>
          </div>
        </div>
      </div>
    ),
  }
}
