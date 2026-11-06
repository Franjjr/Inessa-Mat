/* What English can teach now, for the planner (Task 8) and the «Hoy» entry. With the sound off the listening kinds
   (eng-listen-pick, eng-num-listen, eng-op-listen) are left out, as Lengua leaves out its dictation (makable in
   src/engine/lengua/teachable.ts). A skill whose kinds are all listening (the operations) is not offered then. Pure. */
import type { Syllabus } from '@/content/syllabus'
import type { ExerciseKind, SkillKey } from '@/types'
import { kindsForSkill } from '../skills'
import { ENGLISH_LISTENING_KINDS } from './exercises'

/** The kinds of an English skill that can be planned: with the sound off, none of the listening ones. */
export function englishKindsFor(skill: SkillKey, sound = true): ExerciseKind[] {
  return kindsForSkill(skill).filter((k) => sound || !ENGLISH_LISTENING_KINDS.includes(k))
}

/** An English skill the generator can make now (at least one of its kinds is allowed). */
export function makableEnglish(skill: SkillKey, sound = true): boolean {
  return englishKindsFor(skill, sound).length > 0
}

/** The syllabus with only the English skills the planner can make. Other subjects' skills are kept as they are. */
export function teachableEnglishCourse(syllabus: Syllabus, sound = true): Syllabus {
  return {
    ...syllabus,
    blocks: syllabus.blocks.map((b) => ({
      ...b,
      topics: b.topics.map((t) => ({ ...t, skills: t.skills.filter((s) => !s.startsWith('eng:') || makableEnglish(s, sound)) })),
    })),
  }
}
