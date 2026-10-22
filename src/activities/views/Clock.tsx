/* The analogue clock shared by the tiempo views. The face has no digital readout: while the child sets the hands
   nothing shows the time they make (no live text). Hands are dragged with pointer events (Pencil and finger), and the
   +/− buttons are the accessible path. The minute hand snaps to the 5-minute marks; the hour hand is kept consistent
   with the minutes (at 3:20 it sits a third of the way from the 3 to the 4), so the child moves it to the nearest hour
   and never has to aim it to the minute. */
import clsx from 'clsx'
import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { NumberInput } from '@/ink'
import s from './clock.module.css'

/** A time on the face: hour 1..12 (12 = the 12 of the clock), minute 0..59 (set in fives when dragged). */
export interface FaceTime { hour: number; minute: number }

/** Angle in degrees, clockwise from the 12, for a vector on the screen (y grows downwards). */
export function angleOf(dx: number, dy: number): number {
  const a = (Math.atan2(dx, -dy) * 180) / Math.PI
  return (a + 360) % 360
}

/** The minute under a hand angle, snapped to the 5-minute marks. */
export function minuteFromAngle(deg: number): number {
  return (Math.round(deg / 30) * 5) % 60
}

/** The hour under the hour hand, given the minutes (the hour hand is offset by half a degree per minute). */
export function hourFromAngle(deg: number, minute: number): number {
  const h = Math.round((deg - minute * 0.5) / 30)
  const r = ((h % 12) + 12) % 12
  return r === 0 ? 12 : r
}

/** Hand angles for a face time: the hour hand moves with the minutes. */
export function handAngles(t: FaceTime): { hour: number; minute: number } {
  return { hour: (t.hour % 12) * 30 + t.minute * 0.5, minute: t.minute * 6 }
}

const CX = 100
const CY = 100
const point = (deg: number, r: number) => ({ x: CX + r * Math.sin((deg * Math.PI) / 180), y: CY - r * Math.cos((deg * Math.PI) / 180) })

/** Which hand is nearer to the pointer (by angle), so a drag grabs the one the child touched. */
function handNear(pointerDeg: number, t: FaceTime): 'hour' | 'minute' {
  const a = handAngles(t)
  const dist = (x: number, y: number) => {
    const d = Math.abs(x - y) % 360
    return Math.min(d, 360 - d)
  }
  return dist(pointerDeg, a.minute) <= dist(pointerDeg, a.hour) ? 'minute' : 'hour'
}

export interface ClockFaceProps {
  time: FaceTime
  /** Without onChange the face only shows the hands (reading). */
  onChange?: (t: FaceTime) => void
  label: string
  /** Hide the numbers 1–12 (a child who must count the marks). Default: shown. */
  numbers?: boolean
}

export function ClockFace({ time, onChange, label, numbers = true }: ClockFaceProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const grab = useRef<'hour' | 'minute' | null>(null)
  const interactive = !!onChange
  const hands = handAngles(time)

  const aim = (e: ReactPointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect()
    if (!box) return null
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    return { deg: angleOf(dx, dy), dist: Math.hypot(dx, dy) }
  }

  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!onChange) return
    const p = aim(e)
    if (!p) return
    grab.current = p.dist < 14 ? 'minute' : handNear(p.deg, time)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    move(e)
  }

  const move = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!onChange || !grab.current) return
    const p = aim(e)
    if (!p) return
    if (grab.current === 'minute') {
      onChange({ hour: time.hour, minute: minuteFromAngle(p.deg) })
    } else {
      onChange({ hour: hourFromAngle(p.deg, time.minute), minute: time.minute })
    }
  }

  const up = () => { grab.current = null }

  const ticks = Array.from({ length: 60 }, (_, i) => i)
  const hourTip = point(hands.hour, 50)
  const minuteTip = point(hands.minute, 72)

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      className={clsx(s.face, interactive && s.interactive)}
      role={interactive ? 'group' : 'img'}
      aria-label={label}
      data-interactive={interactive ? 'true' : undefined}
      onPointerDown={onDown}
      onPointerMove={(e) => { if (grab.current) move(e) }}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <circle cx={CX} cy={CY} r={94} className={s.dial} />
      {ticks.map((i) => {
        const big = i % 5 === 0
        const a = i * 6
        const outer = point(a, 92)
        const inner = point(a, big ? 80 : 86)
        return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className={big ? s.tickBig : s.tickSmall} />
      })}
      {numbers && Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
        const p = point(n * 30, 66)
        return <text key={n} x={p.x} y={p.y} className={s.num} textAnchor="middle" dominantBaseline="central">{n}</text>
      })}
      <line x1={CX} y1={CY} x2={hourTip.x} y2={hourTip.y} className={s.hourHand} data-hand="hour" />
      <line x1={CX} y1={CY} x2={minuteTip.x} y2={minuteTip.y} className={s.minuteHand} data-hand="minute" />
      {interactive && (
        <>
          <circle cx={hourTip.x} cy={hourTip.y} r={9} className={s.handle} />
          <circle cx={minuteTip.x} cy={minuteTip.y} r={9} className={s.handle} />
        </>
      )}
      <circle cx={CX} cy={CY} r={6} className={s.hub} />
    </svg>
  )
}

