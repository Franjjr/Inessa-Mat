/* V11: the sentence the «Escuchar» button reads never says the answer the child has to find. It covers every skill of
   2.º, 3.º and 4.º: for each exercise whose answer is a number, that number is not in the sentence, neither as digits
   nor as the words the voice says — unless the number is already one of the data of the exercise (e.g. 2 × 2 = 4 has
   no 4 to hide when the product is asked, but "Hay 2 grupos de 2" shows a 2 that is a datum, not the answer). */
import { describe, expect, it } from 'vitest'
import { toSpeakable } from '@/audio/speechText'
import { numberToSpanish } from '@/audio/spanishNumbers'
import { allTopics, syllabusForGrade } from '@/content/syllabus'
import { createRng, generate } from '@/engine'
import { statementFor } from '@/engine/statement'
import type { Exercise } from '@/types'

function sample(): Exercise[] {
  const out: Exercise[] = []
  for (const grade of [2, 3, 4]) {
    for (const topic of allTopics(syllabusForGrade(grade))) {
      for (const skill of topic.skills) {
        for (const seed of [1, 2, 3, 4]) {
          try {
            out.push(...generate({ skills: [skill] }, 2, { rng: createRng(seed) }))
          } catch {
            // A pending skill has nothing to read.
          }
        }
      }
    }
  }
  return out
}

/** The numbers the child has to write, when the answer is a plain number (or a list of numbers). */
function answerNumbers(ex: Exercise): number[] {
  switch (ex.kind) {
    case 'fact-mul': return [ex.a * ex.b]
    case 'fact-div': return [ex.dividend / ex.divisor]
    case 'missing-factor': return [ex.missing === 'b' ? ex.product / ex.a : ex.product / ex.b]
    case 'groups': return [ex.groups * ex.perGroup]
    case 'array': return [ex.rows * ex.cols]
    case 'column-add':
    case 'column-sub':
    case 'column-mul':
    case 'long-mul':
      return [ex.answer]
    case 'division': return [ex.quotient]
    case 'word-problem':
    case 'bar-problem':
    case 'fraction-of':
    case 'perimeter':
    case 'shape-count':
      return typeof ex.answer === 'number' ? [ex.answer] : []
    case 'skip-count': return ex.hiddenIndexes.map((i) => ex.values[i])
    // In «words» mode the words are on the screen and the child writes them in digits: the words are the prompt.
    case 'place-value': return ex.mode === 'blocks' && typeof ex.answer === 'number' ? [ex.answer] : []
    case 'ordinal': return ex.mode === 'write' ? [ex.n] : []
    case 'mental':
    case 'round':
    case 'area':
      return [ex.answer]
    case 'equation': return typeof ex.answer === 'number' ? [ex.answer] : []
    case 'time-duration': return typeof ex.answer === 'number' ? [ex.answer] : []
    case 'decimal': return ex.mode === 'money' ? [Math.floor(ex.value / 100), ex.value % 100].filter((n) => n > 1) : []
    default: return []
  }
}

/** Every number written in the sentence as digits (the data of the exercise). */
function dataNumbers(text: string): Set<number> {
  return new Set([...text.replace(/(\d)[  ](?=\d{3})/g, '$1').matchAll(/\d+/g)].map((m) => Number(m[0])))
}

/** Whether the spoken text says the number n as a whole number (not "dos" inside "cuarenta y dos" or "doscientos"). */
/** Any word that is part of a number said in Spanish. */
const NUMBER_WORD = String.raw`(?:y|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieci\p{L}+|veint\p{L}*|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|\p{L}+ientos|\p{L}+ientas|mil|millón|millones|coma)`

function saysNumber(said: string, n: number): boolean {
  const words = numberToSpanish(n)
  // The answer's words, with no other number word glued before or after them.
  const re = new RegExp(`(?<!${NUMBER_WORD}\\s+|\\p{L})${words}(?!\\p{L}|\\s+${NUMBER_WORD}(?!\\p{L}))`, 'iu')
  return re.test(said)
}

describe('statementFor never says the answer', () => {
  const exercises = sample()

  it('the sample includes the skills of 2.º', () => {
    const second = allTopics(syllabusForGrade(2)).flatMap((t) => t.skills)
    expect(second.length).toBeGreaterThan(0)
    expect(exercises.some((ex) => second.includes(ex.skill))).toBe(true)
  })

  it('the check itself catches a sentence that says the answer, and not a number that only contains it', () => {
    expect(saysNumber(toSpeakable('Hay 6 grupos de 7, son 42.'), 42)).toBe(true)
    expect(saysNumber(toSpeakable('Ordena 42 y 300.'), 2)).toBe(false)
    expect(saysNumber(toSpeakable('Divide 200 entre 5.'), 2)).toBe(false)
    expect(saysNumber(toSpeakable('Redondea 509 a las centenas.'), 500)).toBe(false)
    expect(saysNumber(toSpeakable('Redondea 509: son 500.'), 500)).toBe(true)
  })

  it('no exercise of 2.º, 3.º or 4.º says its answer aloud', () => {
    const leaks: string[] = []
    for (const ex of exercises) {
      const text = statementFor(ex)
      const data = dataNumbers(text)
      const said = toSpeakable(text)
      for (const n of answerNumbers(ex)) {
        if (!Number.isFinite(n)) continue
        // The ordinal word is on the screen; the numeral is the answer and must not be in the sentence.
        if (ex.kind === 'ordinal') {
          if (data.has(n)) leaks.push(`ordinal: «${text}» escribe ${n}`)
          continue
        }
        // The answer is also a datum of the exercise (2 grupos de 2 → 4 has none; 1 × 4 → 4 is a datum): nothing leaks.
        if (data.has(n)) continue
        if (saysNumber(said, n)) leaks.push(`${ex.kind} ${ex.skill}: «${text}» → «${said}» dice ${n}`)
      }
    }
    expect(leaks).toEqual([])
  })

  it('rounds to «los millares», not «las millares»', () => {
    const ex = { id: 'r', kind: 'round', skill: 'num:round:1000', difficulty: 1, value: 8034, to: 1000, answer: 8000 } as Exercise
    expect(statementFor(ex)).toBe('Redondea 8 034 a los millares.')
    expect(statementFor({ ...ex, to: 10, answer: 8030 } as Exercise)).toBe('Redondea 8 034 a las decenas.')
  })
})
