/* Time visuals (tiempo): the analogue clock (clock), with the digital time «hh:mm» next to it when asked, and a time line
   (timeline): a bar from a start to an end on an hour line, with both times and the duration written. The clock draws
   with the same face as the clock exercises (the shared styles of views/clock.module.css). Static pictures: reduced
   motion changes nothing. */
import { durationWords, pad2 } from '@/engine'
import c from '@/activities/views/clock.module.css'
import type { VisualProps } from './types'
import { numParam } from './types'
import s from './visuals.module.css'

const CX = 100
const CY = 100
const point = (deg: number, r: number) => ({ x: CX + r * Math.sin((deg * Math.PI) / 180), y: CY - r * Math.cos((deg * Math.PI) / 180) })

/** Hand angles in degrees from the 12: the minute hand at m × 6°, the hour hand at the face hour plus half a degree a minute. */
export function handAngles(h: number, m: number): { hour: number; minute: number } {
  return { hour: (h % 12) * 30 + m * 0.5, minute: m * 6 }
}

const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.floor(v)))

/** A 24 h time as «hh:mm». */
const hhmm = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`

export function ClockVisual({ params }: VisualProps) {
  const h = clampInt(numParam(params, 'h', 0), 0, 23)
  const m = clampInt(numParam(params, 'm', 0), 0, 59)
  const digital = numParam(params, 'digital', 0) === 1
  const time = hhmm(h, m)
  const angles = handAngles(h, m)
  const hourTip = point(angles.hour, 50)
  const minuteTip = point(angles.minute, 72)

  return (
    <div className={s.stage}>
      <div className={s.clockRow}>
        <svg viewBox="0 0 200 200" className={s.clockFace} role="img" aria-label={`Reloj: ${time}`} data-testid="clock">
          <circle cx={CX} cy={CY} r={94} className={c.dial} />
          {Array.from({ length: 60 }, (_, i) => {
            const big = i % 5 === 0
            const outer = point(i * 6, 92)
            const inner = point(i * 6, big ? 80 : 86)
            return <line key={i} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} className={big ? c.tickBig : c.tickSmall} />
          })}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
            const p = point(n * 30, 66)
            return <text key={n} x={p.x} y={p.y} className={c.num} textAnchor="middle" dominantBaseline="central">{n}</text>
          })}
          <line x1={CX} y1={CY} x2={hourTip.x} y2={hourTip.y} className={c.hourHand} data-hand="hour" />
          <line x1={CX} y1={CY} x2={minuteTip.x} y2={minuteTip.y} className={c.minuteHand} data-hand="minute" />
          <circle cx={CX} cy={CY} r={6} className={c.hub} />
        </svg>
        {digital && <p className={s.digitalTime} data-testid="clock-digital">{time}</p>}
      </div>
    </div>
  )
}

/* The line is 340 units wide. The window is whole hours around the two times, so a short duration is short on the
   line too. The times sit above their marks and the duration under the bar, so none of them overlap. */
const VIEW_W = 340
const VIEW_H = 140
const X0 = 76
const X1 = 264
const LINE_Y = 80

export function TimelineVisual({ params }: VisualProps) {
  const start = clampInt(numParam(params, 'start', 540), 0, 1439)
  const end = Math.max(start, clampInt(numParam(params, 'end', start + 60), 0, 1439))
  const from = Math.floor(start / 60) * 60
  let to = Math.ceil(end / 60) * 60
  if (to === from) to += 60
  const x = (t: number) => X0 + ((t - from) / (to - from)) * (X1 - X0)
  const xs = x(start)
  const xe = x(end)
  const hours: number[] = []
  for (let t = from; t <= to; t += 60) hours.push(t)
  const clock = (t: number) => hhmm(Math.floor(t / 60), t % 60)
  const duration = durationWords(end - start)

  return (
    <div className={s.stage}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={s.timeline}
        role="img"
        aria-label={`De las ${clock(start)} a las ${clock(end)}: ${duration}`}
        data-testid="timeline"
      >
        <line x1={X0} y1={LINE_Y} x2={X1} y2={LINE_Y} className={s.timeAxis} />
        {hours.map((t) => (
          <line key={t} x1={x(t)} y1={LINE_Y - 8} x2={x(t)} y2={LINE_Y + 8} className={s.timeTick} />
        ))}
        <rect x={xs} y={LINE_Y - 6} width={Math.max(0, xe - xs)} height={12} rx={6} className={s.timeBar} data-testid="timeline-bar" />
        <circle cx={xs} cy={LINE_Y} r={9} className={s.timeMark} />
        <circle cx={xe} cy={LINE_Y} r={9} className={s.timeMark} />
        <text x={xs - 8} y={46} textAnchor="end" className={s.timeLabel}>{clock(start)}</text>
        <text x={xe + 8} y={46} textAnchor="start" className={s.timeLabel}>{clock(end)}</text>
        <text x={(xs + xe) / 2} y={122} textAnchor="middle" className={s.timeDuration}>{duration}</text>
      </svg>
    </div>
  )
}
