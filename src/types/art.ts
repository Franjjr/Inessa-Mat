import type { CharacterId, Pose, PredicamentKind, BackgroundId } from './content'
import type { Companion, CompanionSpecies } from './child'

export interface CharacterProps {
  id: Exclude<CharacterId, 'companion' | 'narrator'>
  pose?: Pose
  /** Pixel size of the bounding box height. Characters scale crisply (SVG). */
  size?: number
  /** Mirror horizontally (face left). */
  flip?: boolean
  /** Subtle idle animation (breathing / blinking). Default true. Respects prefers-reduced-motion. */
  animated?: boolean
  className?: string
}

export interface CompanionArtProps {
  species: CompanionSpecies
  pose?: Pose
  size?: number
  colorway?: string
  /** Accessory ids to draw on top (see content/accessories). Unknown ids are ignored. */
  equipped?: string[]
  flip?: boolean
  animated?: boolean
  className?: string
}

export interface PredicamentProps {
  kind: PredicamentKind
  /** Progress of the rescue 0..1 — the art loosens (ice melts, net opens) as the guardian challenge advances. */
  rescue?: number
  children: React.ReactNode
}

export interface WorldBackgroundProps {
  id: BackgroundId
  /** 0..1 how much colour has come back (Borrón's fog drains colour until the crystal is recovered). */
  vividness?: number
  className?: string
  children?: React.ReactNode
}

export type { Companion }
