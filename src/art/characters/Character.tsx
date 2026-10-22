/* <Character id pose size flip animated /> — Lumi, Borrón and the 8 guardians as crisp SVG. */
import { useId } from 'react'
import type { CharacterProps } from '@/types'
import { CAST } from './cast'
import { Extras } from './shared/extras'
import { ArtFrame } from './shared/frame'
import { expressionFor, normalizePose, phase, postureFor } from './shared/pose'

export function Character({ id, pose: rawPose, size = 160, flip = false, animated = true, className }: CharacterProps) {
  const uid = useId().replace(/:/g, '')
  const def = CAST[id]
  if (!def) return null
  const pose = normalizePose(rawPose)
  const expr = expressionFor(pose)
  const posture = postureFor(pose)
  const motion = def.motion?.[pose] ?? posture.motion
  return (
    <ArtFrame
      size={size}
      flip={flip}
      animated={animated}
      motion={motion}
      float={def.float}
      label={def.label}
      className={className}
      poseKey={pose}
      data={{ character: id, pose }}
      overlay={<Extras kinds={expr.extras} head={def.head} flip={flip} animated={animated} />}
    >
      {def.render({ pose, expr, posture, animated, uid, delay: phase(id, 2.5) })}
    </ArtFrame>
  )
}
