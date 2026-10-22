/* <CalibrationFlow childId companionName onDone> — "Enséñale a {companionName} cómo escribes los números".
   The child writes each digit 1…9, 0 twice next to a school model; every sample is stored (source
   'calibration') and pushed to the recogniser so it learns this child's handwriting. Progress, skip, and a
   celebration at the end. */
import clsx from 'clsx'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CompanionSpecies, DigitRecognition } from '@/types'
import { useActiveChild } from '@/data'
import { CompanionArt } from '@/art'
import { haptics, sfx } from '@/audio'
import { celebrate } from '@/fx'
import { Button } from '@/ui'
import { IDLE_MS_SLOW } from './constants'
import { loadRecognizer, useInk } from './context'
import { isScribble, strokesBBox } from './geometry'
import { pointerRole } from './policy'
import { useInkSurface } from './useInkSurface'
import { ModelDigit } from './ModelDigit'
import { EraserIcon } from './icons'
import s from './CalibrationFlow.module.css'

export interface CalibrationFlowProps {
  childId: string
  companionName: string
  onDone: () => void
  /** Times each digit is written (default 2). */
  repeats?: number
}

const SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
const PRAISE = ['¡Genial!', '¡Qué bonito!', '¡Ya lo tengo!', '¡Me encanta!', '¡Muy bien!', '¡Toma ya!']

