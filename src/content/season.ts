/* Season assembly and lookups (built once at module load; all data is static). Two seasons share the maps and the
   world ids w1..w8: 's1' is the 3.º adventure and 'c2' the 2.º one (src/content/c2). A child's progress says which
   season it plays (ProgressState.seasonId); every lookup takes that id, 's1' by default. */
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
import { c2Finale } from './c2/finale'
import { c2Guardians } from './c2/guardians'
import { c2Lessons } from './c2/lessons'
import { c2Stories } from './c2/stories'
import { c2Worlds } from './c2/worlds'

export const season1: SeasonDef = {
  id: 's1',
  name: 'Numeria',
  secretWord: 'VALIENTE',
  worlds: [w1, w2, w3, w4, w5, w6, w7, w8],
}

export const seasonC2: SeasonDef = {
  id: 'c2',
  name: 'Numeria',
  secretWord: 'VALIENTE',
  worlds: c2Worlds,
}

export const SEASONS: SeasonDef[] = [season1, seasonC2]

/** The season of an id ('s1' when unknown). */
export function getSeason(id?: string): SeasonDef {
  return SEASONS.find((s) => s.id === id) ?? season1
}

/** The adventure of a school year: 1.º–2.º play the 2.º one, the rest the 3.º one. */
export function seasonIdForGrade(grade?: number): string {
  return grade !== undefined && grade <= 2 ? 'c2' : 's1'
}

const key = (seasonId: string, worldId: string) => `${seasonId}:${worldId}`
const WORLDS = new Map(SEASONS.flatMap((s) => s.worlds.map((w) => [key(s.id, w.id), w] as const)))
const NODES = new Map(SEASONS.flatMap((s) => s.worlds.map((w) => [key(s.id, w.id), new Map(w.nodes.map((n) => [n.id, n]))] as const)))
const STORIES = new Map([...stories, ...c2Stories, c2Finale].map((s) => [s.id, s]))
const LESSONS = new Map([...lessons, ...c2Lessons].map((l) => [l.id, l]))
const GUARDIANS = new Map([...guardians, ...c2Guardians].map((g) => [g.id, g]))

export { guardians, lessons, stories }

export function getWorld(id: string, seasonId = 's1'): WorldDef | undefined {
  return WORLDS.get(key(getSeason(seasonId).id, id))
}

export function getNode(worldId: string, nodeId: string, seasonId = 's1'): NodeDef | undefined {
  return NODES.get(key(getSeason(seasonId).id, worldId))?.get(nodeId)
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
export function nextWorldId(worldId: string, seasonId = 's1'): string | undefined {
  const worlds = getSeason(seasonId).worlds
  const i = worlds.findIndex((w) => w.id === worldId)
  return i >= 0 ? worlds[i + 1]?.id : undefined
}

/** The guardian of a world (its last node). */
export function guardianForWorld(worldId: string, seasonId = 's1'): GuardianDef | undefined {
  const node = getWorld(worldId, seasonId)?.nodes.find((n) => n.kind === 'guardian')
  return node?.ref ? getGuardian(node.ref) : undefined
}
