/* Dev helper: a static DigitCell look (CellVisual) with synthetic ink drawn on its canvas. */
import { useLayoutEffect, useRef } from 'react'
import type { InkStroke } from '@/types'
import { CellVisual, type CellPhase, type CellVisualProps } from '../DigitCell'
import { OVERFLOW_RATIO } from '../constants'
import { handwrite } from '../fixtures'
import { renderInk, sizeCanvas, inkColorOf } from '../render'

export interface CellPreviewProps extends Partial<Omit<CellVisualProps, 'phase' | 'digit'>> {
  phase: CellPhase
  digit?: number | null
  /** Digit to draw as ink (defaults to `digit`). */
  inkDigit?: number | null
  partial?: number
  seed?: number
}

export function CellPreview({ phase, digit = null, inkDigit, partial, seed = 3, variant = 'result', place = null, status = 'idle', size = 'md', big = false, unsure = false, ...rest }: CellPreviewProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ink = inkDigit === undefined ? (phase === 'typed' || phase === 'empty' ? null : digit) : inkDigit

  useLayoutEffect(() => {
    const el = surfaceRef.current
    const canvas = canvasRef.current
    if (!el || !canvas) return
    const zone = { width: el.clientWidth, height: el.clientHeight }
    const margin = Math.round(Math.min(zone.width, zone.height) * OVERFLOW_RATIO)
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    sizeCanvas(canvas, zone, margin, dpr)
    canvas.style.left = `${-margin}px`
    canvas.style.top = `${-margin}px`
    let strokes: InkStroke[] = ink == null ? [] : handwrite(ink, { x: 0, y: 0, w: zone.width, h: zone.height }, { seed, fill: 0.78 })
    if (partial != null && strokes.length) {
      const last = strokes[strokes.length - 1]
      strokes = [...strokes.slice(0, -1), { ...last, points: last.points.slice(0, Math.round(last.points.length * partial)) }]
    }
    renderInk(canvas, strokes, { color: inkColorOf(canvas), margin, dpr, zoneHeight: zone.height, widthScale: variant === 'carry' ? 0.8 : 1 })
  }, [ink, partial, seed, variant, size, big])

  return (
    <CellVisual
      {...rest}
      variant={variant}
      place={place}
      status={status}
      size={size}
      big={big}
      phase={phase}
      digit={digit}
      unsure={unsure}
      surfaceRef={surfaceRef}
      canvasRef={canvasRef}
    />
  )
}
