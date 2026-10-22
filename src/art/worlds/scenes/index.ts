import type { ComponentType } from 'react'
import type { BackgroundId } from '@/types'
import { ForestScene } from './forest'
import { RiverScene } from './river'
import { CaveScene } from './cave'
import { MountainScene } from './mountain'
import { LakeScene } from './lake'
import { RainbowGardenScene } from './rainbowGarden'
import { VolcanoScene } from './volcano'
import { CastleScene } from './castle'
import { HomeScene } from './home'
import { SkyScene } from './sky'

/** Scene component per background (rendered inside TintProvider + IdScope). */
export const SCENES: Record<BackgroundId, ComponentType> = {
  home: HomeScene,
  sky: SkyScene,
  forest: ForestScene,
  river: RiverScene,
  cave: CaveScene,
  mountain: MountainScene,
  lake: LakeScene,
  'rainbow-garden': RainbowGardenScene,
  volcano: VolcanoScene,
  castle: CastleScene,
}

/** Solid base colour (top of the sky / wall) painted on the root while the SVG layers load. */
export const SCENE_BASE: Record<BackgroundId, string> = {
  home: '#f3e8ff',
  sky: '#c7d7fe',
  forest: '#c4e9d9',
  river: '#cde8ff',
  cave: '#f9dcc8',
  mountain: '#cdeefa',
  lake: '#e2d3fb',
  'rainbow-garden': '#fde4f5',
  volcano: '#ffe1c4',
  castle: '#fff1c2',
}
