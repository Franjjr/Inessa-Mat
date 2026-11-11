/* The questions the answer flows ask through the ink store before grading (shown by <DoubtPrompt/>).
   They never grade: the child answers, and only then is the answer graded (or rewritten). */
import type { ReadDigit } from '@/activities/shared/recognition'
import type { InkRead, LearningStore } from './context'
import { encodeImage28, type InkReading } from './readLog'

/** The element that shows the ink of a read, if it is in the document. */
function elementOf(key: string): Element | null {
  if (typeof document === 'undefined') return null
  try {
    return document.querySelector(`[data-ink-key="${CSS.escape(key)}"]`)
  } catch {
    return null
  }
}

/** Where an element sits: its box on screen and, when it is placed in a CSS grid (a column operation), its row and
 *  column there. The grid places a row of cells written units first in the DOM with the units on the right. */
function placeOf(el: Element): { top: number; left: number; row: number; col: number } {
  const r = el.getBoundingClientRect()
  let row = 0
  let col = 0
  for (let e: Element | null = el; e; e = e.parentElement) {
    const st = (e as HTMLElement).style
    if (st && (st.gridRow || st.gridColumn)) {
      row = parseInt(st.gridRow, 10) || 0
      col = parseInt(st.gridColumn, 10) || 0
      break
    }
  }
  return { top: Math.round(r.top), left: Math.round(r.left), row, col }
}

/**
 * The reads of the ink on screen in the order they appear (top to bottom, left to right), not the order they were
 * written: a column answer written units first still reads «625». Carry cells are left out (they are not the answer).
 */
export function readsOnScreen(store: LearningStore): { key: string; read: InkRead }[] {
  const reads = store.liveReads().filter(({ read }) => !read.carry)
  const at = new Map(reads.map(({ key }) => {
    const el = elementOf(key)
    return [key, el ? { el, ...placeOf(el) } : null]
  }))
  return reads
    .map((r, i) => ({ r, i }))
    .sort((x, y) => {
      const a = at.get(x.r.key)
      const b = at.get(y.r.key)
      if (!a || !b || a.el === b.el) return x.i - y.i
      if (a.top !== b.top) return a.top - b.top
      if (a.left !== b.left) return a.left - b.left
      if (a.row !== b.row) return a.row - b.row
      if (a.col !== b.col) return a.col - b.col
      return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
    .map(({ r }) => r)
}

/** The handwritten digits the child has not confirmed yet, for the misread checks (carries are not the answer). */
export function readDigitsOf(store: LearningStore): ReadDigit[] {
  return store.liveReads().filter(({ read }) => !read.confirmed && !read.carry)
    .map(({ key, read }) => ({ key, digit: read.digit, confidence: read.confidence, alternatives: read.alternatives, altP: read.altP }))
}

/** The digits read from the ink on screen, for the review log of a wrong answer. null when nothing was handwritten. */
export function inkReadingOf(
  store: LearningStore, o: { kind: string; given: string; recognitionFixes: number; method?: string; oneDigitFix: boolean },
): InkReading | null {
  const reads = readsOnScreen(store)
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

/**
 * "He leído 47. ¿Es lo que has escrito?" — «Sí» grades what was read; «No, el 7 es un 2» sets that digit (she presses
 * Comprobar again); «No, lo escribo otra vez» erases that digit to write it again. Nothing is graded meanwhile.
 */
export function askMisread(store: LearningStore, o: {
  shown: string; key: string; owner?: object; alt?: number; onYes: () => void; onNo?: () => void
}): void {
  const read = store.liveReads().find((r) => r.key === o.key)?.read.digit
  const choose = o.alt != null && read != null && read !== o.alt ? { from: read, to: o.alt } : null
  store.ask({
    kind: 'misread',
    text: `He leído ${o.shown}. ¿Es lo que has escrito?`,
    shown: o.shown,
    key: o.key,
    ...(o.owner ? { owner: o.owner } : {}),
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
      ...(choose ? [{
        label: `No, el ${choose.from} es un ${choose.to}`,
        run: () => {
          store.closeQuestion()
          o.onNo?.()
          store.choose(o.key, choose.to)
          store.confirmRead(o.key, choose.to)
        },
      }] : []),
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
export function askReversed(store: LearningStore, meant: string, owner?: object): void {
  store.ask({
    kind: 'reversed',
    ...(owner ? { owner } : {}),
    text: `¿Querías escribir ${meant}? En la cuenta las cifras se escriben de derecha a izquierda.`,
    speak: `¿Querías escribir ${meant}? En la cuenta, las cifras se escriben de derecha a izquierda: primero las unidades.`,
    shown: meant,
    actions: [{ label: 'Vale, lo arreglo', primary: true, run: () => store.closeQuestion() }],
  })
}
