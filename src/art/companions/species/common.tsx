/* Helpers shared by the species drawings. */
import type { ReactNode } from 'react'
import type { FaceGeom } from '../../characters/shared/face'
import { Limb, Loop, anim } from '../../characters/shared/frame'
import type { ChibiCtx, Palette, Anchors } from '../types'

export const DEFAULT_ANCHORS: Anchors = {
  headTop: { x: 100, y: 44, w: 64 },
  eyes: { x: 100, y: 90, span: 42 },
  neck: { x: 100, y: 131, w: 60 },
  back: { x: 100, y: 128, w: 72 },
  hand: { s: 1 },
}

export function anchors(over: Partial<{ [K in keyof Anchors]: Partial<Anchors[K]> }> = {}): Anchors {
  return {
    headTop: { ...DEFAULT_ANCHORS.headTop, ...over.headTop },
    eyes: { ...DEFAULT_ANCHORS.eyes, ...over.eyes },
    neck: { ...DEFAULT_ANCHORS.neck, ...over.neck },
    back: { ...DEFAULT_ANCHORS.back, ...over.back },
    hand: { ...DEFAULT_ANCHORS.hand, ...over.hand },
  }
}

/** The standard chibi face (eyes at 79/121, mouth under the nose). */
export function chibiFace(p: Palette, over: Partial<FaceGeom> = {}): FaceGeom {
  return {
    eyes: [[79, 90], [121, 90]],
    ew: 9.2,
    eh: 11.2,
    ink: p.eye,
    mouth: [100, 108],
    mw: 7.2,
    cheeks: [[65, 105], [135, 105]],
    cheekR: [8.5, 5],
    cheekColor: p.cheek ?? '#f9a8d4',
    sw: 3.4,
    browLift: 18,
    browInk: p.ink,
    mouthFill: '#9f1239',
    tongue: '#fb7185',
    ...over,
  }
}

/** A pair of mirrored ears that rotate with the pose. Draw the LEFT ear; it is mirrored for the right. */
export function EarPair({ c, pivot, children }: { c: ChibiCtx; pivot: [number, number]; children: ReactNode }) {
  return (
    <>
      <Limb x={pivot[0]} y={pivot[1]} angle={-c.ear}>{children}</Limb>
      <g transform="translate(200 0) scale(-1 1)">
        <Limb x={pivot[0]} y={pivot[1]} angle={-c.ear}>{children}</Limb>
      </g>
    </>
  )
}

/** Tail wrapper: wags fast when happy, slowly otherwise. */
export function Tail({ c, x, y, children }: { c: ChibiCtx; x: number; y: number; children: ReactNode }) {
  const happy = c.pose === 'happy' || c.pose === 'cheer'
  return (
    <Loop cls={happy ? anim.wag : anim.wagSlow} x={x} y={y} on={c.animated && c.pose !== 'sleep'}>
      {children}
    </Loop>
  )
}

/** Thick curvy shape drawn as an outlined stroke (tails, flippers). */
export function Stroke({ d, w, fill, ink, sw = 5 }: { d: string; w: number; fill: string; ink: string; sw?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={ink} strokeWidth={w + sw * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

/** Small rounded triangle nose. */
export function Nose({ x = 100, y = 100, w = 6.5, fill, ink }: { x?: number; y?: number; w?: number; fill: string; ink?: string }) {
  return (
    <g>
      <path d={`M${x - w} ${y - w * 0.45} Q${x} ${y - w * 0.85} ${x + w} ${y - w * 0.45} Q${x + w * 0.4} ${y + w * 0.6} ${x} ${y + w * 0.65} Q${x - w * 0.4} ${y + w * 0.6} ${x - w} ${y - w * 0.45} Z`} fill={fill} stroke={ink ?? 'none'} strokeWidth={ink ? 2 : 0} strokeLinejoin="round" />
      <ellipse cx={x - w * 0.35} cy={y - w * 0.3} rx={w * 0.28} ry={w * 0.16} fill="#ffffff" opacity={0.7} />
    </g>
  )
}
