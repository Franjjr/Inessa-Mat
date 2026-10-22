/* Builders for lesson steps. Consecutive steps that repeat the same visual + params are successive phases of one
   animation (the LessonPlayer may keep the visual mounted and advance it instead of restarting it). */
import type { CharacterId, LessonDef, LessonStep, LessonVisualId, SkillSelector } from '@/types'

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

export function lesson(id: string, title: string, steps: LessonStep[]): LessonDef {
  return { id, title, steps }
}
