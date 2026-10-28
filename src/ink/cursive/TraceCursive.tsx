/* <TraceCursive item onDone> — one item of Caligrafía con lápiz in three steps: Mirar (the model, drawn to watch),
   Repasar (the dotted model under the pen; a stroke turns orange and says what is wrong when it goes off the line or
   against the arrow) and Escribir sola (the pauta only: 2 tries for letters and links, 1 for words and sentences; the
   best try counts). Each try is scored on the device; only the pen strokes are scored, palm and finger strokes are dropped. */
import clsx from 'clsx'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StarIcon } from '@/art/worlds/StarIcon'
import { sfx } from '@/audio'
import { celebrate, stopCelebrations } from '@/fx'
import type { CalItem } from '@/content/caligrafia/curriculum'
import type { GrammaticalGender, InkStroke } from '@/types'
import { svgPath } from '../digitModels'
import { isScribble, type Size } from '../geometry'
import { useInk } from '../context'
import { pointerRole } from '../policy'
import { useInkSurface } from '../useInkSurface'
import { usePalmGuard } from '../usePalmGuard'
import { CheckIcon, CloseIcon, EraserIcon, PlayIcon, RedoIcon } from '../icons'
import { CursiveModel } from './CursiveModel'
import { joinWord } from './join'
import { ASCENDER, BASELINE, XHEIGHT } from './models'
import { arrowsOf, betterScore, createLiveTracker, LIVE_TEXT, toModel, toScreen, triesFor, wordStarts, type LiveStatus } from './practice'
import { fitPauta, scoreCursive, type Criterion, type CursiveScore, type PautaFit } from './score'
import s from './TraceCursive.module.css'

export interface TraceCursiveProps {
  item: CalItem
  /** The child's gender, for the writing step's title («Escribe sola» or «Escribe solo»); masculine when unknown. */
  gender?: GrammaticalGender
  /** `ms` is the time from the start of the writing step to «Siguiente» (the model's viewing time is not counted). */
  onDone: (result: { score: CursiveScore; tries: number; ms: number }) => void
  /** Every try, as it is scored (the trial page shows the raw values of each one). */
  onTry?: (score: CursiveScore) => void
  className?: string
}

type Step = 'mirar' | 'repasar' | 'escribir'

const TITLES: Record<'mirar' | 'repasar', string> = { mirar: 'Mira', repasar: 'Repasa' }
const CRITERIA: { key: Criterion; label: string }[] = [
  { key: 'shape', label: 'forma' },
  { key: 'line', label: 'línea' },
  { key: 'size', label: 'tamaño' },
  { key: 'start', label: 'inicio' },
]
const MIRAR_HINT = 'Mira cómo se hace. Fíjate por dónde empieza y hacia dónde va.'
const REPASAR_HINT = 'Repasa la línea gris con el lápiz, empezando por el punto verde.'
const ESCRIBIR_HINT = 'Escríbela tú, sin modelo.'

/** A new item starts a fresh practice (keyed remount, no reset effect). */
export function TraceCursive(props: TraceCursiveProps) {
  return <TraceCursiveInner key={props.item.skill} {...props} />
}

