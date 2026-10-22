/* Pose → expression + posture tables shared by every character and companion.
   Characters read these to choose eyes / brows / mouth / extras and limb angles, so every Pose
   is supported consistently across the cast. */
import type { Pose } from '@/types'

export const POSES: readonly Pose[] = [
  'idle', 'talk', 'happy', 'cheer', 'sad', 'worried', 'scared', 'think', 'surprised', 'sleep',
] as const

export type EyeKind = 'open' | 'happy' | 'closed' | 'wide' | 'look' | 'teary'
export type MouthKind = 'smile' | 'talk' | 'grin' | 'frown' | 'wobble' | 'o' | 'eek' | 'hmm' | 'snore' | 'smirk'
export type BrowKind = 'none' | 'raised' | 'worried' | 'think' | 'mischief'
export type ExtraKind = 'sparkles' | 'bigSparkles' | 'tear' | 'sweat' | 'zzz' | 'think' | 'surprise' | 'shiver'
/** Limb gesture. Angles are resolved per character (see armAngle). */
export type ArmKind = 'down' | 'in' | 'out' | 'up' | 'spread' | 'talk' | 'chest' | 'face' | 'chin'
export type EarKind = 'up' | 'perk' | 'droop' | 'flat'
export type MotionKind = 'none' | 'bounce' | 'hop' | 'shiver' | 'jolt' | 'droop'

export interface Expression {
  eyes: EyeKind
  mouth: MouthKind
  brows: BrowKind
  /** Cheek intensity. */
  blush: 'soft' | 'glow'
  extras: ExtraKind[]
}

export interface Posture {
  /** Viewer-left and viewer-right arm gestures. */
  armL: ArmKind
  armR: ArmKind
  /** Head tilt in degrees (positive = clockwise, i.e. toward viewer-right). */
  head: number
  /** Vertical slump of the upper body in px (positive = lower). */
  slump: number
  ears: EarKind
  motion: MotionKind
  /** Slow breathing (sleep). */
  slowBreath: boolean
  /** Eyes blink in this pose. */
  blinks: boolean
}

const EXPRESSIONS: Record<Pose, Expression> = {
  idle: { eyes: 'open', mouth: 'smile', brows: 'none', blush: 'soft', extras: [] },
  talk: { eyes: 'open', mouth: 'talk', brows: 'none', blush: 'soft', extras: [] },
  happy: { eyes: 'happy', mouth: 'grin', brows: 'none', blush: 'glow', extras: ['sparkles'] },
  cheer: { eyes: 'happy', mouth: 'grin', brows: 'none', blush: 'glow', extras: ['bigSparkles'] },
  sad: { eyes: 'teary', mouth: 'frown', brows: 'worried', blush: 'soft', extras: ['tear'] },
  worried: { eyes: 'open', mouth: 'wobble', brows: 'worried', blush: 'soft', extras: ['sweat'] },
  scared: { eyes: 'wide', mouth: 'eek', brows: 'worried', blush: 'soft', extras: ['sweat', 'shiver'] },
  think: { eyes: 'look', mouth: 'hmm', brows: 'think', blush: 'soft', extras: ['think'] },
  surprised: { eyes: 'wide', mouth: 'o', brows: 'raised', blush: 'soft', extras: ['surprise'] },
  sleep: { eyes: 'closed', mouth: 'snore', brows: 'none', blush: 'soft', extras: ['zzz'] },
}

const POSTURES: Record<Pose, Posture> = {
  idle: { armL: 'down', armR: 'down', head: 0, slump: 0, ears: 'up', motion: 'none', slowBreath: false, blinks: true },
  talk: { armL: 'down', armR: 'talk', head: -2, slump: 0, ears: 'up', motion: 'none', slowBreath: false, blinks: true },
  happy: { armL: 'out', armR: 'out', head: 0, slump: 0, ears: 'perk', motion: 'bounce', slowBreath: false, blinks: false },
  cheer: { armL: 'up', armR: 'up', head: -3, slump: -2, ears: 'perk', motion: 'hop', slowBreath: false, blinks: false },
  sad: { armL: 'in', armR: 'in', head: 6, slump: 3, ears: 'droop', motion: 'droop', slowBreath: true, blinks: true },
  worried: { armL: 'chest', armR: 'chest', head: 3, slump: 1, ears: 'droop', motion: 'none', slowBreath: false, blinks: true },
  scared: { armL: 'face', armR: 'face', head: 0, slump: 2, ears: 'flat', motion: 'shiver', slowBreath: false, blinks: false },
  think: { armL: 'chin', armR: 'down', head: -6, slump: 0, ears: 'up', motion: 'none', slowBreath: false, blinks: true },
  surprised: { armL: 'spread', armR: 'spread', head: 0, slump: -2, ears: 'perk', motion: 'jolt', slowBreath: false, blinks: false },
  sleep: { armL: 'in', armR: 'in', head: 8, slump: 3, ears: 'droop', motion: 'none', slowBreath: true, blinks: false },
}

export function isPose(p: unknown): p is Pose {
  return typeof p === 'string' && (POSES as readonly string[]).includes(p)
}

/** Unknown poses fall back to idle (content data may be newer than the art). */
export function normalizePose(p: unknown): Pose {
  return isPose(p) ? p : 'idle'
}

export function expressionFor(pose: Pose): Expression {
  return EXPRESSIONS[pose] ?? EXPRESSIONS.idle
}

export function postureFor(pose: Pose): Posture {
  return POSTURES[pose] ?? POSTURES.idle
}

/** Default arm angles (deg) for the viewer-left arm: positive = outward. Mirror for the right arm. */
export const DEFAULT_ARM_ANGLES: Record<ArmKind, number> = {
  down: 8,
  in: -4,
  out: 62,
  up: 152,
  spread: 108,
  talk: 72,
  chest: -42,
  face: -148,
  chin: -150,
}

export type ArmTable = Partial<Record<ArmKind, number>>

/** Rotation for an arm. side = -1 for the viewer-left arm, +1 for the viewer-right arm. */
export function armAngle(kind: ArmKind, side: -1 | 1, table?: ArmTable): number {
  const a = table?.[kind] ?? DEFAULT_ARM_ANGLES[kind]
  return side === -1 ? a : -a
}

export const EAR_ANGLES: Record<EarKind, number> = { up: 0, perk: -6, droop: 26, flat: 40 }

/** Small deterministic hash so several characters on screen do not blink in sync. */
export function phase(seed: string, spread = 3): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000 * spread
}
