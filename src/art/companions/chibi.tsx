/* Shared chibi body for the 8 companion species: big head, small body, stubby arms, feet,
   plus the accessory layers positioned on each species' anchor points. */
import type { ReactNode } from 'react'
import { Face } from '../characters/shared/face'
import { Limb, Shift, Silhouette, anim, ol } from '../characters/shared/frame'
import { EAR_ANGLES, armAngle, type ArmTable } from '../characters/shared/pose'
import { accessoryArt, type AccessoryId, type AccessorySlot } from './accessories'
import type { Anchors, ChibiCtx, SpeciesDef } from './types'

export const HEAD = { cx: 100, cy: 84, rx: 54, ry: 47 }
export const BODY = { cx: 100, cy: 152, rx: 36, ry: 31 }
export const ARM_D = 'M-8 0 A8 8 0 0 1 8 0 L8.6 10 Q9 19.5 0 19.5 Q-9 19.5 -8.6 10 Z'
const ARM_TABLE: ArmTable = { down: 22, in: 8, out: 68, up: 150, spread: 110, talk: 80, chest: -42, face: -150, chin: -152 }

function Placed({ x, y, k, r = 0, children }: { x: number; y: number; k: number; r?: number; children: ReactNode }) {
  return <g transform={`translate(${x} ${y}) rotate(${r}) scale(${k})`}>{children}</g>
}

function layer(slot: AccessorySlot, eq: Partial<Record<AccessorySlot, AccessoryId>>, a: Anchors, animated: boolean, part: 'draw' | 'front' = 'draw'): ReactNode {
  const id = eq[slot]
  if (!id) return null
  const art = accessoryArt(id)
  const fn = part === 'front' ? art.front : art.draw
  if (!fn) return null
  let x = 0
  let y = 0
  let k = 1
  let r = 0
  if (slot === 'head') { x = a.headTop.x; y = a.headTop.y; k = a.headTop.w / 100; r = a.headTop.r ?? 0 }
  else if (slot === 'face') { x = a.eyes.x; y = a.eyes.y; k = a.eyes.span / 100 }
  else if (slot === 'neck' || (slot === 'back' && part === 'front')) { x = a.neck.x; y = a.neck.y; k = a.neck.w / 100 }
  else if (slot === 'back') { x = a.back.x; y = a.back.y; k = a.back.w / 100 }
  return (
    <g data-accessory={id} data-slot={slot}>
      <Placed x={x} y={y} k={k} r={r}>{fn({ k, animated })}</Placed>
    </g>
  )
}

export interface ChibiProps {
  def: SpeciesDef
  ctx: Omit<ChibiCtx, 'ear'>
  equipped: Partial<Record<AccessorySlot, AccessoryId>>
  delay: number
}

export function Chibi({ def, ctx, equipped, delay }: ChibiProps) {
  const { p, pose, expr, posture, animated } = ctx
  const head = def.head ?? HEAD
  const body = def.body ?? BODY
  const arm = def.arm ?? { x: 69, y: 137 }
  const armD = arm.d ?? ARM_D
  const hand = arm.hand ?? [0, 16]
  const table = arm.table ?? ARM_TABLE
  const armFill = arm.fill?.(p) ?? p.fur
  const ear = EAR_ANGLES[posture.ears] * (def.earGain ?? 1)
  const c: ChibiCtx = { ...ctx, ear }
  const a = def.anchors
  const aL = armAngle(posture.armL, -1, table)
  const aR = armAngle(posture.armR, 1, table)
  const rx = 200 - arm.x
  const held = equipped.held
  const heldArt = held ? accessoryArt(held) : null

  return (
    <g className={posture.slowBreath ? anim.breatheSlow : anim.breathe} style={{ transformOrigin: '100px 192px' }}>
      {layer('back', equipped, a, animated)}
      {def.behind?.(c)}
      {def.feet ? def.feet(c) : (
        <g fill={armFill} {...ol(p.ink)}>
          <ellipse cx={82} cy={184} rx={13} ry={8.5} />
          <ellipse cx={118} cy={184} rx={13} ry={8.5} />
        </g>
      )}
      <Silhouette fill={def.bodyFill?.(p) ?? p.fur} ink={p.ink}>
        <ellipse cx={body.cx} cy={body.cy} rx={body.rx} ry={body.ry} />
      </Silhouette>
      {def.bodyDecor ? def.bodyDecor(c) : <ellipse cx={100} cy={158} rx={22} ry={19} fill={p.light} />}
      <Limb x={arm.x} y={arm.y} angle={aL}>
        <g transform={`translate(${arm.x} ${arm.y})`}>
          <path d={armD} fill={armFill} {...ol(p.ink)} />
        </g>
      </Limb>
      <Limb x={rx} y={arm.y} angle={aR}>
        <g transform={`translate(${rx} ${arm.y})`}>
          <path d={armD} fill={armFill} transform="scale(-1 1)" {...ol(p.ink)} />
          {heldArt && (
            <g data-accessory={held} data-slot="held">
              <Limb x={hand[0]} y={hand[1]} angle={-aR + 8}>
                <g transform={`translate(${hand[0]} ${hand[1]}) scale(${a.hand.s})`}>{heldArt.draw({ k: a.hand.s, animated })}</g>
              </Limb>
              <circle cx={hand[0]} cy={hand[1]} r={7.2} fill={armFill} {...ol(p.ink, 4)} />
            </g>
          )}
        </g>
      </Limb>
      <Shift dy={posture.slump}>
        <Limb x={100} y={head.cy + head.ry - 6} angle={posture.head}>
          {def.ears?.(c)}
          <Silhouette fill={def.headFill?.(p) ?? p.fur} ink={p.ink}>
            <ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} />
          </Silhouette>
          {def.headDecor?.(c)}
          <Face g={def.face(p)} expr={expr} animated={animated} blinks={posture.blinks} delay={delay} poseKey={pose} />
          {def.faceDecor?.(c)}
          {layer('face', equipped, a, animated)}
          {layer('head', equipped, a, animated)}
          {def.overHat?.(c)}
        </Limb>
      </Shift>
      {/* neck items sit under the chin, over the head's lower edge */}
      {layer('neck', equipped, a, animated)}
      {layer('back', equipped, a, animated, 'front')}
    </g>
  )
}
