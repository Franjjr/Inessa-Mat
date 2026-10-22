/* Pure helpers of the lesson player: step runs, keyboard mapping and voices. No React here. */
import type { CharacterId, LessonStep, LessonVisualId } from '@/types'

/**
 * A run is a block of consecutive "show" steps that use the same visual with the same params. The visual stays
 * mounted across a run and receives the position of the step inside it as its phase.
 */
export interface StepRun {
  /** Index of the first step of the run (used as the React key of the visual). */
  start: number
  length: number
  /** Position of this step inside the run (0-based). */
  phase: number
}

function sameVisual(a: LessonStep, b: LessonStep): boolean {
  return a.visual === b.visual && stableParams(a.params) === stableParams(b.params)
}

function stableParams(p: LessonStep['params']): string {
  if (!p) return ''
  return Object.keys(p).sort().map((k) => `${k}=${String(p[k])}`).join('&')
}

/** Steps the child answers (a try or a choice) form a run of their own: their visual is not drawn. */
export function isAnswerStep(step: LessonStep | undefined): boolean {
  return step?.interaction === 'try' || step?.interaction === 'choose'
}

/** Splits the steps into runs. "Try" and "choose" steps always form a run of their own. */
export function computeRuns(steps: readonly LessonStep[]): StepRun[] {
  const runs: StepRun[] = []
  let i = 0
  while (i < steps.length) {
    if (isAnswerStep(steps[i])) {
      runs.push({ start: i, length: 1, phase: 0 })
      i++
      continue
    }
    let j = i + 1
    while (j < steps.length && !isAnswerStep(steps[j]) && sameVisual(steps[i], steps[j])) j++
    for (let k = i; k < j; k++) runs.push({ start: i, length: j - i, phase: k - i })
    i = j
  }
  return runs
}

export type NavAction = 'next' | 'back' | 'exit'

export interface KeyInput {
  key: string
  /** Target is a text field or an editable element: typing wins, no navigation. */
  editable: boolean
  /** Target is an interactive control (button, slider, keypad…): arrows belong to it. */
  interactive: boolean
  /** Ctrl, Cmd or Alt is held: leave the shortcut to the browser. */
  modified: boolean
  /** Nothing in particular has focus (the document body). */
  onBody: boolean
}

/** Keyboard navigation: arrows and Page keys move, Escape exits, Enter continues when nothing else has focus. */
export function keyAction(input: KeyInput): NavAction | null {
  if (input.modified || input.editable) return null
  if (input.key === 'Escape') return 'exit'
  if (input.interactive) return null
  switch (input.key) {
    case 'ArrowRight':
    case 'PageDown':
      return 'next'
    case 'ArrowLeft':
    case 'PageUp':
      return 'back'
    case 'Enter':
      return input.onBody ? 'next' : null
    default:
      return null
  }
}

/** Which character a step's speaker maps to on stage. The companion and the narrator speak as Lumi on this screen. */
export function stageCharacter(speaker: CharacterId | undefined): Exclude<CharacterId, 'companion' | 'narrator'> {
  if (!speaker || speaker === 'companion' || speaker === 'narrator') return 'lumi'
  return speaker
}

/** Voice preset (audio/speech) for a speaker. */
export function voiceFor(speaker: CharacterId | undefined): 'lumi' | 'companion' | 'guardian' {
  if (!speaker || speaker === 'lumi' || speaker === 'narrator') return 'lumi'
  if (speaker === 'companion' || speaker === 'borron') return 'companion'
  return 'guardian'
}

/** Whether a visual id is one the player can draw (guards against content typos at runtime). */
export function isVisualId(id: string, known: readonly string[]): id is LessonVisualId {
  return known.includes(id)
}
