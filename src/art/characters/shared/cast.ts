import type { ReactNode } from 'react'
import type { Pose } from '@/types'
import type { HeadBox } from './extras'
import type { Expression, MotionKind, Posture } from './pose'

export interface CastRenderProps {
  pose: Pose
  expr: Expression
  posture: Posture
  animated: boolean
  /** Unique id prefix for clipPaths/gradients (several instances can share a page). */
  uid: string
  /** Animation phase offset in seconds (desyncs blinking). */
  delay: number
}

export interface CastDef {
  /** Spanish accessible name. */
  label: string
  /** Head circle used to place pose decorations (sparkles, zzz, sweat...). */
  head: HeadBox
  /** Floats instead of standing (adds a gentle hover loop). */
  float?: boolean
  /** Per-pose body motion overrides. */
  motion?: Partial<Record<Pose, MotionKind>>
  render: (p: CastRenderProps) => ReactNode
}
