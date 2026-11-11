/* «Misión de tu profe»: which mission the child sees, and the activity that plays it. Pure, so it is tested apart. */
import { MISSION_DONE_ATTEMPTS } from '@/data'
import type { ActivityConfig, Assignment } from '@/types'

/** The mission on the child's home: the newest current one (listAssignmentsForChild already keeps the current ones,
    newest first), or null. */
export function currentMission(list: readonly Assignment[]): Assignment | null {
  return list[0] ?? null
}

/** One run of the mission: rounds of the exercises its practice asks for, as many as make it «hecha» for the teacher. */
export function missionConfig(a: Assignment): ActivityConfig {
  return {
    kind: 'exercises',
    title: a.title,
    instructions: 'La misión de tu profe.',
    selector: a.selector ?? {},
    count: MISSION_DONE_ATTEMPTS,
  }
}
