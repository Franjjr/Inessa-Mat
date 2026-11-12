/* Builders for lesson steps. Consecutive steps that repeat the same visual + params are successive phases of one
   animation (the LessonPlayer may keep the visual mounted and advance it instead of restarting it). */
import type { CharacterId, LessonDef, LessonStep, LessonVisualId, SkillSelector, TableMethod } from '@/types'

type Params = Record<string, number | string>

/** Narrated step (tap to continue). Speaker defaults to Lumi. */
export function show(visual: LessonVisualId, params: Params | undefined, text: string, speaker?: CharacterId): LessonStep {
  const s: LessonStep = { visual, text, interaction: 'tap' }
  if (params && Object.keys(params).length) s.params = params
  if (speaker && speaker !== 'lumi') s.speaker = speaker
  return s
}

/** "Try" step: the child solves one mini exercise generated from the selector to continue. */
export function tryIt(visual: LessonVisualId, params: Params | undefined, text: string, trySelector: SkillSelector, speaker?: CharacterId): LessonStep {
  return { ...show(visual, params, text, speaker), interaction: 'try', trySelector }
}

/** A lesson step whose exercise must be solved (and hinted) with one trick of the tables. `tableMethod` is read by the
    try slot; until LessonStep declares it, the step carries it as an extra field. */
export type StepWithTrick = LessonStep & { tableMethod?: TableMethod }

/** "Try" step that names the trick of the tables the hint and the mistake message must use. */
export function tryTrick(visual: LessonVisualId, params: Params | undefined, text: string, trySelector: SkillSelector, tableMethod: TableMethod): StepWithTrick {
  return { ...tryIt(visual, params, text, trySelector), tableMethod }
}

export function lesson(id: string, title: string, steps: LessonStep[]): LessonDef {
  return { id, title, steps }
}