/** Minus and plus buttons for the hour and the minutes: the path for keyboards and switch access. No readout. */
export function TimeSteppers({ time, onChange }: { time: FaceTime; onChange: (t: FaceTime) => void }) {
  const hourStep = (d: number) => onChange({ hour: ((time.hour - 1 + d + 12) % 12) + 1, minute: time.minute })
  const minuteStep = (d: number) => onChange({ hour: time.hour, minute: (time.minute + d + 60) % 60 })
  return (
    <div className={s.steppers} role="group" aria-label="Ajustar con botones">
      <div className={s.stepRow}>
        <span className={s.stepLabel}>Aguja corta (hora)</span>
        <button type="button" className={s.stepBtn} onClick={() => hourStep(-1)} aria-label="Una hora menos">−</button>
        <button type="button" className={s.stepBtn} onClick={() => hourStep(1)} aria-label="Una hora más">+</button>
      </div>
      <div className={s.stepRow}>
        <span className={s.stepLabel}>Aguja larga (minutos)</span>
        <button type="button" className={s.stepBtn} onClick={() => minuteStep(-5)} aria-label="Cinco minutos menos">−</button>
        <button type="button" className={s.stepBtn} onClick={() => minuteStep(5)} aria-label="Cinco minutos más">+</button>
      </div>
    </div>
  )
}

/** The answer as two boxes, hour and minutes, written with the handwriting pad (NumberInput). */
export function TimeFields({ hour, minute, onHour, onMinute, status, onSubmit, autoFocus }: {
  hour: number | null
  minute: number | null
  onHour: (v: number | null) => void
  onMinute: (v: number | null) => void
  status: 'idle' | 'correct' | 'wrong'
  onSubmit: (h: number | null, m: number | null) => void
  autoFocus?: boolean
}) {
  return (
    <div className={s.fields} role="group" aria-label="Hora y minutos">
      <div className={s.field}>
        <span className={s.fieldLabel}>Hora</span>
        <NumberInput
          value={hour}
          onChange={onHour}
          onSubmit={(v) => onHour(v)}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Hora"
          placeholder="?"
          autoFocus={autoFocus}
          keypadToggle={false}
        />
      </div>
      <span className={s.colon} aria-hidden>:</span>
      <div className={s.field}>
        <span className={s.fieldLabel}>Minutos</span>
        <NumberInput
          value={minute}
          onChange={onMinute}
          onSubmit={(v) => onSubmit(hour, v)}
          maxDigits={2}
          size="lg"
          status={status}
          ariaLabel="Minutos"
          placeholder="?"
          keypadToggle={false}
        />
      </div>
    </div>
  )
}

/** Capital first letter, for phrases shown as titles («las tres y veinte» → «Las tres y veinte»). */
export const capitalize = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t)
