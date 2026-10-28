/* Classes registry and the pure helpers over them: which class a topic has, whether a child has done it, and how
   finishing it counts on the map (its flag, and its map lesson when that one is open). Pure: never mutates. */
import { applyNodeResult, COMPLETION_STARS, isNodeUnlocked } from '../progression'
import { getSeason } from '../season'
import type { ProgressState, SubjectId } from '@/types'
import type { ClassDef } from './dsl'
import { GRADE3_CLASSES } from './grade3'
import { MENTAL_CLASSES } from './grade3-mental'
import { FRACCIONES_CLASSES } from './grade3-fracciones'
import { DINERO_CLASSES } from './grade3-dinero'
import { TIEMPO_CLASSES } from './grade3-tiempo'
import { MEDIDA_CLASSES } from './grade3-medida'
import { GEOMETRIA_CLASSES } from './grade3-geometria'
import { DATOS_CLASSES } from './grade3-datos'
import { NUMEROS_CLASSES } from './grade3-numeros'
import { PROBLEMAS_CLASSES } from './grade3-problemas'
import { TABLAS_CLASSES } from './grade3-tablas'
import { LENGUA_CLASSES } from './lengua3'

export { clase } from './dsl'
export type { ClassDef, ClassInput } from './dsl'

/** The maths classes (3.º): one array per block of topics, concatenated. */
export const CLASSES: ClassDef[] = [...GRADE3_CLASSES, ...NUMEROS_CLASSES, ...TABLAS_CLASSES, ...PROBLEMAS_CLASSES, ...MENTAL_CLASSES, ...FRACCIONES_CLASSES, ...DINERO_CLASSES, ...TIEMPO_CLASSES, ...MEDIDA_CLASSES, ...GEOMETRIA_CLASSES, ...DATOS_CLASSES]
/** The Lengua classes (3.º): one per grammar, spelling and vocabulary topic. */
export { LENGUA_CLASSES }

/** The class that teaches a syllabus topic of a grade, if there is one yet. Topic ids repeat across grades (e.g.
    `mul-3x1` is in 3.º and 4.º), and every class so far is for 3.º, so a child of any other grade gets none. A child
    without a grade follows the 3.º syllabus (syllabusForGrade), so for them it is 3.º too. The subject is maths unless
    said otherwise; a subject with no classes has none. */
export function classForTopic(topicId: string, grade?: number, subject: SubjectId = 'math'): ClassDef | undefined {
  if ((grade ?? 3) !== 3) return undefined
  const classes = subject === 'math' ? CLASSES : subject === 'language' ? LENGUA_CLASSES : []
  return classes.find((c) => c.topicId === topicId)
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

/** How a class was finished: its lesson played to the end (it also marks its map lesson), or «Ya lo sé» passed (the
    class flag only: the map is not touched, so no stars and no map node come from skipping). */
export type ClassFinish = 'lesson' | 'skip'

/** Marks the class done. A lesson also marks its map lesson when that one is unlocked and not yet done; a skip only sets
    the flag. */
export function markClassDone(progress: ProgressState, cls: ClassDef, via: ClassFinish): ProgressState {
  const flagged: ProgressState = { ...progress, flags: { ...progress.flags, [flagOf(cls)]: true } }
  if (via === 'skip') return flagged
  const node = mapNodeOf(flagged, cls)
  if (!node || !isNodeUnlocked(flagged, node.worldId, node.nodeId)) return flagged
  if (flagged.worlds[node.worldId]?.nodes[node.nodeId]?.done) return flagged
  return applyNodeResult(flagged, node.worldId, node.nodeId, { stars: COMPLETION_STARS, passed: true })
}
