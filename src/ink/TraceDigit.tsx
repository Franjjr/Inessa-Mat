/* <TraceDigit digit onDone> — handwriting practice for digits that are often misread: a dotted school model
   with a green start dot and arrows (Spanish stroke order), "watch how" animation, the child traces it,
   gentle scoring with 1–3 stars. onDone receives the result. */
import clsx from 'clsx'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { StarIcon } from '@/art'
import { sfx } from '@/audio'
import { celebrate } from '@/fx'
import { IDLE_MS_SLOW } from './constants'
import { useInk } from './context'
import { DIGIT_MODELS, DIGIT_TIPS } from './digitModels'
import { isScribble } from './geometry'
import { pointerRole } from './policy'
import { fitModel, scoreTrace, type TraceScore } from './trace'
import { useInkSurface } from './useInkSurface'
import { usePalmGuard } from './usePalmGuard'
import { ModelDigit } from './ModelDigit'
import { CheckIcon, EraserIcon, PlayIcon, RedoIcon } from './icons'
import s from './TraceDigit.module.css'

export interface TraceDigitProps {
  digit: number
  onDone: (result: { stars: 1 | 2 | 3; score: number }) => void
  className?: string
}

const MESSAGES: Record<1 | 2 | 3, string> = {
  3: '¡Perfecto! ¡Qué {d} tan bonito!',
  2: '¡Muy bien! Cada vez te sale mejor.',
  1: '¡Buen intento! ¿Lo repasamos otra vez?',
}

/** A new digit starts a fresh exercise (keyed remount, no reset effect). */
export function TraceDigit(props: TraceDigitProps) {
  return <TraceDigitInner key={props.digit} {...props} />
}

function TraceDigitInner({ digit, onDone, className }: TraceDigitProps) {
  const ink = useInk()
  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [play, setPlay] = useState(0)
  const [hasInk, setHasInk] = useState(false)
  const [result, setResult] = useState<TraceScore | null>(null)
  const [penHint, setPenHint] = useState(false)
  const palm = usePalmGuard()
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ ink, digit })
  useLayoutEffect(() => { latest.current = { ink, digit } })

  const modelStrokes = DIGIT_MODELS[digit]?.length ?? 1
  const clearIdle = () => { if (idle.current) clearTimeout(idle.current); idle.current = null }

  const evaluate = () => {
    clearIdle()
    const strokes = surface.capture.current?.strokes ?? []
    if (!strokes.length) return
    const { width, height } = surface.size.current
    const r = scoreTrace(latest.current.digit, strokes, fitModel(width, height))
    setResult(r)
    sfx.play(r.stars === 3 ? 'fanfare' : 'star', { volume: 0.6 })
    if (r.stars === 3) {
      const rect = areaRef.current?.getBoundingClientRect()
      celebrate('stars', rect ? { origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight } } : undefined)
    }
  }

  const reset = () => {
    clearIdle()
    surface.capture.current?.clear()
    setHasInk(false)
    setResult(null)
  }

  const surface = useInkSurface({
    surfaceRef: areaRef,
    canvasRef,
    enabled: !result,
    widthScale: 1.7,
    overflow: 0.04,
    role: (t, primary) => pointerRole(t, { penSeen: latest.current.ink.penSeen, mode: 'touch', isPrimary: primary }),
    callbacks: {
      onStrokeStart() { clearIdle(); setPlay(0); setPenHint(false) },
      onStrokeEnd(stroke) {
        if (isScribble(stroke, surface.size.current)) { reset(); return false }
        setHasInk(true)
        const count = (surface.capture.current?.strokes.length ?? 0) + 1
        if (count >= modelStrokes) idle.current = setTimeout(evaluate, IDLE_MS_SLOW)
        return true
      },
      onEraseAt() { reset() },
      // a pen has been used on this device, so fingers do not write (palm rejection)
      onBlockedWrite() { setPenHint(true) },
    },
  })

  useEffect(() => () => clearIdle(), [])

  const tip = DIGIT_TIPS[digit] ?? ''
  return (
    <div className={clsx(s.root, className)}>
      <header className={s.head}>
        <h3 className={s.title}>Repasa el <span className={s.big}>{digit}</span></h3>
        <p className={clsx(s.tip, penHint && s.penHint)} aria-live="polite">{penHint ? '¡Repasa con el lápiz!' : tip}</p>
      </header>

      <div className={s.stage}>
        <div ref={areaRef} className={clsx(s.area, result && s.scored)} role="img" aria-label={`Zona para repasar el ${digit}. ${tip}`}>
          <ModelDigit digit={digit} fill look="dotted" play={play} />
          <canvas ref={canvasRef} className={s.canvas} aria-hidden />
        </div>

        <div className={s.tools}>
          {result && (
            <div className={s.result} role="status">
              <div className={s.stars}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={clsx(s.star, n <= result.stars && s.on)} style={{ animationDelay: `${n * 140}ms` }}>
                    <StarIcon filled={n <= result.stars} size={44} />
                  </span>
                ))}
              </div>
              <p className={s.msg}>{MESSAGES[result.stars].replace('{d}', String(digit))}</p>
              {!result.startOk && result.stars < 3 && <p className={s.hint}>Truco: empieza en el punto verde.</p>}
            </div>
          )}
          {!result ? (
            <>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => { reset(); setPlay((p) => p + 1) })} aria-label="Mira cómo se hace">
                <PlayIcon size={26} />
                <span>Mira</span>
              </button>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(reset)} disabled={!hasInk} aria-label="Borrar">
                <EraserIcon size={26} />
                <span>Borrar</span>
              </button>
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(evaluate)} disabled={!hasInk} aria-label="¡Listo!">
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>¡Listo!</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(reset)} aria-label="Otra vez">
                <RedoIcon size={26} />
                <span>Otra vez</span>
              </button>
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => onDone({ stars: result.stars, score: result.score }))} aria-label="Seguir">
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>Seguir</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
