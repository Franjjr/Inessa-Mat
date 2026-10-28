/* What Lengua can teach now, shared by the planner (daily.ts), the home («Hoy», todayEntry) and the adults' report, so the
   topic they name is the one the session teaches. Pure: no React, no I/O. */
import type { Syllabus } from '@/content/syllabus'
import type { SkillKey } from '@/types'
import { kindsForSkill } from '../skills'

/** A skill the generator can make now: it has an exercise kind, and a dictation needs the sound (R16). */
export function makable(skill: SkillKey, sound: boolean): boolean {
  const kinds = kindsForSkill(skill)
  return kinds.length > 0 && (sound || !kinds.includes('lng-dictation'))
}

/** The syllabus with only the Lengua skills the planner can make. A topic left with none is not offered (availableTopics),
    so currentTopic never names a topic the session cannot teach. Other subjects' skills are kept as they are. */
export function teachableCourse(syllabus: Syllabus, sound = true): Syllabus {
  return {
    ...syllabus,
    blocks: syllabus.blocks.map((b) => ({
      ...b,
      topics: b.topics.map((t) => ({ ...t, skills: t.skills.filter((s) => !s.startsWith('lng:') || makable(s, sound)) })),
    })),
  }
}
