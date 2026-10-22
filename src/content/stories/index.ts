/* All Season 1 stories, by id. */
import type { StoryDef } from '@/types'
import { finale } from './finale'
import { prologue } from './prologue'
import { w1Arrival, w1Mid, w1Rescue } from './w1'
import { w2Arrival, w2Mid, w2Rescue } from './w2'
import { w3Arrival, w3Mid, w3Rescue } from './w3'
import { w4Arrival, w4Mid, w4Rescue } from './w4'
import { w5Arrival, w5Mid, w5Rescue } from './w5'
import { w6Arrival, w6Mid, w6Rescue } from './w6'
import { w7Arrival, w7Mid, w7Rescue } from './w7'
import { w8Arrival, w8Mid, w8Rescue } from './w8'

export const stories: StoryDef[] = [
  prologue,
  w1Arrival, w1Mid, w1Rescue,
  w2Arrival, w2Mid, w2Rescue,
  w3Arrival, w3Mid, w3Rescue,
  w4Arrival, w4Mid, w4Rescue,
  w5Arrival, w5Mid, w5Rescue,
  w6Arrival, w6Mid, w6Rescue,
  w7Arrival, w7Mid, w7Rescue,
  w8Arrival, w8Mid, w8Rescue,
  finale,
]
