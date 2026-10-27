/* Lectura y literatura de Lengua de 3.º (lng-read-*): the questions of the readings in src/content/lengua/stories, one exercise
   each. A choice question: the child taps the right option. A text question: the child writes a word of the text (or the
   answer of a riddle), compared with 'ignore-case'. An order question: the child taps the events in the order of the text.
   The events are shuffled from the question's own seed, so every screen shows the same order. Hints never give the answer. */
import { READINGS } from '@/content/lengua/stories'
import type {
  Answer, CheckResult, ExerciseKind, Hint, LngReadChoiceExercise, LngReadOrderExercise, LngReadTextExercise, ReadingDef,
  ReadingQuestion, Rng, SkillKey,
} from '@/types'
import { createRng, hashString, shuffle } from '../rng'
import { compareText, normalizeAnswer } from './text'

export type ReadingExercise = LngReadChoiceExercise | LngReadTextExercise | LngReadOrderExercise

const CHILD = '¡Muy bien, {child}!'
const RIDDLE_SKILL: SkillKey = 'lng:lit:adivinanzas'

/** The exercise kind of a question. */
export function readingKind(q: ReadingQuestion): ExerciseKind {
  switch (q.kind) {
    case 'choice': return 'lng-read-choice'
    case 'text': return 'lng-read-text'
    case 'order': return 'lng-read-order'
  }
}

/** One question of a reading as an exercise. The id is stable (reading id and question number), so an attempt names its question. */
export function readingExercise(reading: ReadingDef, index: number, rng: Rng = createRng(hashString(reading.id))): ReadingExercise {
  const q = reading.questions[index]
  if (!q) throw new Error(`reading: '${reading.id}' has no question ${index}`)
  const id = `reading:${reading.id}:${index}`
  const base = { id, skill: q.skill, difficulty: 2, reading: reading.id, question: q.prompt }
  switch (q.kind) {
    case 'choice': return { ...base, kind: 'lng-read-choice', options: [...q.options], answer: q.answer }
    case 'text': return { ...base, kind: 'lng-read-text', answer: q.answer }
    case 'order': {
      const correct = q.events.map((_, i) => i)
      const shown = shuffle(rng, correct)
      // The events never come out already in order: a sorted shuffle is reversed.
      const order = shown.join() === correct.join() ? [...shown].reverse() : shown
      return { ...base, kind: 'lng-read-order', events: order.map((i) => q.events[i]), targets: correct.map((i) => order.indexOf(i)) }
    }
  }
}

/** Every question of the readings, as [reading, question number], by the exercise kind and skill that asks it. */
function bank(kind: ExerciseKind, skill: SkillKey): [ReadingDef, number][] {
  const out: [ReadingDef, number][] = []
  for (const reading of READINGS) {
    reading.questions.forEach((q, i) => {
      if (q.skill === skill && readingKind(q) === kind) out.push([reading, i])
    })
  }
  return out
}

/** The exercise of a reading kind for one skill: a question picked from the readings that practise it. */
export function buildReading(kind: ExerciseKind, skill: SkillKey, rng: Rng): ReadingExercise {
  const candidates = bank(kind, skill)
  if (candidates.length === 0) throw new Error(`reading: no ${kind} question for '${skill}'`)
  const [reading, index] = candidates[Math.floor(rng() * candidates.length)]
  return readingExercise(reading, index, rng)
}

export function checkReading(ex: ReadingExercise, answer: Answer): CheckResult {
  if (ex.kind === 'lng-read-choice') {
    if (answer.type !== 'choice' || answer.index === null) {
      return { correct: false, given: '', expected: ex.options[ex.answer], errorType: 'incomplete', feedback: 'Elige una respuesta.' }
    }
    const given = ex.options[answer.index] ?? ''
    if (answer.index === ex.answer) return { correct: true, given, expected: ex.options[ex.answer], feedback: CHILD }
    return {
      correct: false, given, expected: ex.options[ex.answer], errorType: 'reading',
      feedback: 'Vuelve a leer el texto y busca la frase que responde a la pregunta.',
    }
  }
  if (ex.kind === 'lng-read-text') {
    if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la palabra.' }
    const value = normalizeAnswer(answer.value ?? '')
    if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la palabra.' }
    const r = compareText(value, ex.answer, 'ignore-case')
    if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: CHILD }
    if (r.accentOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'reading', feedback: '¡Casi! Mira la tilde.' }
    return {
      correct: false, given: value, expected: ex.answer, errorType: 'reading',
      feedback: 'Vuelve a leer la pregunta y busca la palabra en el texto.',
    }
  }
  const expected = ex.targets.map((i) => ex.events[i]).join(' · ')
  if (answer.type !== 'marks') return { correct: false, given: '', expected, errorType: 'other', feedback: 'Toca las frases en orden.' }
  const given = answer.marked.map((i) => ex.events[i]).join(' · ') || '—'
  if (answer.marked.length === ex.targets.length && answer.marked.every((v, i) => v === ex.targets[i])) {
    return { correct: true, given, expected, feedback: CHILD }
  }
  if (answer.marked.length < ex.targets.length) {
    return { correct: false, given, expected, errorType: 'incomplete', feedback: 'Te faltan frases: sigue con las que quedan.' }
  }
  return { correct: false, given, expected, errorType: 'reading', feedback: 'Piensa qué pasa primero en la historia y qué pasa al final.' }
}

export function hintsReading(ex: ReadingExercise): Hint[] {
  if (ex.kind === 'lng-read-choice') {
    return [
      { level: 1, text: 'Lee otra vez el texto despacio. ¿Qué frase responde a la pregunta?', visual: 'none' },
      { level: 2, text: 'Mira las opciones una a una: alguna no aparece en el texto y otra no tiene nada que ver con la pregunta.', visual: 'none' },
      { level: 3, text: 'Busca en el texto la frase que habla de eso y compárala con cada opción.', visual: 'none' },
    ]
  }
  if (ex.kind === 'lng-read-text' && ex.skill === RIDDLE_SKILL) {
    return [
      { level: 1, text: 'Lee la adivinanza otra vez y piensa en cada pista, una a una.', visual: 'none' },
      { level: 2, text: '¿Qué se puede hacer con ello? ¿Dónde se encuentra? ¿De qué color es?', visual: 'none' },
      { level: 3, text: 'Piensa en algo que tengas en casa o en la clase y que encaje con las tres pistas.', visual: 'none' },
    ]
  }
  if (ex.kind === 'lng-read-text') {
    return [
      { level: 1, text: 'Lee la pregunta otra vez y busca en el texto la frase donde se habla de eso.', visual: 'none' },
      { level: 2, text: 'Fíjate en lo que hace o cómo es la persona, el animal o la cosa de esa frase.', visual: 'none' },
      { level: 3, text: 'Busca una palabra que signifique lo mismo que la pregunta y escríbela tal como aparece en el texto.', visual: 'none' },
    ]
  }
  return [
    { level: 1, text: 'Piensa qué pasa primero en la historia y qué pasa al final.', visual: 'none' },
    { level: 2, text: 'Busca las palabras que dicen cuándo pasa algo: primero, después, luego, al final.', visual: 'none' },
    { level: 3, text: 'Ordena las frases de la primera a la última, como las cuenta el texto.', visual: 'none' },
  ]
}

/** One line for the daily plan and for the adults' reports. */
export function statementReading(ex: ReadingExercise): string {
  return `Lectura: ${ex.question}`
}
