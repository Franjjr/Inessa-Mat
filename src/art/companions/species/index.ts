import type { CompanionSpecies } from '@/types'
import type { SpeciesDef } from '../types'
import { bunny } from './bunny'
import { cat } from './cat'
import { dog } from './dog'
import { babyDragon } from './dragon'
import { fox } from './fox'
import { panda } from './panda'
import { penguin } from './penguin'
import { babyUnicorn } from './unicorn'

export const SPECIES: Record<CompanionSpecies, SpeciesDef> = {
  cat,
  dog,
  fox,
  bunny,
  panda,
  penguin,
  dragon: babyDragon,
  unicorn: babyUnicorn,
}