function TraceCursiveInner({ item, gender, onDone, onTry, className }: TraceCursiveProps) {
  const ink = useInk()
  const text = item.text
  const target = useMemo(() => joinWord(text), [text])
  const starts = useMemo(() => wordStarts(text), [text])
  const tracker = useMemo(() => createLiveTracker(target.strokes), [target])
  const maxTries = triesFor(item.kind)

  const areaRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const palm = usePalmGuard()
  const [step, setStep] = useState<Step>('mirar')
  const [play, setPlay] = useState(1)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })
  const [notice, setNotice] = useState<string | null>(null)
  // The strokes that went off the model (orange): state, so the overlay re-renders with them.
  const [flaggedView, setFlaggedView] = useState<InkStroke[]>([])
  const [hasInk, setHasInk] = useState(false)
  const [penHint, setPenHint] = useState(false)
  const [tries, setTries] = useState(0)
  const [last, setLast] = useState<CursiveScore | null>(null)
  const [best, setBest] = useState<CursiveScore | null>(null)
  const flagged = useRef(new Set<InkStroke>())
  const writingSince = useRef(0)
  const cursor = useRef<{ stroke: InkStroke | null; n: number }>({ stroke: null, n: 0 })

  const fit: PautaFit | null = size.width && size.height ? fitPauta(size.width, size.height, target.width) : null
  const latest = useRef({ ink, fit, step })
  useLayoutEffect(() => { latest.current = { ink, fit, step } })

  const clearInk = () => {
    surface.capture.current?.clear()
    flagged.current.clear()
    setFlaggedView([])
    cursor.current = { stroke: null, n: 0 }
    tracker.reset()
    setNotice(null)
    setHasInk(false)
    setPenHint(false)
  }

  /** Feeds the pen points of the stroke being drawn to the live check (Repasar only). */
  const liveFeed = () => {
    const cur = surface.capture.current?.current
    const f = latest.current.fit
    if (!cur || !f) return
    if (cursor.current.stroke !== cur) {
      cursor.current = { stroke: cur, n: 0 }
      tracker.reset()
      setNotice(null)
    }
    let flaggedNow = false
    while (cursor.current.n < cur.points.length) {
      const before = tracker.status
      const st: LiveStatus = tracker.push(toModel(cur.points[cursor.current.n], f))
      cursor.current.n += 1
      if (before === 'ok' && st !== 'ok') {
        flagged.current.add(cur)
        flaggedNow = true
      }
      // «Te has salido» only while the pen is off the line; a stroke that is back on it stays orange but says nothing.
      if (st !== 'ok') setNotice(st === 'off' && tracker.near ? null : LIVE_TEXT[st])
    }
    if (flaggedNow || flagged.current.has(cur)) setFlaggedView([...flagged.current])
  }

  const evaluate = () => {
    const f = latest.current.fit
    if (!f) return
    const pen = (surface.capture.current?.strokes ?? []).filter((st) => st.pointerType === 'pen')
    // A mouse or finger stroke is not the pen: say so instead of doing nothing.
    if (!pen.length) { setPenHint(true); return }
    const score = scoreCursive(target, pen, f, text)
    setTries(tries + 1)
    setLast(score)
    setBest((b) => (b && !betterScore(score, b) ? b : score))
    onTry?.(score)
    sfx.play(score.stars === 3 ? 'fanfare' : 'star', { volume: 0.6 })
    if (score.stars === 3) {
      const rect = areaRef.current?.getBoundingClientRect()
      celebrate('stars', rect ? { origin: { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight } } : undefined)
    }
  }

  const goTo = (next: Step) => {
    stopCelebrations()
    clearInk()
    setLast(null)
    if (next === 'escribir') writingSince.current = Date.now()
    setStep(next)
  }

  const surface = useInkSurface({
    surfaceRef: areaRef,
    canvasRef,
    enabled: step !== 'mirar' && !last,
    widthScale: 1.5,
    overflow: 0.04,
    role: (t, primary) => pointerRole(t, { penSeen: latest.current.ink.penSeen, mode: 'touch', isPrimary: primary }),
    onResize: setSize,
    callbacks: {
      onStrokeStart() { setPenHint(false) },
      onStrokeEnd(stroke) {
        if (isScribble(stroke, surface.size.current)) return false
        setHasInk(true)
        return true
      },
      onEraseAt() { clearInk() },
      // a pen has been used on this device, so fingers do not write (palm rejection)
      onBlockedWrite() { setPenHint(true) },
      onInk() { if (latest.current.step === 'repasar') liveFeed() },
    },
  })

  const title = step === 'escribir' ? (gender === 'f' ? 'Escribe sola' : 'Escribe solo') : TITLES[step]
  const hint = penHint ? '¡Escribe con el lápiz!'
    : step === 'mirar' ? MIRAR_HINT
      : step === 'repasar' ? (notice ?? REPASAR_HINT)
        : last ? last.tip : ESCRIBIR_HINT
  const areaLabel = step === 'mirar' ? `Modelo de ${text}` : step === 'repasar' ? `Zona para repasar ${text}` : `Zona para escribir ${text}`
  const writing = step !== 'mirar' && fit !== null

  return (
    <div className={clsx(s.root, className)}>
      <header className={s.head}>
        <h3 className={s.title}>{title}</h3>
        <p className={clsx(s.hint, penHint && s.penHint, notice && step === 'repasar' && s.warn)} role="status" aria-live="polite">{hint}</p>
      </header>

      <div className={s.stage}>
        <div ref={areaRef} className={clsx(s.area, last && s.scored)} role="img" aria-label={areaLabel}>
          {step === 'mirar' && (
            <CursiveModel text={text} look="solid" play={play} height={size.height || 240} className={s.model} />
          )}
          {writing && fit && (
            <svg className={s.guides} width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden>
              <line x1={0} x2={size.width} y1={fit.oy + BASELINE * fit.scale} y2={fit.oy + BASELINE * fit.scale} className={s.base} />
              <line x1={0} x2={size.width} y1={fit.oy + XHEIGHT * fit.scale} y2={fit.oy + XHEIGHT * fit.scale} className={s.xline} />
              <line x1={0} x2={size.width} y1={fit.oy + ASCENDER * fit.scale} y2={fit.oy + ASCENDER * fit.scale} className={s.aux} />
              {step === 'repasar' && target.strokes.map((st, i) => <path key={`g${i}`} d={svgPath(st, fit.scale, fit.ox, fit.oy)} className={s.guide} />)}
              {step === 'repasar' && target.strokes.slice(0, target.body).flatMap((st, i) => arrowsOf(st).map((a, k) => {
                const p = toScreen(a, fit)
                return <path key={`a${i}-${k}`} d="M-3.4 -4.6 L4.8 0 L-3.4 4.6 Z" className={s.arrow} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${a.angle.toFixed(1)})`} />
              }))}
              {step === 'repasar' && starts.map((p, i) => {
                const q = toScreen(p, fit)
                return <circle key={`s${i}`} cx={q.x} cy={q.y} r={7} className={s.start} />
              })}
            </svg>
          )}
          <canvas ref={canvasRef} className={s.canvas} aria-hidden />
          {writing && fit && (
            <svg className={s.flags} width={size.width} height={size.height} viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden>
              {flaggedView.map((st, i) => (
                <polyline key={`f${i}`} points={st.points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} className={s.flagged} />
              ))}
            </svg>
          )}
        </div>

        <div className={s.tools}>
          {last && (
            <div className={s.result}>
              <div className={s.stars} role="img" aria-label={`${last.stars} de 3 estrellas`}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={clsx(s.star, n <= last.stars && s.on)} style={{ animationDelay: `${n * 140}ms` }}>
                    <StarIcon filled={n <= last.stars} size={40} />
                  </span>
                ))}
              </div>
              <ul className={s.criteria}>
                {CRITERIA.map((c) => (
                  <li key={c.key} className={clsx(s.crit, last.passed[c.key] ? s.ok : s.no)}>
                    {last.passed[c.key] ? <CheckIcon size={18} /> : <CloseIcon size={18} />}
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step === 'mirar' && (
            <>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => setPlay((p) => p + 1))}>
                <PlayIcon size={26} />
                <span>Mira otra vez</span>
              </button>
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => goTo('repasar'))}>
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>¡A repasar!</span>
              </button>
            </>
          )}

          {step === 'repasar' && (
            <>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(clearInk)} disabled={!hasInk}>
                <EraserIcon size={26} />
                <span>Borrar</span>
              </button>
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => goTo('escribir'))}>
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>¡A escribir!</span>
              </button>
            </>
          )}

          {step === 'escribir' && !last && (
            <>
              <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(clearInk)} disabled={!hasInk}>
                <EraserIcon size={26} />
                <span>Borrar</span>
              </button>
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(evaluate)} disabled={!hasInk}>
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>¡Listo!</span>
              </button>
            </>
          )}

          {step === 'escribir' && last && (
            <>
              {tries < maxTries && (
                <button type="button" className={s.tool} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => { clearInk(); setLast(null) })}>
                  <RedoIcon size={26} />
                  <span>Otra vez</span>
                </button>
              )}
              <button type="button" className={clsx(s.tool, s.done)} onPointerDown={palm.onPointerDown} onClick={palm.guard(() => { if (best) { stopCelebrations(); onDone({ score: best, tries, ms: Math.max(0, Date.now() - writingSince.current) }) } })} disabled={!best}>
                <CheckIcon size={30} strokeWidth={3.2} />
                <span>Siguiente</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
