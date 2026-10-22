/* <CompanionArt species pose colorway equipped flip animated /> — the child's chibi companion. */
import { useId } from 'react'
import type { CompanionArtProps } from '@/types'
import { Extras } from '../characters/shared/extras'
import { ArtFrame } from '../characters/shared/frame'
import { expressionFor, normalizePose, phase, postureFor } from '../characters/shared/pose'
import { resolveEquipped } from './accessories'
import { Chibi } from './chibi'
import { SPECIES } from './species'
import { normalizeColorway } from './types'

const HEAD_BOX = { cx: 100, cy: 84, r: 56 }

export function CompanionArt({ species, pose: rawPose, size = 160, colorway, equipped, flip = false, animated = true, className }: CompanionArtProps) {
  const uid = useId().replace(/:/g, '')
  const def = SPECIES[species]
  if (!def) return null
  const pose = normalizePose(rawPose)
  const cw = normalizeColorway(colorway)
  const p = def.palettes[cw]
  const expr = expressionFor(pose)
  const posture = postureFor(pose)
  const eq = resolveEquipped(equipped)
  return (
    <ArtFrame
      size={size}
      flip={flip}
      animated={animated}
      motion={posture.motion}
      label={def.label}
      className={className}
      poseKey={pose}
      data={{ species, pose, colorway: cw, equipped: Object.values(eq).join(' ') }}
      overlay={<Extras kinds={expr.extras} head={HEAD_BOX} flip={flip} animated={animated} />}
    >
      <Chibi def={def} ctx={{ p, pose, expr, posture, animated, uid }} equipped={eq} delay={phase(species + cw, 2.5)} />
    </ArtFrame>
  )
}
