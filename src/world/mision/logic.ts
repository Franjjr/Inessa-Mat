/* «Misión de tu profe»: which mission the child sees, and the activity that plays it. Pure, so it is tested apart. */
import { MISSION_DONE_ATTEMPTS } from '@/data'
import type { ActivityConfig, Assignment } from '@/types'

/** The mission on the child's home: the newest current one (listAssignmentsForChild already keeps the current ones,
    newest first), or null. */
export function currentMission(list: readonly Assignment[]): Assignment | null {
  return list[0] ?? null
}

/** Whether a mission is on now: started, and not past its due date. The same rule as listAssignmentsForChild, for a
    mission handed over by the home screen. */
export function isMissionCurrent(a: Assignment, now = Date.now()): boolean {
  return Date.parse(a.startsAt) <= now && (!a.dueAt || Date.parse(a.dueAt) >= now)
}

/** The progress flag set when the child finishes a run of the mission: the home bar then says «¡Hecha!». */
export function missionDoneFlag(id: string): string {
  return `mision:${id}`
}

/** The small line above the mission title on the home: it says «¡Hecha!» once the child finished a run (it can still
    be played again until its due date). */
export function missionKicker(flags: Readonly<Record<string, boolean>> | undefined, id: string): string {
  return flags?.[missionDoneFlag(id)] ? 'Misión de tu profe · ¡Hecha!' : 'Misión de tu profe'
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
