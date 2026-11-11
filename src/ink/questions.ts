/* The questions the answer flows ask through the ink store before grading (shown by <DoubtPrompt/>).
   They never grade: the child answers, and only then is the answer graded (or rewritten). */
import type { LearningStore } from './context'
import { encodeImage28, type InkReading } from './readLog'

/** The digits read from the ink on screen, for the review log of a wrong answer. null when nothing was handwritten. */
export function inkReadingOf(
  store: LearningStore, o: { kind: string; given: string; recognitionFixes: number; method?: string; oneDigitFix: boolean },
): InkReading | null {
  const reads = store.liveReads()
  if (!reads.length) return null
  return {
    ...o,
    digits: reads.map(({ read }) => ({
      digit: read.digit,
      confidence: Math.round(read.confidence * 100) / 100,
      alternatives: read.alternatives,
      doubtful: read.doubtful,
      confirmed: read.confirmed,
      ...(read.image28 && read.image28.some((v) => v > 0) ? { image28: encodeImage28(read.image28) } : {}),
    })),
  }
}

/** "He leído 47. ¿Es lo que has escrito?" — «Sí» grades what was read; «No» erases that digit to write it again. */
export function askMisread(store: LearningStore, o: { shown: string; key: string; onYes: () => void; onNo?: () => void }): void {
  store.ask({
    kind: 'misread',
    text: `He leído ${o.shown}. ¿Es lo que has escrito?`,
    shown: o.shown,
    actions: [
      {
        label: 'Sí',
        primary: true,
        run: () => {
          store.closeQuestion()
          // What she wrote is what was read: those digits are hers now (no new question about them).
          for (const { key, read } of store.liveReads()) store.confirmRead(key, read.digit)
          o.onYes()
        },
      },
      {
        label: 'No, lo escribo otra vez',
        run: () => {
          store.closeQuestion()
          o.onNo?.()
          store.rewrite(o.key)
        },
      },
    ],
  })
}

/** A number typed in reading order into a row filled units first: "¿Querías escribir 625?". Nothing is graded. */
export function askReversed(store: LearningStore, meant: string): void {
  store.ask({
    kind: 'reversed',
    text: `¿Querías escribir ${meant}? En la cuenta las cifras se escriben de derecha a izquierda.`,
    speak: `¿Querías escribir ${meant}? En la cuenta, las cifras se escriben de derecha a izquierda: primero las unidades.`,
    shown: meant,
    actions: [{ label: 'Vale, lo arreglo', primary: true, run: () => store.closeQuestion() }],
  })
}
