/* Tiny builders that keep the story scripts readable. Pure data out. */
import type { BackgroundId, CharacterId, Pose, PredicamentKind, SfxName, StoryDef, StoryLine, StoryScene } from '@/types'

type Position = 'left' | 'center' | 'right'
export type CastMember = StoryScene['cast'][number]

/** Cast member: cast('companion', 'scared', 'center', 'vines'). */
export function cast(id: CharacterId, pose: Pose, position: Position, predicament?: PredicamentKind): CastMember {
  return predicament ? { id, pose, position, predicament } : { id, pose, position }
}

/** Story line: say('lumi', '¡Hola!', 'happy'). The sfx name must be one of audio's SfxName. */
export function say(speaker: CharacterId, text: string, pose?: Pose, sfx?: SfxName): StoryLine {
  const l: StoryLine = { speaker, text }
  if (pose) l.pose = pose
  if (sfx) l.sfx = sfx
  return l
}

/** Narrator line (also used for what the child says, written with Spanish dialogue dashes). */
export function narrate(text: string, sfx?: SfxName): StoryLine {
  return sfx ? { speaker: 'narrator', text, sfx } : { speaker: 'narrator', text }
}

export function scene(background: BackgroundId, castList: CastMember[], lines: StoryLine[]): StoryScene {
  return { background, cast: castList, lines }
}

export function story(id: string, title: string, scenes: StoryScene[]): StoryDef {
  return { id, title, scenes }
}
