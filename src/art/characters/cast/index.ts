import type { CharacterProps } from '@/types'
import type { CastDef } from '../shared/cast'
import { borron } from './borron'
import { dragon } from './dragon'
import { fairy } from './fairy'
import { frog } from './frog'
import { ladybug } from './ladybug'
import { lumi } from './lumi'
import { octopus } from './octopus'
import { owl } from './owl'
import { polarbear } from './polarbear'
import { queen } from './queen'

/** Every drawable character id. ('companion' and 'narrator' are resolved by callers.) */
export const CAST: Record<CharacterProps['id'], CastDef> = {
  lumi,
  borron,
  owl,
  frog,
  ladybug,
  polarbear,
  octopus,
  fairy,
  dragon,
  queen,
}

export const CHARACTER_IDS = Object.keys(CAST) as CharacterProps['id'][]
