import type { ReactNode } from 'react'
import type { Pose } from '@/types'
import type { FaceGeom } from '../characters/shared/face'
import type { ArmTable, Expression, Posture } from '../characters/shared/pose'

/** The four colourways every species supports. */
export const COLORWAYS = ['default', 'sunny', 'berry', 'mint'] as const
export type Colorway = (typeof COLORWAYS)[number]

/** Friendly aliases (older data / other modules) mapped onto the real colourways. */
const ALIASES: Record<string, Colorway> = {
  pink: 'berry', purple: 'berry', lilac: 'berry', rose: 'berry',
  gold: 'sunny', yellow: 'sunny', orange: 'sunny', golden: 'sunny',
  blue: 'mint', green: 'mint', teal: 'mint', aqua: 'mint',
}

export function normalizeColorway(c: unknown): Colorway {
  if (typeof c !== 'string') return 'default'
  if ((COLORWAYS as readonly string[]).includes(c)) return c as Colorway
  return ALIASES[c] ?? 'default'
}

export interface Palette {
  /** Main fur / skin. */
  fur: string
  /** Outline (darker shade of the fur). */
  ink: string
  /** Belly / muzzle / face mask. */
  light: string
  /** Inner ears. */
  inner: string
  /** Nose / beak. */
  nose: string
  /** Species marking: stripes, patches, ear tips, horns, feet... */
  mark: string
  /** Darker shade of the marking (outline for marked parts). */
  markInk?: string
  /** Eye colour. */
  eye: string
  cheek?: string
  /** Mane colours (unicorn) or spare accents. */
  mane?: [string, string, string]
}

export interface Anchors {
  /** Base centre of a hat and its base width. */
  headTop: { x: number; y: number; w: number; r?: number }
  /** Midpoint between the eyes and the distance between eye centres. */
  eyes: { x: number; y: number; span: number }
  /** Centre of the neck line and its width. */
  neck: { x: number; y: number; w: number }
  /** Shoulder-line centre behind the body (capes, wings, backpacks). */
  back: { x: number; y: number; w: number }
  /** Scale of held items. */
  hand: { s: number }
}

export interface ChibiCtx {
  p: Palette
  pose: Pose
  expr: Expression
  posture: Posture
  animated: boolean
  /** Ear rotation for the viewer-left ear (mirror for the right one). */
  ear: number
  uid: string
}

export interface SpeciesDef {
  /** Spanish accessible name. */
  label: string
  palettes: Record<Colorway, Palette>
  anchors: Anchors
  head?: { cx: number; cy: number; rx: number; ry: number }
  body?: { cx: number; cy: number; rx: number; ry: number }
  /** Arm pivots (viewer-left), mirrored for the right arm. */
  arm?: { x: number; y: number; d?: string; hand?: [number, number]; table?: ArmTable; fill?: (p: Palette) => string }
  face: (p: Palette) => FaceGeom
  /** Multiplier for ear angles (long ears droop more). */
  earGain?: number
  /** Behind the body: tail, wings. */
  behind?: (c: ChibiCtx) => ReactNode
  feet?: (c: ChibiCtx) => ReactNode
  bodyFill?: (p: Palette) => string
  bodyDecor?: (c: ChibiCtx) => ReactNode
  /** Drawn behind the head silhouette (ears). */
  ears?: (c: ChibiCtx) => ReactNode
  headFill?: (p: Palette) => string
  /** Markings drawn on the head before the face. */
  headDecor?: (c: ChibiCtx) => ReactNode
  /** Drawn after the face (nose, whiskers, beak). */
  faceDecor?: (c: ChibiCtx) => ReactNode
  /** Drawn above head accessories (the unicorn's horn pokes through hats). */
  overHat?: (c: ChibiCtx) => ReactNode
}
