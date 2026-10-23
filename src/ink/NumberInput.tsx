/* <NumberInput> — a wide writing pad for a whole number (facts: 6 × 7 = ?).
   The child writes the number anywhere; strokes are segmented into digits by clustering their bounding boxes
   along x (robust to multi-stroke 4/5/7 and slight overlaps), each digit is recognised and typeset over the
   faded ink. Big ✓ button and Enter submit. Keyboard digits, Backspace, Escape; inline keypad fallback. */
import clsx from 'clsx'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { DigitRecognition, InkStroke, NumberInputProps } from '@/types'
import { sfx } from '@/audio'
import { IDLE_MS, LOW_CONFIDENCE, PEN_IDLE_FALLBACK_MS, UNMOUNT_FORGET_MS } from './constants'
import { useInk } from './context'
import { isScribble, overlapFraction, segmentStrokes, segmentZone, spreadCentres, strokeBBox, strokesNear, type BBox } from './geometry'
import { msSincePenContact, pointerRole } from './policy'
import { useInkSurface } from './useInkSurface'
import { usePalmGuard } from './usePalmGuard'
import { AltPopover } from './AltPopover'
import { ALL_DIGITS, alternativeDigits } from './alternatives'
import { Keypad } from './Keypad'
import { CheckIcon, EraserIcon, KeypadIcon, PencilIcon } from './icons'
import { NudgeBubble, useNudge } from './Nudge'
import s from './NumberInput.module.css'

export interface NumberInputExtraProps {
  ariaLabel?: string
  className?: string
  /** Show the "123" toggle that opens the on-screen keypad as a fallback (default true). */
  keypadToggle?: boolean
  /**
   * Where the on-screen keypad goes when it is shown (keypad mode or the toggle): 'below' (default, two rows of 5)
   * or 'right' (3×4 grid beside the pad — keeps the pad centred, e.g. inline after "6 × 7 =").
   */
  keypadPosition?: 'below' | 'right'
  /**
   * Show the pad's own ✓ (default true). Views with several boxes side by side (euros and céntimos, the parts of a
   * number, a fraction, hour and minutes) hide it and check with their shared «Comprobar»; Enter still submits.
   */
  checkButton?: boolean
}

interface SegView {
  key: string
  digit: number | null
  confidence: number
  rec: DigitRecognition | null
  bbox: BBox
  strokes: InkStroke[]
}

let strokeCounter = 0
const strokeIds = new WeakMap<InkStroke, number>()
const sid = (st: InkStroke) => {
  let id = strokeIds.get(st)
  if (id == null) { id = ++strokeCounter; strokeIds.set(st, id) }
  return id
}

function placeholderFor(mode: string): string {
  switch (mode) {
    case 'pen': return 'Escribe aquí'
    case 'touch': return 'Escribe con el dedo'
    case 'keyboard': return 'Escribe el número'
    case 'keypad': return 'Toca los números'
    default: return 'Escribe aquí'
  }
}

