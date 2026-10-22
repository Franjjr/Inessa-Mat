/* SVG building blocks shared by characters and companions. */
import clsx from 'clsx'
import type { CSSProperties, ReactNode } from 'react'
import s from './anim.module.css'
import type { MotionKind } from './pose'

export const VIEWBOX = '0 0 200 200'
/** Main outline width in viewBox units (consistent line weight across the cast). */
export const SW = 5
/** Inner detail line width. */
export const SW_DETAIL = 3.6
/** Fine detail (patterns, sparkle lines). */
export const SW_FINE = 2.4
/** Ground line where feet rest. */
export const GROUND = 194

const MOTION_CLASS: Record<MotionKind, string | undefined> = {
  none: undefined,
  bounce: s.bounce,
  hop: s.hop,
  shiver: s.shiver,
  jolt: s.jolt,
  droop: s.droop,
}

export interface ArtFrameProps {
  size: number
  flip: boolean
  animated: boolean
  motion: MotionKind
  /** Idle floating instead of standing (fairy, Borrón, ladybug). */
  float?: boolean
  label: string
  className?: string
  /** Data attributes for tests / integrators. */
  data: Record<string, string>
  /** Art drawn in the (possibly mirrored) body layer. */
  children: ReactNode
  /** Decorations drawn after the body, never mirrored (they mirror their own positions). */
  overlay?: ReactNode
  /** Pose key: changing it replays one-shot motions (jolt). */
  poseKey: string
}

export function ArtFrame({ size, flip, animated, motion, float, label, className, data, children, overlay, poseKey }: ArtFrameProps) {
  const dataAttrs: Record<string, string> = {}
  for (const [k, v] of Object.entries(data)) dataAttrs[`data-${k}`] = v
  return (
    <svg
      viewBox={VIEWBOX}
      width={size}
      height={size}
      className={clsx(s.root, animated && s.animated, className)}
      role="img"
      aria-label={label}
      overflow="visible"
      data-animated={animated ? 'true' : 'false'}
      data-flip={flip ? 'true' : 'false'}
      {...dataAttrs}
    >
      <g className={float ? s.float : undefined}>
        <g key={motion === 'jolt' ? poseKey : 'm'} className={MOTION_CLASS[motion]} style={{ transformOrigin: `100px ${GROUND}px` }}>
          <g transform={flip ? 'translate(200 0) scale(-1 1)' : undefined}>{children}</g>
          {overlay}
        </g>
      </g>
    </svg>
  )
}

/** A rotating part (arm, head, ear, tail) that glides between poses. */
export function Limb({ x, y, angle, children, className, style }: { x: number; y: number; angle: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <g className={clsx(s.limb, className)} style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${x}px ${y}px`, ...style }}>
      {children}
    </g>
  )
}

/** A vertical shift that glides between poses (slumps, lifts). */
export function Shift({ dx = 0, dy = 0, children }: { dx?: number; dy?: number; children: ReactNode }) {
  return (
    <g className={s.limb} style={{ transform: `translate(${dx}px, ${dy}px)` }}>
      {children}
    </g>
  )
}

/** A looping animation wrapper with a pivot (wag, wave, flap, juggle...). */
export function Loop({ cls, x, y, on, delay, children, self }: { cls: string; x?: number; y?: number; on: boolean; delay?: number; children: ReactNode; self?: boolean }) {
  return (
    <g
      className={on ? clsx(cls, self && s.self) : undefined}
      style={x !== undefined && y !== undefined ? { transformOrigin: `${x}px ${y}px`, animationDelay: delay ? `${delay}s` : undefined } : { animationDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </g>
  )
}

/**
 * Draws a set of shapes as ONE silhouette with a clean outer outline (no inner seams):
 * thick strokes first, then fills on top. Children must not set their own fill/stroke.
 */
export function Silhouette({ fill, ink, w = SW, children }: { fill: string; ink: string; w?: number; children: ReactNode }) {
  return (
    <>
      <g fill={ink} stroke={ink} strokeWidth={w * 2} strokeLinejoin="round" strokeLinecap="round">
        {children}
      </g>
      <g fill={fill}>{children}</g>
    </>
  )
}

/** Common stroke props for outlined shapes. */
export function ol(ink: string, w: number = SW) {
  return { stroke: ink, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
}

export { s as anim }