export function CalibrationFlow({ childId, companionName, onDone, repeats = 2 }: CalibrationFlowProps) {
  const ink = useInk()
  const { child } = useActiveChild()
  const companion = child && child.id === childId ? child.companion : null
  const species: CompanionSpecies = companion?.species ?? 'cat'

  const total = SEQUENCE.length * repeats
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const [hasInk, setHasInk] = useState(false)
  const [finished, setFinished] = useState(false)
  const padRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ ink, step, childId })
  useLayoutEffect(() => { latest.current = { ink, step, childId } })

  const digit = SEQUENCE[Math.floor(step / repeats) % SEQUENCE.length]
  const rep = step % repeats
  const prompt = rep === 0 ? `¡Escribe el ${digit}!` : `¡Otra vez el ${digit}!`

  const clearTimers = () => {
    if (idle.current) clearTimeout(idle.current)
    if (advance.current) clearTimeout(advance.current)
    idle.current = advance.current = null
  }

  const clearPad = () => {
    if (idle.current) clearTimeout(idle.current)
    idle.current = null
    surface.capture.current?.clear()
    setHasInk(false)
  }

  const capture = () => {
    idle.current = null
    const strokes = surface.capture.current?.strokes ?? []
    const zone = surface.size.current
    const b = strokesBBox(strokes)
    if (!b) return
    if (b.height < zone.height * 0.22 && b.width < zone.width * 0.22) {
      setBubble('Hazlo un poco más grande, porfa.')
      sfx.play('hint', { volume: 0.4 })
      advance.current = setTimeout(() => { clearPad(); setBubble(null) }, 1100)
      return
    }
    const { ink: ctx, step: current } = latest.current
    const target = SEQUENCE[Math.floor(current / repeats) % SEQUENCE.length]
    if (ctx.ready && ctx.recognizer) {
      let rec: DigitRecognition | null = null
      try { rec = ctx.recognizer.recognize(strokes, zone) } catch (err) { console.warn('[ink] calibration recognition failed', err) }
      if (rec) ctx.learning.calibration(target, rec)
    }
    setSaved(true)
    setBubble(PRAISE[(current * 7 + target) % PRAISE.length])
    sfx.play('sparkle', { volume: 0.5 })
    haptics.success()
    advance.current = setTimeout(() => {
      clearPad()
      setSaved(false)
      setBubble(null)
      if (current + 1 >= total) {
        setFinished(true)
        sfx.play('fanfare', { volume: 0.7 })
        celebrate('stars')
      } else {
        setStep(current + 1)
      }
    }, 750)
  }

  const surface = useInkSurface({
    surfaceRef: padRef,
    canvasRef,
    enabled: !saved && !finished,
    widthScale: 1.15,
    overflow: 0.06,
    role: (t, primary) => pointerRole(t, { penSeen: latest.current.ink.penSeen, mode: 'touch', isPrimary: primary }),
    callbacks: {
      onStrokeStart() { if (idle.current) clearTimeout(idle.current); idle.current = null; setBubble(null) },
      onStrokeEnd(stroke) {
        if (isScribble(stroke, surface.size.current)) { clearPad(); return false }
        setHasInk(true)
        idle.current = setTimeout(capture, IDLE_MS_SLOW)
        return true
      },
      onEraseAt() { clearPad() },
    },
  })

  // Calibration is only useful once the model can produce embeddings; make sure it is loading.
  useEffect(() => { if (ink.recognizer) loadRecognizer(ink.recognizer) }, [ink.recognizer])
  useEffect(() => () => clearTimers(), [])

  if (finished) return <CalibrationDone companionName={companionName} species={species} companion={companion} onDone={onDone} />

  return (
    <div className={s.root}>
      <header className={s.head}>
        <h2 className={s.title}>Enséñale a {companionName} cómo escribes los números</h2>
        <p className={s.subtitle}>Escribe cada número {repeats === 2 ? 'dos veces' : `${repeats} veces`}, con tu letra de siempre.</p>
      </header>

      <div className={s.stage}>
        <div className={s.buddy}>
          <div className={clsx(s.bubble, saved && s.bubbleHappy)} aria-live="polite">{bubble ?? prompt}</div>
          <CompanionArt species={species} colorway={companion?.colorway} equipped={companion?.equipped} pose={saved ? 'happy' : 'think'} size={170} />
        </div>

        <div className={s.model} aria-hidden>
          <span className={s.modelLabel}>Así</span>
          <ModelDigit key={digit} digit={digit} look="solid" height={210} play={1} showArrows />
        </div>

        <div className={s.padCol}>
          <div
            ref={padRef}
            className={clsx(s.pad, saved && s.saved)}
            role="img"
            aria-label={`Escribe aquí el número ${digit}`}
          >
            <span className={s.lineTop} aria-hidden />
            <span className={s.lineBase} aria-hidden />
            <canvas ref={canvasRef} className={s.canvas} aria-hidden />
            {saved && <span className={s.tick} aria-hidden>✓</span>}
          </div>
          <button type="button" className={s.clear} onClick={clearPad} disabled={!hasInk || saved} aria-label="Borrar">
            <EraserIcon size={24} />
            <span>Borrar</span>
          </button>
        </div>
      </div>

      <footer className={s.foot}>
        <ol className={s.progress} aria-label={`Número ${Math.min(step + 1, total)} de ${total}`}>
          {SEQUENCE.map((d, i) => {
            const done = Math.min(repeats, Math.max(0, step - i * repeats))
            const isCurrent = Math.floor(step / repeats) === i
            return (
              <li key={d} className={clsx(s.pill, isCurrent && s.pillCurrent, done >= repeats && s.pillDone)}>
                <span className={s.pillDigit}>{d}</span>
                <span className={s.dots} aria-hidden>
                  {Array.from({ length: repeats }, (_, k) => <i key={k} className={clsx(s.dot, k < done && s.dotOn)} />)}
                </span>
              </li>
            )
          })}
        </ol>
        <Button variant="ghost" onClick={() => { clearTimers(); onDone() }}>Saltar</Button>
      </footer>
    </div>
  )
}

/** Final celebration screen of the calibration. */
export function CalibrationDone({ companionName, species, companion, onDone }: {
  companionName: string
  species: CompanionSpecies
  companion?: { colorway?: string; equipped?: string[] } | null
  onDone: () => void
}) {
  return (
    <div className={clsx(s.root, s.finale)}>
      <div className={s.finaleArt}>
        <CompanionArt species={species} colorway={companion?.colorway} equipped={companion?.equipped} pose="cheer" size={220} />
      </div>
      <h2 className={s.finaleTitle}>¡{companionName} ya conoce tu letra!</h2>
      <p className={s.finaleText}>Ahora entenderá mucho mejor los números que escribas.</p>
      <Button variant="success" size="lg" onClick={onDone} autoFocus>¡Vamos!</Button>
    </div>
  )
}