export function NumberInput(props: NumberInputProps & NumberInputExtraProps) {
  const {
    value, maxDigits = 3, size = 'md', autoFocus, disabled, placeholder, status = 'idle', ariaLabel, className, keypadToggle = true, checkButton = true,
    keypadPosition = 'below',
  } = props
  const ink = useInk()
  const uid = useId()
  const padRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [segments, setSegments] = useState<SegView[]>([])
  const [typed, setTyped] = useState<string>(value != null ? String(value) : '')
  const [inkState, setInkState] = useState<'none' | 'writing' | 'done'>('none')
  const [popover, setPopover] = useState<string | null>(null)
  const [toggled, setToggled] = useState(false)
  const [, setTick] = useState(0)
  const [padSize, setPadSize] = useState({ width: 0, height: 0 })
  const anchorRef = useRef<HTMLSpanElement>(null)

  const overrides = useRef(new Map<string, number>())
  const lastEmitted = useRef<number | null>(value ?? null)
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const waits = useRef(0)
  const typedRef = useRef(typed)
  const segRef = useRef<SegView[]>([])
  const latest = useRef({ props, ink })
  useLayoutEffect(() => { latest.current = { props, ink } })

  const keypadVisible = ink.mode === 'keypad' || toggled
  const palm = usePalmGuard()
  const [nudging, nudge] = useNudge()
  /** A finger on the pad although a pen is in use (Pencil lost?): point to the keypad toggle. */
  const fingerFallback = () => {
    if (disabled || !keypadToggle || keypadVisible || ink.mode === 'keypad') return
    if (msSincePenContact() >= PEN_IDLE_FALLBACK_MS) nudge()
  }

  const emit = (v: number | null) => {
    if (v === lastEmitted.current) return
    lastEmitted.current = v
    latest.current.props.onChange(v)
  }
  const clearIdle = () => { if (idle.current) clearTimeout(idle.current); idle.current = null }
  const setTypedBoth = (t: string) => { typedRef.current = t; setTyped(t) }
  const setSegs = (v: SegView[]) => { segRef.current = v; setSegments(v) }

  const recognizeAll = (): number | null => {
    clearIdle()
    const cap = surface.capture.current
    const strokes = cap?.strokes ?? []
    const { ink: ctx } = latest.current
    ctx.learning.forgetPrefix(`${uid}:`)
    if (!strokes.length) {
      setSegs([])
      setInkState('none')
      const v = typedRef.current ? Number(typedRef.current) : null
      emit(v)
      return v
    }
    if (!ctx.ready && ctx.recognizer && waits.current < 12) {
      // the model is still loading: try again shortly (submit() forces a result)
      waits.current++
      idle.current = setTimeout(recognizeAll, 250)
      return lastEmitted.current
    }
    waits.current = 0
    const H = surface.size.current.height || 100
    const views: SegView[] = segmentStrokes(strokes, { zoneHeight: H }).map((seg) => {
      const key = seg.strokes.map(sid).sort((a, b) => a - b).join(',')
      let rec: DigitRecognition | null = null
      if (ctx.ready && ctx.recognizer) {
        const { strokes: zs, zone } = segmentZone(seg, H)
        try { rec = ctx.recognizer.recognize(zs, zone) } catch (err) { console.warn('[ink] recognition failed', err) }
      }
      const override = overrides.current.get(key)
      const digit = override ?? rec?.digit ?? null
      return { key, digit, confidence: override != null ? 1 : rec?.confidence ?? 0, rec, bbox: seg.bbox, strokes: seg.strokes }
    })
    const live = new Set(views.map((v) => v.key))
    for (const k of [...overrides.current.keys()]) if (!live.has(k)) overrides.current.delete(k)
    for (const v of views) if (v.digit != null && v.rec) ctx.learning.report(`${uid}:${v.key}`, v.digit, v.rec)
    // Low-confidence digits must be confirmed (or rewritten) before the answer is graded.
    for (const v of views) {
      if (v.digit != null && v.confidence < LOW_CONFIDENCE) ctx.learning.doubt(`${uid}:${v.key}`, v.digit)
    }
    setSegs(views)
    setInkState('done')
    const complete = views.length > 0 && views.every((v) => v.digit != null)
    const val = complete ? Number(views.map((v) => v.digit).join('')) : null
    emit(val)
    if (complete) sfx.play('pop', { volume: 0.3 })
    return val
  }

  const removeStrokes = (gone: Set<InkStroke>) => {
    const cap = surface.capture.current
    if (!cap || !gone.size) return false
    cap.setStrokes(cap.strokes.filter((st) => !gone.has(st)))
    return true
  }

  const clearAll = () => {
    clearIdle()
    surface.capture.current?.clear()
    overrides.current.clear()
    latest.current.ink.learning.forgetPrefix(`${uid}:`)
    setSegs([])
    setTypedBoth('')
    setInkState('none')
    setPopover(null)
    emit(null)
  }

  const typeDigit = (d: number, via: 'keyboard' | 'keypad') => {
    if (disabled) return
    if ((surface.capture.current?.strokes.length ?? 0) > 0) {
      surface.capture.current?.clear()
      overrides.current.clear()
      latest.current.ink.learning.forgetPrefix(`${uid}:`)
      setSegs([])
      setInkState('none')
    }
    if (via === 'keyboard') latest.current.ink.noteKeyboard()
    const t = typedRef.current.length >= maxDigits ? typedRef.current : typedRef.current + String(d)
    setTypedBoth(t)
    emit(t ? Number(t) : null)
  }

  const backspace = () => {
    if (disabled) return
    const segs = segRef.current
    if ((surface.capture.current?.strokes.length ?? 0) > 0) {
      const last = segs[segs.length - 1]
      if (last) removeStrokes(new Set(last.strokes))
      else surface.capture.current?.clear()
      recognizeAll()
      sfx.play('erase', { volume: 0.4 })
      return
    }
    const t = typedRef.current.slice(0, -1)
    setTypedBoth(t)
    emit(t ? Number(t) : null)
  }

  const submit = () => {
    if (disabled) return
    let v = lastEmitted.current
    if (idle.current || surface.capture.current?.writing) {
      waits.current = 99 // no more waiting: recognise with whatever is available
      v = recognizeAll()
    }
    latest.current.props.onSubmit(v)
  }

  const pickAlt = (key: string, d: number) => {
    setPopover(null)
    const seg = segRef.current.find((x) => x.key === key)
    const { learning } = latest.current.ink
    const isFix = !seg || seg.digit !== d
    if (seg?.rec && isFix) learning.corrected(d, seg.rec)
    if (isFix) learning.countFix()
    overrides.current.set(key, d)
    recognizeAll()
    sfx.play('select', { volume: 0.4 })
  }

  const surface = useInkSurface({
    surfaceRef: padRef,
    canvasRef,
    enabled: !disabled,
    role: (t, primary) => pointerRole(t, { penSeen: latest.current.ink.penSeen, mode: latest.current.ink.mode, isPrimary: primary }),
    onResize: (sz) => setPadSize({ ...sz }),
    callbacks: {
      onStrokeStart() {
        clearIdle()
        setPopover(null)
        if (typedRef.current) { setTypedBoth(''); emit(null) }
        setInkState('writing')
      },
      onStrokeEnd(stroke) {
        const zone = surface.size.current
        if (isScribble(stroke, zone)) {
          const sb = strokeBBox(stroke)
          const cap = surface.capture.current
          const gone = new Set((cap?.strokes ?? []).filter((st) => overlapFraction(strokeBBox(st), sb, 6) > 0.35))
          if (removeStrokes(gone)) sfx.play('erase', { volume: 0.4 })
          setTimeout(recognizeAll, 0)
          return false
        }
        setInkState('writing')
        idle.current = setTimeout(recognizeAll, IDLE_MS)
        return true
      },
      onStrokeCancel() {
        if (surface.capture.current?.strokes.length) idle.current = setTimeout(recognizeAll, IDLE_MS)
        else setInkState(segRef.current.length ? 'done' : 'none')
      },
      onTap(info) {
        if (disabled) return
        const seg = segRef.current.find((x) => info.x >= x.bbox.minX - 12 && info.x <= x.bbox.maxX + 12)
        if (!seg && info.role === 'tap') { fingerFallback(); return }
        if (!seg || idle.current) return
        if (seg.digit == null || seg.confidence < LOW_CONFIDENCE) { setPopover((p) => (p === seg.key ? null : seg.key)); return }
        if (info.role === 'write') {
          removeStrokes(new Set(seg.strokes))
          recognizeAll()
          sfx.play('erase', { volume: 0.4 })
        }
      },
      onBlockedWrite() {
        fingerFallback()
      },
      onEraseAt(x, y) {
        const cap = surface.capture.current
        if (!cap) return
        const r = Math.max(10, surface.size.current.height * 0.12)
        if (removeStrokes(new Set(strokesNear(cap.strokes, x, y, r)))) setTick((n) => n + 1)
      },
      onEraseEnd() {
        recognizeAll()
      },
    },
  })

  // External value changes (next exercise / reset) replace whatever is on the pad.
  useEffect(() => {
    const v = value ?? null
    if (v === lastEmitted.current) return
    lastEmitted.current = v
    clearIdle()
    surface.capture.current?.clear()
    overrides.current.clear()
    latest.current.ink.learning.forgetPrefix(`${uid}:`)
    setSegs([])
    setInkState('none')
    setPopover(null)
    setTypedBoth(v == null ? '' : String(v))
  }, [value])

  useEffect(() => {
    if (autoFocus && !disabled) padRef.current?.focus({ preventScroll: true })
  }, [])

  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearIdle()
      // see DigitCell: forget this pad's pending recognitions shortly after it really unmounts
      const { learning } = latest.current.ink
      setTimeout(() => { if (!mounted.current) learning.forgetPrefix(`${uid}:`) }, UNMOUNT_FORGET_MS)
    }
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const k = e.key
    if (/^[0-9]$/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeDigit(Number(k), 'keyboard'); return }
    if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); backspace(); return }
    if (k === 'Enter') { e.preventDefault(); submit(); return }
    if (k === 'Escape') { e.preventDefault(); if (popover) setPopover(null); else clearAll() }
  }

  // ---- layout of the typeset digits over the ink
  const padW = padSize.width
  const padH = padSize.height
  const fontPx = padH * 0.6
  const centres = padW ? spreadCentres(segments.map((x) => x.bbox.cx), fontPx * 0.64, padW) : segments.map((x) => x.bbox.cx)
  const hasInk = inkState !== 'none'
  const showDigits = inkState === 'done' && segments.length > 0
  const empty = !hasInk && !typed
  const popSeg = popover ? segments.find((x) => x.key === popover) ?? null : null
  const canSubmit = !disabled && (hasInk || typed.length > 0)
  const ph = placeholder ?? placeholderFor(ink.mode)

  return (
    <div
      className={clsx(
        s.root, s[size], s[`st_${status}`], disabled && s.disabled, ink.bigCells && s.big,
        keypadVisible && s.withKeypad, keypadVisible && keypadPosition === 'right' && s.keypadRight, className,
      )}
      style={{ ['--digits' as string]: Math.max(1, maxDigits) } as CSSProperties}
      data-state={inkState}
      data-value={value ?? ''}
    >
      <div className={s.row}>
        <div
          ref={padRef}
          className={clsx(s.pad, showDigits && s.faded)}
          role="textbox"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel ?? 'Escribe tu respuesta'}
          aria-disabled={disabled || undefined}
          aria-invalid={status === 'wrong' || undefined}
          onKeyDown={onKeyDown}
        >
          <span className={s.guide} aria-hidden />
          <canvas ref={canvasRef} className={s.canvas} aria-hidden />
          {empty && (
            <span className={s.placeholder} aria-hidden>
              {ink.mode === 'keypad' || ink.mode === 'keyboard' ? null : <PencilIcon size={22} />}
              {ph}
            </span>
          )}
          {typed && !hasInk && (
            <span className={s.typed} aria-hidden>
              {typed.split('').map((ch, i) => <span key={`${i}-${ch}`} className={s.typedDigit}>{ch}</span>)}
            </span>
          )}
          {showDigits && segments.map((seg, i) => {
            const unsure = seg.digit == null || seg.confidence < LOW_CONFIDENCE
            return (
              <span
                key={seg.key}
                className={clsx(s.digit, seg.digit == null && s.unknown)}
                style={{ left: centres[i], fontSize: fontPx }}
                data-seg={seg.key}
                aria-hidden
              >
                {seg.digit ?? '?'}
                {unsure && seg.digit != null && <span className={s.unsure}>?</span>}
              </span>
            )
          })}
          {popSeg && (
            <span
              className={s.anchor}
              style={{ left: popSeg.bbox.minX, width: Math.max(8, popSeg.bbox.width), top: popSeg.bbox.minY, height: Math.max(8, popSeg.bbox.height) }}
              ref={anchorRef}
            />
          )}
          <span className="visually-hidden" aria-live="polite">{value != null ? String(value) : ''}</span>
        </div>

        {(!keypadVisible || (keypadToggle && ink.mode !== 'keypad')) && <div className={s.tools}>
          {!keypadVisible && (
            <button
              type="button"
              className={clsx(s.tool, s.erase)}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={palm.onPointerDown}
              onClick={palm.guard(() => { clearAll(); sfx.play('erase', { volume: 0.4 }); padRef.current?.focus({ preventScroll: true }) })}
              disabled={disabled || empty}
              aria-label="Borrar"
            >
              <EraserIcon size={26} />
            </button>
          )}
          {keypadToggle && ink.mode !== 'keypad' && (
            <span className={s.toggleWrap}>
              {nudging && !keypadVisible && <NudgeBubble side="bottom" />}
              <button
                type="button"
                className={clsx(s.tool, s.toggle, nudging && !keypadVisible && s.nudge)}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={palm.onPointerDown}
                onClick={palm.guard(() => { setToggled((t) => !t); padRef.current?.focus({ preventScroll: true }) })}
                aria-pressed={toggled}
                aria-label={toggled ? 'Escribir a mano' : 'Usar el teclado de números'}
              >
                {toggled ? <PencilIcon size={24} /> : <KeypadIcon size={22} />}
              </button>
            </span>
          )}
          {!keypadVisible && checkButton && (
            <button
              type="button"
              className={s.check}
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={palm.onPointerDown}
              onClick={palm.guard(submit)}
              disabled={!canSubmit}
              aria-label="Comprobar"
            >
              <CheckIcon size={44} strokeWidth={3.4} />
            </button>
          )}
        </div>}
      </div>

      {keypadVisible && (
        <Keypad
          className={s.keypad}
          layout={keypadPosition === 'right' ? 'grid' : 'wide'}
          size="sm"
          disabled={disabled}
          onDigit={(d) => typeDigit(d, 'keypad')}
          onDelete={backspace}
          onSubmit={submit}
          submitDisabled={!canSubmit}
        />
      )}

      {popSeg && (
        <AltPopover
          anchorRef={anchorRef}
          digits={popSeg.rec && popSeg.rec.alternatives.length ? alternativeDigits(popSeg.rec) : ALL_DIGITS}
          current={popSeg.digit}
          title={popSeg.digit == null ? '¿Qué número es?' : '¿Cuál querías escribir?'}
          onPick={(d) => pickAlt(popSeg.key, d)}
          onRewrite={() => {
            setPopover(null)
            removeStrokes(new Set(popSeg.strokes))
            recognizeAll()
            padRef.current?.focus({ preventScroll: true })
          }}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}
