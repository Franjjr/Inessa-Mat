/* Number visuals: a big line of text for rules and equalities (big-text), and a ruler with ticks where a number is
   marked and can jump to another one (number-line: rounding, mental maths). */
import { motion } from 'motion/react'
import type { VisualProps } from './types'
import { GLIDE, motionT, numParam, stateOf, strParam } from './types'
import { formatNumber, noBreakGroups } from './format'
import s from './visuals.module.css'

/** One or two lines of large text (a rule, an equality), with an optional smaller line under it. */
export function BigTextVisual({ params, reduced }: VisualProps) {
  const text = noBreakGroups(strParam(params, 'text', ''))
  const sub = noBreakGroups(strParam(params, 'sub', ''))
  return (
    <div className={s.stage}>
      <motion.p
        data-testid="big-text"
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={motionT(reduced, GLIDE)}
        style={{ margin: 0, fontSize: 'clamp(1.6rem, 9cqi, 3.6rem)', fontWeight: 700, lineHeight: 1.15, textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--c-ink)' }}
      >
        {text}
      </motion.p>
      {sub && <p className={s.muted} style={{ fontSize: 'var(--fs-md)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

/* The drawing is 340 units wide and shows at about 0.9 of its size on a 360 px phone, so a 17-unit label reads at
   about 15 px. */
const VIEW_W = 340
const VIEW_H = 180
const LINE_Y = 110
const LEFT = 34
const WIDTH = 272
const LABEL_SIZE = 17
/** At most this many tick labels: a denser ruler labels every few ticks. */
const LABELS = 7
/** A ruler never draws more ticks than this (a step of 1 over a long span would flood the picture). */
const MAX_TICKS = 201

/** A ruler with ticks from `from` to `to` every `step`. `mark` highlights a number; `jump` draws an arc from `mark` to
    `mark + jump` (rounding, mental maths). The arc appears on the second phase of its run. */
export function NumberLineVisual({ params, phase, runLength, reduced }: VisualProps) {
  const from = numParam(params, 'from', 0)
  const step = Math.max(1, numParam(params, 'step', 10))
  const to = Math.max(from + step, numParam(params, 'to', from + 100))
  const span = to - from
  const count = Math.min(MAX_TICKS, Math.floor(span / step) + 1)
  const ticks = Array.from({ length: count }, (_, i) => from + i * step)
  const stride = Math.max(1, Math.ceil(count / LABELS))
  const hasMark = params.mark !== undefined
  const mark = numParam(params, 'mark', from)
  const hasJump = hasMark && params.jump !== undefined
  const jump = numParam(params, 'jump', 0)
  const st = stateOf({ phase, runLength })
  const showJump = hasJump && st >= 1
  const x = (v: number) => LEFT + ((v - from) / span) * WIDTH
  const target = mark + jump
  const arcHeight = 24 + Math.min(30, (Math.abs(jump) / span) * 30)
  const arcMid = (x(mark) + x(target)) / 2
  // The jump label sits right of the mark's dashed line, so the line never runs through it.
  const jumpLabelX = Math.max(arcMid, x(mark) + 12)
  return (
    <div className={s.stage}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" style={{ maxWidth: 520 }} role="img" aria-label={`Recta numérica de ${from} a ${to}`} data-testid="number-line">
        <line x1={LEFT} y1={LINE_Y} x2={LEFT + WIDTH} y2={LINE_Y} stroke="var(--c-ink)" strokeWidth={3} strokeLinecap="round" />
        {ticks.map((v, i) => (
          <g key={`t${v}`}>
            <line x1={x(v)} y1={LINE_Y - 8} x2={x(v)} y2={LINE_Y + 8} stroke="var(--c-ink)" strokeWidth={2} />
            {(i % stride === 0 || i === count - 1) && (
              <text x={x(v)} y={LINE_Y + 36} textAnchor="middle" fontSize={LABEL_SIZE} fill="var(--c-ink-soft)">{formatNumber(v)}</text>
            )}
          </g>
        ))}
        {hasMark && (
          <g data-testid="number-line-mark">
            <line x1={x(mark)} y1={40} x2={x(mark)} y2={LINE_Y - 12} stroke="var(--c-magic)" strokeWidth={2} strokeDasharray="4 4" />
            <circle cx={x(mark)} cy={LINE_Y} r={7} fill="var(--c-magic)" />
            <text x={x(mark)} y={32} textAnchor="middle" fontSize={LABEL_SIZE + 1} fontWeight={700} fill="var(--c-magic)">{formatNumber(mark)}</text>
          </g>
        )}
        {showJump && (
          <g data-testid="number-line-jump">
            <motion.path
              d={`M ${x(mark)} ${LINE_Y - 10} Q ${arcMid} ${LINE_Y - 10 - arcHeight * 2} ${x(target)} ${LINE_Y - 10}`}
              fill="none"
              stroke="var(--c-magic)"
              strokeWidth={3}
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={motionT(reduced, GLIDE)}
            />
            <text x={jumpLabelX} y={LINE_Y - 10 - arcHeight - 4} textAnchor={jumpLabelX > arcMid ? 'start' : 'middle'} fontSize={LABEL_SIZE} fontWeight={700} fill="var(--c-magic)">
              {jump >= 0 ? `+${formatNumber(jump)}` : formatNumber(jump)}
            </text>
            <circle cx={x(target)} cy={LINE_Y} r={7} fill="none" stroke="var(--c-magic)" strokeWidth={3} />
          </g>
        )}
      </svg>
      {showJump && (
        <p className={s.eq} data-testid="number-line-target" style={{ fontSize: 'var(--fs-md)' }}>
          {formatNumber(mark)} → {formatNumber(target)}
        </p>
      )}
    </div>
  )
}
