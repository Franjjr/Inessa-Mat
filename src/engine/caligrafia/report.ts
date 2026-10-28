/* The Caligrafía section of the adult report (pure): which letters and links are learnt, which ones cost, and the
   criterion that fails most (in words). Reads only the calig: rows; the maths and Lengua readers never see them.
   «Dominada» is a Leitner box of 4 or more (an 8-day interval at least). */
import { CAL_CURRICULUM } from '@/content/caligrafia/curriculum'
import type { AttemptRecord, ErrorType, MasteryMap } from '@/types'
import { handwritingAttempts, handwritingMastery } from '@/engine/subjects'

export const CAL_MASTERED_BOX = 4
/** A letter or link with attempts and a box of 1 or less still costs the child. */
export const CAL_COSTLY_BOX = 1

/** The criteria of a cursive try, in the order they are checked (the ties of the worst one go to the first). */
const CRITERION_WORD: [ErrorType, string][] = [
  ['calig-shape', 'la forma'],
  ['calig-line', 'la línea'],
  ['calig-size', 'el tamaño'],
  ['calig-start', 'el inicio'],
]

export interface HandwritingReport {
  /** Tries in the read (every calig: attempt). */
  tries: number
  /** Letters and links that are dominated, in teaching order. */
  learnt: string[]
  /** Letters and links with attempts whose box is 1 or less, in teaching order. */
  costly: string[]
  /** The criterion that fails most, with its count; null when no try failed on a criterion. */
  worst: { errorType: ErrorType; word: string; count: number } | null
}

/** The Caligrafía report of a child, or null when there is no calig: attempt (the section is then hidden). */
export function handwritingReport(attempts: readonly AttemptRecord[], mastery: MasteryMap): HandwritingReport | null {
  const all = handwritingAttempts(attempts)
  if (all.length === 0) return null
  const tries = all.filter((a) => a.graded !== false)
  const marks = handwritingMastery(mastery)
  const readable = CAL_CURRICULUM.filter((i) => i.kind === 'letra' || i.kind === 'enlace')
  const learnt = readable.filter((i) => (marks[i.skill]?.box ?? -1) >= CAL_MASTERED_BOX).map((i) => i.text)
  const costly = readable.filter((i) => {
    const m = marks[i.skill]
    return !!m && m.attempts > 0 && m.box <= CAL_COSTLY_BOX
  }).map((i) => i.text)

  const count = new Map<ErrorType, number>()
  for (const a of tries) {
    if (a.correct || !a.errorType) continue
    count.set(a.errorType, (count.get(a.errorType) ?? 0) + 1)
  }
  let worst: HandwritingReport['worst'] = null
  for (const [errorType, word] of CRITERION_WORD) {
    const n = count.get(errorType) ?? 0
    if (n > 0 && (!worst || n > worst.count)) worst = { errorType, word, count: n }
  }
  return { tries: tries.length, learnt, costly, worst }
}
