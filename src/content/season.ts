/* Season 1 assembly and lookups (built once at module load; all data is static). */
import type { GuardianDef, LessonDef, NodeDef, SeasonDef, StoryDef, WorldDef } from '@/types'
import { guardians } from './guardians'
import { lessons } from './lessons'
import { stories } from './stories'
import { w1 } from './worlds/w1'
import { w2 } from './worlds/w2'
import { w3 } from './worlds/w3'
import { w4 } from './worlds/w4'
import { w5 } from './worlds/w5'
import { w6 } from './worlds/w6'
import { w7 } from './worlds/w7'
import { w8 } from './worlds/w8'

export const season1: SeasonDef = {
  id: 's1',
  name: 'Numeria',
  secretWord: 'VALIENTE',
  worlds: [w1, w2, w3, w4, w5, w6, w7, w8],
}

const WORLDS = new Map(season1.worlds.map((w) => [w.id, w]))
const NODES = new Map(season1.worlds.map((w) => [w.id, new Map(w.nodes.map((n) => [n.id, n]))]))
const STORIES = new Map(stories.map((s) => [s.id, s]))
const LESSONS = new Map(lessons.map((l) => [l.id, l]))
const GUARDIANS = new Map(guardians.map((g) => [g.id, g]))

export { guardians, lessons, stories }

export function getWorld(id: string): WorldDef | undefined {
  return WORLDS.get(id)
}

export function getNode(worldId: string, nodeId: string): NodeDef | undefined {
  return NODES.get(worldId)?.get(nodeId)
}

export function getStory(id: string): StoryDef | undefined {
  return STORIES.get(id)
}

export function getLesson(id: string): LessonDef | undefined {
  return LESSONS.get(id)
}

export function getGuardian(id: string): GuardianDef | undefined {
  return GUARDIANS.get(id)
}

/** The world after `worldId` in the season, if any. */
export function nextWorldId(worldId: string): string | undefined {
  const i = season1.worlds.findIndex((w) => w.id === worldId)
  return i >= 0 ? season1.worlds[i + 1]?.id : undefined
}

/** The guardian of a world (its last node). */
export function guardianForWorld(worldId: string): GuardianDef | undefined {
  const node = getWorld(worldId)?.nodes.find((n) => n.kind === 'guardian')
  return node?.ref ? getGuardian(node.ref) : undefined
}
