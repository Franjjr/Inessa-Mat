/* Shared contract of every lesson visual (see ./index.tsx for the registry). */
import type { Transition } from 'motion/react'
import type { LessonVisualId } from '@/types'

export type LessonParams = Record<string, number | string>

export interface VisualProps {
  /** Params of the lesson step (see src/types/content.ts LessonVisualId). Always defined, may be empty. */
  params: LessonParams
  /** 0-based position of this step inside its run (consecutive steps that share visual and params). */
  phase: number
  /** Number of consecutive steps in the run. */
  runLength: number
  /** prefers-reduced-motion: every animation is skipped and each phase shows its end state. */
  reduced: boolean
}

/** Phase value used for a run of one step: such a visual shows its complete end state. */
export const FINAL = 99

/** The state a visual should draw: its phase, or FINAL when the step stands alone. */
export function stateOf(p: Pick<VisualProps, 'phase' | 'runLength'>): number {
  return p.runLength <= 1 ? FINAL : p.phase
}

/** The last state of a run (FINAL for a single step). */
export function lastStateOf(p: Pick<VisualProps, 'runLength'>): number {
  return p.runLength <= 1 ? FINAL : p.runLength - 1
}

export function numParam(params: LessonParams, key: string, fallback: number): number {
  const v = params[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function strParam(params: LessonParams, key: string, fallback: string): string {
  const v = params[key]
  return typeof v === 'string' && v.length > 0 ? v : fallback
}

/** Animation timing that collapses to an instant change when the user prefers reduced motion. */
export function motionT(reduced: boolean, t: Transition): Transition {
  return reduced ? { duration: 0 } : t
}

/** Springy "pop" used for numbers and pieces appearing. */
export const POP: Transition = { type: 'spring', stiffness: 420, damping: 24 }
export const GLIDE: Transition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] }

/** Digits of a non-negative integer, units first (index 0 = units). */
export function digitsLE(n: number): number[] {
  const out: number[] = []
  let v = Math.max(0, Math.floor(n))
  do {
    out.push(v % 10)
    v = Math.floor(v / 10)
  } while (v > 0)
  return out
}

/** Pads digits (units first) with zeros up to `length`. */
export function padLE(digits: number[], length: number): number[] {
  const out = digits.slice()
  while (out.length < length) out.push(0)
  return out
}

export type VisualRegistry = Record<LessonVisualId, React.ComponentType<VisualProps>>
