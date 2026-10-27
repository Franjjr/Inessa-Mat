/* Classes registry and the pure helpers over them: which class a topic has, whether a child has done it, and how
   finishing it counts on the map (its flag, and its map lesson when that one is open). Pure: never mutates. */
import { applyNodeResult, COMPLETION_STARS, isNodeUnlocked } from '../progression'
import { getSeason } from '../season'
import type { ProgressState } from '@/types'
import type { ClassDef } from './dsl'
import { GRADE3_CLASSES } from './grade3'

export { clase } from './dsl'
export type { ClassDef, ClassInput } from './dsl'

export const CLASSES: ClassDef[] = GRADE3_CLASSES

/** The class that teaches a syllabus topic of a grade, if there is one yet. Topic ids repeat across grades (e.g.
    `mul-3x1` is in 3.º and 4.º), and every class so far is for 3.º, so a child of any other grade gets none. */
export function classForTopic(topicId: string, grade?: number): ClassDef | undefined {
  if (grade !== 3) return undefined
  return CLASSES.find((c) => c.topicId === topicId)
}

/** The world and node of a season whose lesson is the given LessonDef, if the map has it. */
export function findLessonNode(seasonId: string, lessonId: string): { worldId: string; nodeId: string } | undefined {
  for (const world of getSeason(seasonId).worlds) {
    const node = world.nodes.find((n) => n.kind === 'lesson' && n.ref === lessonId)
    if (node) return { worldId: world.id, nodeId: node.id }
  }
  return undefined
}

const flagOf = (cls: ClassDef) => `clase:${cls.topicId}`

function mapNodeOf(progress: ProgressState, cls: ClassDef) {
  return cls.mapLessonId ? findLessonNode(progress.seasonId, cls.mapLessonId) : undefined
}

export function isClassDone(progress: ProgressState, cls: ClassDef): boolean {
  if (progress.flags[flagOf(cls)]) return true
  const node = mapNodeOf(progress, cls)
  return !!node && progress.worlds[node.worldId]?.nodes[node.nodeId]?.done === true
}

/** Marks the class done: its flag, and its map lesson too when that one is unlocked and not yet done. */
export function markClassDone(progress: ProgressState, cls: ClassDef): ProgressState {
  const flagged: ProgressState = { ...progress, flags: { ...progress.flags, [flagOf(cls)]: true } }
  const node = mapNodeOf(flagged, cls)
  if (!node || !isNodeUnlocked(flagged, node.worldId, node.nodeId)) return flagged
  if (flagged.worlds[node.worldId]?.nodes[node.nodeId]?.done) return flagged
  return applyNodeResult(flagged, node.worldId, node.nodeId, { stars: COMPLETION_STARS, passed: true })
}
