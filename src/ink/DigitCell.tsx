/* <DigitCell> — one handwritten digit (column operations, carries, short answers).
   Pen/finger ink → recognition after a short pause → typeset digit over the faded ink.
   Low confidence → subtle "?" and alternative chips on tap (a pick is a recognition fix + 'corrected' sample).
   Clear: pen eraser, scribble-out, or the small clear button. A tap on a recognised cell only opens the alternatives.
   Keyboard: digits, Backspace, arrows/Tab (with CellGroup), Enter submits the group. */
import clsx from 'clsx'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import type { DigitCellProps, DigitRecognition, InkStroke } from '@/types'
import { sfx } from '@/audio'
import { CONTINUE_MAX_HEIGHT, CONTINUE_MS, IDLE_MS, PEN_IDLE_FALLBACK_MS, UNMOUNT_FORGET_MS } from './constants'
import { isDoubtfulRead } from './confusable'
import { useInk } from './context'
import { useCellGroup } from './groupContext'
import { isScribble, segmentStrokes, strokeBBox } from './geometry'
import { msSincePenContact, pointerRole } from './policy'
import { useInkSurface } from './useInkSurface'
import { usePalmGuard } from './usePalmGuard'
import { AltPopover } from './AltPopover'
import { ALL_DIGITS, alternativeDigits } from './alternatives'
import { EraserIcon } from './icons'
import { NudgeBubble } from './Nudge'
import s from './DigitCell.module.css'

export type CellPhase = 'empty' | 'writing' | 'pending' | 'recognized' | 'unsure' | 'unknown' | 'typed'
export type InkVia = 'pen' | 'touch' | 'keyboard' | 'keypad'

/** What DigitCell passes as the second onChange argument (recognitionFix is set when the child picked an alternative). */
export interface InkChangeInfo { confidence: number; via: InkVia; recognitionFix?: boolean }

