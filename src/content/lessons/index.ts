/* All Season 1 lessons, by world order. */
import type { LessonDef } from '@/types'
import { w1Easy, w1Groups } from './w1'
import { w2Carry, w2PlaceValue } from './w2'
import { w3Five, w3Rhyme } from './w3'
import { w4Borrow, w4FourWays, w4Zero } from './w4'
import { w5Double, w5Pattern } from './w5'
import { w6Nine, w6Seven } from './w6'
import { w7Carry, w7Split } from './w7'
import { w8Galera, w8Share } from './w8'

export const lessons: LessonDef[] = [
  w1Groups, w1Easy,
  w2PlaceValue, w2Carry,
  w3Five, w3Rhyme,
  w4Borrow, w4FourWays, w4Zero,
  w5Double, w5Pattern,
  w6Seven, w6Nine,
  w7Split, w7Carry,
  w8Share, w8Galera,
]
