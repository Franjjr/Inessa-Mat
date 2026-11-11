/* Every class says only what its drawing already shows (audit p3-clases H6, H12, H15): a result a sentence names with
   «= N» is on the drawing at that moment, and the drawing of a story does not hold its own answer. */
import { cleanup, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CLASSES } from '@/content/classes'
import { LESSON_VISUALS } from '@/activities/lesson/visuals'
import { computeRuns, isAnswerStep } from '@/activities/lesson/navigation'
import type { LessonStep } from '@/types'

const squash = (t: string) => t.replace(/[\s  ]+/g, '')

/** The results a sentence names: the numbers right after an «=» sign («38 + 25 = 63», «4 + 5 = 9»). */
export function namedResults(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/=\s*(\d[\d\s  ]*\d|\d)(?![\d,])/g)) out.push(squash(m[1]))
  return out
}

/** What a visual draws at a step of its run, as plain text. */
function drawn(step: LessonStep, phase: number, runLength: number): string {
  const V = LESSON_VISUALS[step.visual]
  const r = render(<V params={step.params ?? {}} phase={phase} runLength={runLength} reduced />)
  const txt = squash(r.container.textContent ?? '')
  cleanup()
  return txt
}

describe('clases-dibujo: the sentence names only what is drawn', () => {
  it('there are classes to check', () => expect(CLASSES.length).toBeGreaterThanOrEqual(70))

  const problems: string[] = []
  for (const cls of CLASSES) {
    const runs = computeRuns(cls.lesson.steps)
    cls.lesson.steps.forEach((step, i) => {
      if (isAnswerStep(step)) return
      const named = namedResults(step.text)
      if (!named.length) return
      const text = drawn(step, runs[i].phase, runs[i].length)
      // The houses of a number write its digits apart («D3decenasU4unidades»): for them the digits in order are the number.
      const digits = step.visual === 'place-value' ? text.replace(/\D/g, '') : ''
      const missing = named.filter((n) => !text.includes(n) && !(digits && digits.includes(n)))
      if (missing.length) problems.push(`${cls.lesson.id} [${i}] fase ${runs[i].phase + 1}/${runs[i].length} «${step.text}» no dibuja ${missing.join(', ')} (dibuja «${text.slice(0, 80)}»)`)
    })
  }
  it('every result a sentence names with «=» is already on the drawing', () => {
    expect(problems).toEqual([])
  })
})