export interface DigitCellExtraProps {
  /** Id used by CellGroup's explicit `order` array. */
  cellId?: string
  /** Show the small clear button on the focused, filled cell (default true for result cells). */
  showClear?: boolean
  /**
   * The cells of one number share a `numberId` (left to right in the page). In a CellGroup with typingOrder 'ltr'
   * a typed digit goes in like on a calculator: it enters at the units and pushes the others to the left.
   */
  numberId?: string
  className?: string
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

// ------------------------------------------------------------------------------------------ visual

export interface CellVisualProps {
  variant: NonNullable<DigitCellProps['variant']>
  place: DigitCellProps['place']
  status: NonNullable<DigitCellProps['status']>
  size: NonNullable<DigitCellProps['size']>
  big: boolean
  phase: CellPhase
  digit: number | null
  unsure: boolean
  current?: boolean
  disabled?: boolean
  surfaceRef?: RefObject<HTMLDivElement | null>
  canvasRef?: RefObject<HTMLCanvasElement | null>
  surfaceProps?: HTMLAttributes<HTMLDivElement> & { tabIndex?: number; 'data-ink-key'?: string }
  after?: ReactNode
  className?: string
}

/** Two digits written in one cell («12»): the child is told where the carried one goes. */
export const TWO_DIGITS_TEXT = 'En cada casilla va una sola cifra. La que te llevas va arriba, en la casilla pequeña.'

/** Pure presentation of a cell (shared by DigitCell and the gallery previews). */
export function CellVisual({
  variant, place, status, size, big, phase, digit, unsure, current, disabled, surfaceRef, canvasRef, surfaceProps, after, className,
}: CellVisualProps) {
  const showDigit = digit != null && phase !== 'writing' && phase !== 'pending'
  return (
    <div
      className={clsx(s.cell, s[variant], s[size], big && s.big, place && s[`pv_${place}`], s[`st_${status}`], current && s.current, disabled && s.disabled, className)}
      data-phase={phase}
      data-value={digit ?? ''}
    >
      <div ref={surfaceRef} className={clsx(s.surface, showDigit && s.hasDigit)} {...surfaceProps}>
        {variant !== 'given' && <span className={s.guide} aria-hidden />}
        {variant !== 'given' && <canvas ref={canvasRef} className={s.canvas} aria-hidden />}
        {showDigit && (
          <span key={`${digit}-${phase === 'typed' ? 't' : 'i'}`} className={clsx(s.digit, phase === 'typed' && s.typed)}>
            {digit}
          </span>
        )}
        {unsure && <span className={s.unsure} aria-hidden>?</span>}
      </div>
      {after}
    </div>
  )
}

// ------------------------------------------------------------------------------------------ behaviour

export function DigitCell(props: DigitCellProps & DigitCellExtraProps) {
  const {
    value, variant = 'result', place = null, autoFocus, disabled, status = 'idle', ariaLabel, size = 'md',
    cellId, showClear = true, className, numberId,
  } = props
  const ink = useInk()
  const group = useCellGroup()
  const uid = useId()
  const surfaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [phase, setPhaseState] = useState<CellPhase>(value != null ? 'typed' : 'empty')
  const phaseRef = useRef<CellPhase>(phase)
  const setPhase = useCallback((p: CellPhase) => { phaseRef.current = p; setPhaseState(p) }, [])
  const [rec, setRecState] = useState<DigitRecognition | null>(null)
  const recRef = useRef<DigitRecognition | null>(null)
  const setRec = useCallback((r: DigitRecognition | null) => { recRef.current = r; setRecState(r) }, [])
  const [popover, setPopover] = useState<null | 'alts' | 'fix' | 'pick'>(null)
  const [focused, setFocused] = useState(false)
  /** Two digits were written in this one cell: nothing is read, the child is told why. */
  const [twoDigits, setTwoDigits] = useState(false)

  const lastEmitted = useRef<number | null>(value ?? null)
  const lastVia = useRef<InkVia>('touch')
  const lastPenUp = useRef(-Infinity)
  const replacePending = useRef(false)
  const priorPhase = useRef<CellPhase>('empty')
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Old strokes shown faded while a new stroke may be replacing them. */
  const ghosts = useRef<Set<InkStroke>>(new Set())
  const waits = useRef(0)

  const latest = useRef({ props, ink, group })
  useLayoutEffect(() => { latest.current = { props, ink, group } })

  const editable = variant !== 'given' && !disabled
  const palm = usePalmGuard()

  const emit = (d: number | null, info?: InkChangeInfo) => {
    lastEmitted.current = d
    latest.current.props.onChange(d, info)
  }
  const clearIdle = () => {
    if (idle.current) clearTimeout(idle.current)
    idle.current = null
  }
  const strokes = (): InkStroke[] => surface.capture.current?.strokes ?? []
  const isEmpty = () => lastEmitted.current == null && strokes().length === 0 && !surface.capture.current?.writing

  const clearAll = () => {
    clearIdle()
    const had = strokes().length > 0 || lastEmitted.current != null
    surface.capture.current?.clear()
    setRec(null)
    setPopover(null)
    setTwoDigits(false)
    setPhase('empty')
    latest.current.ink.learning.forget(uid)
    latest.current.ink.learning.setBusy(uid, false)
    if (lastEmitted.current != null) emit(null, { confidence: 1, via: lastVia.current })
    if (had) sfx.play('erase', { volume: 0.4 })
  }

  /** Sets the cell's digit from the group (calculator typing): no auto-advance, no sound. */
  const assign = (d: number | null, via: 'keyboard' | 'keypad') => {
    if (!editable) return
    clearIdle()
    surface.capture.current?.clear()
    setRec(null)
    setPopover(null)
    setTwoDigits(false)
    setPhase(d == null ? 'empty' : 'typed')
    lastVia.current = via
    latest.current.ink.learning.forget(uid)
    latest.current.ink.learning.setBusy(uid, false)
    if (d !== lastEmitted.current) emit(d, { confidence: 1, via })
  }

  const input = (d: number, via: 'keyboard' | 'keypad') => {
    if (!editable) return
    latest.current.ink.learning.noteTyped()
    // A digit of a number typed like on a calculator: the group places it (units first, the rest move left).
    if (latest.current.group?.typeInNumber(uid, d, via)) return
    clearIdle()
    surface.capture.current?.clear()
    setRec(null)
    setPopover(null)
    setTwoDigits(false)
    setPhase('typed')
    lastVia.current = via
    latest.current.ink.learning.forget(uid)
    latest.current.ink.learning.setBusy(uid, false)
    emit(d, { confidence: 1, via })
    latest.current.group?.afterInput(uid)
  }

  const recognizeNow = () => {
    clearIdle()
    const list = strokes()
    const { ink: ctx } = latest.current
    if (!list.length) { ctx.learning.setBusy(uid, false); setPhase(lastEmitted.current != null ? 'typed' : 'empty'); return }
    if (!ctx.ready && ctx.recognizer && waits.current < 12) {
      // the model is still loading (first seconds after start): wait for it instead of failing
      waits.current++
      idle.current = setTimeout(recognizeNow, 250)
      return
    }
    waits.current = 0
    ctx.learning.setBusy(uid, false)
    const via: InkVia = list.some((st) => st.pointerType === 'pen') ? 'pen' : 'touch'
    lastVia.current = via
    // Two digits side by side in one cell («12»): reading one of them would grade something she did not mean.
    const zone = surface.size.current
    const parts = segmentStrokes(list, { zoneHeight: zone.height || 100 })
    if (parts.length >= 2 && parts.filter((p) => p.bbox.height >= (zone.height || 100) * 0.3).length >= 2) {
      setRec(null)
      setTwoDigits(true)
      setPhase('unknown')
      ctx.learning.forget(uid)
      ctx.learning.unknown(uid, TWO_DIGITS_TEXT)
      if (lastEmitted.current != null) emit(null, { confidence: 0, via })
      return
    }
    setTwoDigits(false)
    let r: DigitRecognition | null = null
    if (ctx.ready && ctx.recognizer) {
      try {
        r = ctx.recognizer.recognize(list, surface.size.current)
      } catch (err) {
        console.warn('[ink] recognition failed', err)
      }
    }
    if (!r || r.digit == null) {
      setRec(r)
      setPhase('unknown')
      ctx.learning.forget(uid)
      // Ink that could not be read: grading waits for the child to say which digit it is (never "empty").
      ctx.learning.unknown(uid)
      if (lastEmitted.current != null) emit(null, { confidence: 0, via })
      return
    }
    const unsure = isDoubtfulRead(r)
    setRec(r)
    setPhase(unsure ? 'unsure' : 'recognized')
    ctx.learning.report(uid, r.digit, r)
    ctx.learning.noteRead(uid, r, unsure, { carry: (latest.current.props.variant ?? 'result') === 'carry' })
    // A low-confidence read must be confirmed (or rewritten) before the answer is graded.
    if (unsure) ctx.learning.doubt(uid, r.digit)
    else ctx.learning.settle(uid)
    emit(r.digit, { confidence: r.confidence, via })
    sfx.play('pop', { volume: 0.3 })
  }

  const pick = (d: number) => pickAs(popover, d)

  const pickAs = (kind: typeof popover, d: number) => {
    setPopover(null)
    if (kind === 'pick' || (kind === 'fix' && !recRef.current)) {
      // No ink to learn from (keypad picker, or the model is not available): plain input.
      if (kind === 'fix') latest.current.ink.learning.countFix()
      input(d, 'keypad')
      return
    }
    const r = recRef.current
    const { learning } = latest.current.ink
    const isFix = !r || r.digit !== d
    if (r) {
      if (isFix) learning.corrected(d, r)
      learning.report(uid, d, r)
    }
    if (isFix) learning.countFix()
    // Picking a digit is the child's own answer for this cell (also when it is the digit read): no doubt left.
    learning.settle(uid)
    learning.known(uid)
    learning.confirmRead(uid, d)
    setRec(r ? { ...r, digit: d, confidence: 1 } : null)
    setTwoDigits(false)
    setPhase('recognized')
    const info: InkChangeInfo = { confidence: 1, via: lastVia.current, recognitionFix: isFix || undefined }
    emit(d, info)
    sfx.play('select', { volume: 0.4 })
  }

  /**
   * A finger on the cell although a pen is in use on this device (the Pencil may be lost or charging): a lone cell
   * opens the digit picker, a cell in a group points to the group's keypad. Never while the pen is busy (palm).
   */
  const fingerFallback = () => {
    const { ink: ctx, group: g } = latest.current
    if (!editable || ctx.mode === 'keypad' || msSincePenContact() < PEN_IDLE_FALLBACK_MS) return
    if (g) { if (!g.keypadVisible) g.nudgeKeypad(); return }
    setPopover('pick')
  }

  const surface = useInkSurface({
    surfaceRef,
    canvasRef,
    enabled: editable,
    role: (t, primary) => pointerRole(t, { penSeen: latest.current.ink.penSeen, mode: latest.current.ink.mode, isPrimary: primary }),
    widthScale: variant === 'carry' ? 0.8 : 1,
    ghost: (st) => ghosts.current.has(st),
    callbacks: {
      onStrokeStart() {
        clearIdle()
        setPopover(null)
        setTwoDigits(false)
        latest.current.ink.learning.setBusy(uid, true)
        const p = phaseRef.current
        priorPhase.current = p
        if (p === 'recognized' || p === 'unsure' || p === 'unknown') replacePending.current = now() - lastPenUp.current >= CONTINUE_MS
        else replacePending.current = p === 'typed'
        ghosts.current = new Set(replacePending.current ? strokes() : [])
        setPhase('writing')
      },
      onStrokeEnd(stroke) {
        const zone = surface.size.current
        if (isScribble(stroke, zone)) {
          clearAll()
          return false
        }
        lastPenUp.current = now()
        latest.current.ink.learning.setBusy(uid, true)
        if (replacePending.current) {
          replacePending.current = false
          const tall = strokeBBox(stroke).height >= zone.height * CONTINUE_MAX_HEIGHT
          if (tall || priorPhase.current === 'typed') {
            const cap = surface.capture.current
            if (cap) cap.strokes = []
          }
        }
        ghosts.current = new Set()
        setPhase('pending')
        idle.current = setTimeout(recognizeNow, IDLE_MS)
        return true
      },
      onStrokeCancel() {
        replacePending.current = false
        ghosts.current = new Set()
        if (strokes().length) {
          setPhase('pending')
          idle.current = setTimeout(recognizeNow, IDLE_MS)
        } else {
          latest.current.ink.learning.setBusy(uid, false)
          setPhase(priorPhase.current === 'writing' || priorPhase.current === 'pending' ? 'empty' : priorPhase.current)
        }
      },
      onTap(info) {
        latest.current.group?.setCurrent(uid)
        if (!editable) return
        const p = phaseRef.current
        if (p === 'unsure') { setPopover((v) => (v ? null : 'alts')); return }
        if (p === 'unknown') { setPopover((v) => (v ? null : 'fix')); return }
        const { ink: ctx, group: g } = latest.current
        if (ctx.mode === 'keypad' && (p === 'empty' || p === 'typed')) {
          if (!g?.keypadVisible) setPopover((v) => (v ? null : 'pick'))
          return
        }
        if (info.role === 'tap') { fingerFallback(); return }
        // The pen (or a finger on a device without pen) tapped: close the picker, or rewrite a recognised digit.
        if (popover === 'pick') { setPopover(null); return }
        // A tap never erases a recognised digit (a child may tap just to look): it opens the alternatives, which
        // offer the rewrite. Erasing stays with the ✕ button, the pen eraser and the scribble-out.
        if (p === 'recognized') { setPopover((v) => (v ? null : 'alts')); return }
      },
      onBlockedWrite() {
        fingerFallback()
      },
      onEraseAt() {
        if (!isEmpty()) clearAll()
      },
    },
  })

  // External value changes (next exercise, activity reset, a group's keypad…) win over local ink.
  useEffect(() => {
    const v = value ?? null
    if (v === lastEmitted.current) return
    lastEmitted.current = v
    clearIdle()
    surface.capture.current?.clear()
    setRec(null)
    setPopover(null)
    setTwoDigits(false)
    setPhase(v == null ? 'empty' : 'typed')
    latest.current.ink.learning.forget(uid)
    latest.current.ink.learning.setBusy(uid, false)
  }, [value])

  useEffect(() => {
    if (autoFocus && editable) surfaceRef.current?.focus({ preventScroll: true })
  }, [])

  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearIdle()
      // An unmounted cell's pending recognition must not be confirmed by a later exercise; the grace time lets an
      // activity call confirm() right after the answer, even if the cells unmount in the same update.
      // (StrictMode's simulated unmount remounts at once: `mounted` is true again and nothing is forgotten.)
      const { learning } = latest.current.ink
      setTimeout(() => { if (!mounted.current) learning.forget(uid) }, UNMOUNT_FORGET_MS)
    }
  }, [])

  // Register with the surrounding CellGroup (focus order, keypad target).
  const flush = () => {
    if (phaseRef.current !== 'pending') return false
    recognizeNow()
    return true
  }
  /** The child said which digit this is from a question («No, el 7 es un 2»): same as picking it in the alternatives. */
  const choose = (d: number) => pickAs('fix', d)
  const apiRef = useRef({ input, clearAll, isEmpty, flush, assign, choose })
  useLayoutEffect(() => { apiRef.current = { input, clearAll, isEmpty, flush, assign, choose } })

  // Register with the ink store: grading flushes pending ink, a question can erase or open the picker on this cell.
  const store = ink.learning
  useEffect(() => {
    if (!editable) return
    return store.registerSurface(uid, {
      flush: () => apiRef.current.flush(),
      rewrite: () => { apiRef.current.clearAll(); surfaceRef.current?.focus({ preventScroll: true }) },
      pick: () => setPopover('fix'),
      choose: (_key, d) => apiRef.current.choose(d),
    })
  }, [store, uid, editable])
  const register = group?.register
  useEffect(() => {
    const el = surfaceRef.current
    if (!register || !el) return
    return register(uid, {
      el,
      cellId,
      numberId,
      optional: (latest.current.props.variant ?? 'result') === 'carry',
      focusable: () => !latest.current.props.disabled && (latest.current.props.variant ?? 'result') !== 'given',
      focus: () => el.focus({ preventScroll: true }),
      input: (d, via) => apiRef.current.input(d, via),
      assign: (d, via) => apiRef.current.assign(d, via),
      value: () => lastEmitted.current,
      clear: () => apiRef.current.clearAll(),
      isEmpty: () => apiRef.current.isEmpty(),
      flush: () => apiRef.current.flush(),
    })
  }, [register, uid, cellId, numberId])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (variant === 'given') return
    const k = e.key
    if (/^[0-9]$/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault()
      if (disabled) return
      ink.noteKeyboard()
      input(Number(k), 'keyboard')
      return
    }
    if (k === 'Backspace' || k === 'Delete') {
      e.preventDefault()
      if (disabled) return
      if (k === 'Backspace' && group?.deleteInNumber(uid)) return
      if (!isEmpty()) clearAll()
      else if (k === 'Backspace') group?.back(uid)
      return
    }
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
      if (!group) return
      e.preventDefault()
      group.move(uid, k === 'ArrowLeft' ? 'left' : k === 'ArrowRight' ? 'right' : k === 'ArrowUp' ? 'up' : 'down')
      return
    }
    if (k === 'Tab') {
      if (group && group.tab(uid, e.shiftKey)) e.preventDefault()
      return
    }
    if (k === 'Enter') {
      if (!group) return
      e.preventDefault()
      group.submit()
      return
    }
    if (k === 'Escape') setPopover(null)
  }

  const big = ink.bigCells
  const isCurrent = !!group && group.currentId === uid && (ink.mode === 'keyboard' || ink.mode === 'keypad' || group.keypadVisible)
  const tabIndex = !editable ? -1 : group ? (group.currentId == null || group.currentId === uid ? 0 : -1) : 0
  const unsure = phase === 'unsure' || phase === 'unknown'
  const filled = phase === 'recognized' || phase === 'unsure' || phase === 'unknown' || phase === 'typed'
  const clearVisible = showClear && editable && variant === 'result' && focused && filled
  // Column order (units first): an arrow in the cell that is written next says which way the digits go. The view may
  // mark that cell itself (status 'active', ColumnView: the first empty column); then that mark wins over the cursor
  // (the CSS hides the cursor's arrow while the group has an active cell). A division marks 'active' too, but its
  // quotient goes left to right: no arrow outside a group in column order.
  const columnOrder = editable && variant === 'result' && group?.typingOrder === 'column'
  const arrowKind = !columnOrder ? null : status === 'active' ? 'active' : isCurrent ? 'current' : null

  const popoverDigits =
    popover === 'alts' || (popover === 'fix' && (rec?.alternatives?.length ?? 0) > 0) ? alternativeDigits(rec) : ALL_DIGITS
  const popoverTitle = popover === 'alts' ? '¿Cuál querías escribir?' : popover === 'fix' ? '¿Qué número es?' : 'Elige un número'

  return (
    <CellVisual
      variant={variant}
      place={place}
      status={status}
      size={size}
      big={big}
      phase={phase}
      digit={variant === 'given' ? value : lastEmittedDisplay(phase, value, rec)}
      unsure={unsure}
      current={isCurrent}
      disabled={disabled}
      surfaceRef={surfaceRef}
      canvasRef={canvasRef}
      className={className}
      surfaceProps={{
        'data-ink-key': uid,
        role: 'textbox',
        tabIndex: variant === 'given' ? undefined : tabIndex,
        'aria-label': ariaLabel ?? (variant === 'carry' ? 'llevada' : 'cifra'),
        'aria-readonly': variant === 'given' || undefined,
        'aria-disabled': disabled || undefined,
        'aria-invalid': status === 'wrong' || undefined,
        onKeyDown,
        onFocus: () => { setFocused(true); group?.setCurrent(uid) },
        onBlur: () => setFocused(false),
      }}
      after={
        <>
          {arrowKind && (
            <span className={clsx(s.arrow, arrowKind === 'current' && s.arrowCurrent)} aria-hidden data-testid="column-arrow" data-arrow={arrowKind}>←</span>
          )}
          {twoDigits && <NudgeBubble text={TWO_DIGITS_TEXT} side="bottom" className={s.twoDigits} />}
          {clearVisible && (
            <button
              type="button"
              className={s.clear}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={palm.onPointerDown}
              onClick={palm.guard(() => { clearAll(); surfaceRef.current?.focus({ preventScroll: true }) })}
              aria-label="Borrar esta cifra"
            >
              {/* a school eraser, not a ✕: the ✕ means "leave" in the rest of the app */}
              <EraserIcon size={18} />
            </button>
          )}
          {popover && (
            <AltPopover
              anchorRef={surfaceRef}
              digits={popoverDigits}
              current={popover === 'alts' ? rec?.digit ?? null : null}
              title={popoverTitle}
              onPick={pick}
              onRewrite={popover === 'pick' ? undefined : () => { clearAll(); surfaceRef.current?.focus({ preventScroll: true }) }}
              onClose={() => setPopover(null)}
            />
          )}
        </>
      }
    />
  )
}

/** The digit to typeset: the controlled value, or the recognised digit while the parent catches up. */
function lastEmittedDisplay(phase: CellPhase, value: number | null, rec: DigitRecognition | null): number | null {
  if (phase === 'unknown') return null
  if (value != null) return value
  if ((phase === 'recognized' || phase === 'unsure') && rec?.digit != null) return rec.digit
  return null
}
