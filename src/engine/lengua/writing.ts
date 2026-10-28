/* Escritura de Lengua de 3.º: copiar una frase (lng-copy, escr:copia) y la escritura guiada corta (lng-guided, escr:guiada):
   una invitación, una nota, una carta o una descripción con huecos que el niño completa. La copia se puntúa como un dictado
   (la frase exacta, con mayúsculas y signos). La guiada no se puntúa: cuenta como hecha al terminarla (isCompletionOnly).
   Las pistas nunca dan la frase ni las palabras de un hueco. */
import type { Answer, CheckResult, Hint, LngCopyExercise, LngGuidedExercise, Rng, SkillKey } from '@/types'
import { pick } from '../rng'
import { compareText, normalizeAnswer } from './text'

/** Sentences to copy: capitals, accents, ñ and the final mark are part of what is written. Masculine generic. */
export const COPY_SENTENCES: string[] = [
  'El sol brilla en el cielo azul.', 'Lucía lee un cuento a su hermano.', '¿Quieres venir al parque conmigo?',
  'Mi perro se llama Canela y come pollo.', '¡Qué bonito es el mar en verano!', 'La abuela prepara una sopa calentita.',
  'Pablo juega con su pelota roja.', 'En otoño, las hojas caen de los árboles.', 'Hoy hace frío, así que llevo bufanda.',
  'El tren llega a la estación a las cinco.', 'Compramos pan, leche y naranjas.', '¿Cuántos años tiene tu gato?',
  'El caracol avanza despacio por el jardín.', '¡Vamos a la playa con la clase!', 'Mi amigo tiene un perro muy simpático.',
  'La niña del vestido azul canta muy bien.',
]

export function buildCopy(skill: SkillKey, rng: Rng): LngCopyExercise {
  const answer = pick(rng, COPY_SENTENCES)
  return { id: `lng-copy:${answer}`, kind: 'lng-copy', skill, difficulty: 2, answer }
}

function checkCopy(ex: LngCopyExercise, answer: Answer): CheckResult {
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.answer, errorType: 'other', feedback: 'Escribe la frase.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.answer, errorType: 'incomplete', feedback: 'Escribe la frase entera.' }
  const r = compareText(value, ex.answer, 'exact')
  if (r.correct) return { correct: true, given: value, expected: ex.answer, feedback: '¡Muy bien, {child}!' }
  if (r.caseOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'capital', feedback: 'Revisa las mayúsculas: al empezar y en los nombres.' }
  if (r.accentOnly) return { correct: false, given: value, expected: ex.answer, errorType: 'spelling', feedback: '¡Casi! Mira las tildes de la frase.' }
  return { correct: false, given: value, expected: ex.answer, errorType: 'spelling', feedback: 'Compara palabra a palabra con la frase de arriba.' }
}

/** A text the child writes in blanks: the model shows the fixed pieces, and each blank has its question. */
export interface GuidedItem { task: string; parts: string[]; prompts: string[] }

/** Invitation, note, letter and description: short, with three or four blanks, masculine generic. */
export const GUIDED_ITEMS: GuidedItem[] = [
  {
    task: 'Completa la invitación a tu fiesta',
    parts: ['Hola, ', '. Te invito a mi ', ' el ', ' a las ', '. ¡No faltes!'],
    prompts: ['¿Cómo se llama tu invitado?', '¿Qué celebras?', '¿Qué día es?', '¿A qué hora empieza?'],
  },
  {
    task: 'Completa la nota para tu familia',
    parts: ['Familia: he ido a ', '. Vuelvo a las ', '. Un abrazo de ', '.'],
    prompts: ['¿A dónde has ido?', '¿A qué hora vuelves?', '¿Quién firma la nota?'],
  },
  {
    task: 'Completa la carta a un amigo',
    parts: ['Querido amigo: el domingo fui a ', '. Lo que más me gustó fue ', '. Un abrazo de ', '.'],
    prompts: ['¿A qué lugar fuiste?', '¿Qué fue lo que más te gustó?', '¿Cómo te despides?'],
  },
  {
    task: 'Describe tu objeto favorito',
    parts: ['Mi ', ' es ', '. Tiene ', ' y me gusta porque es ', '.'],
    prompts: ['¿Qué objeto es?', '¿Cómo es? Di una palabra que lo describa', '¿Qué tiene?', '¿Por qué te gusta? Di otra palabra que lo describa'],
  },
]

export function buildGuided(skill: SkillKey, rng: Rng): LngGuidedExercise {
  const item = pick(rng, GUIDED_ITEMS)
  return {
    id: `lng-guided:${item.task}`, kind: 'lng-guided', skill, difficulty: 3, task: item.task, parts: item.parts, prompts: item.prompts,
  }
}

/** The text the child has written: the fixed pieces with each blank filled (the view composes it). An empty text is
    incomplete; there is no right text to compare with, so a finished text is correct. */
function checkGuided(ex: LngGuidedExercise, answer: Answer): CheckResult {
  if (answer.type !== 'text') return { correct: false, given: '', expected: ex.task, errorType: 'other', feedback: 'Escribe el texto.' }
  const value = normalizeAnswer(answer.value ?? '')
  if (!value) return { correct: false, given: '', expected: ex.task, errorType: 'incomplete', feedback: 'Escribe lo que falta en cada hueco.' }
  return { correct: true, given: value, expected: ex.task, feedback: '¡Muy bien, {child}! Tu texto está listo.' }
}

/** A guided text is not graded: its attempt is recorded with graded: false (outside accuracy and the session counts). */
export const isCompletionOnly = (kind: string): boolean => kind === 'lng-guided'

export function checkWriting(ex: LngCopyExercise | LngGuidedExercise, answer: Answer): CheckResult {
  return ex.kind === 'lng-copy' ? checkCopy(ex, answer) : checkGuided(ex, answer)
}

const hint = (level: 1 | 2 | 3, text: string, visual: Hint['visual'] = 'none', params?: Hint['params']): Hint =>
  params ? { level, text, visual, params } : { level, text, visual }

export function hintsWriting(ex: LngCopyExercise | LngGuidedExercise): Hint[] {
  if (ex.kind === 'lng-copy') {
    return [
      hint(1, 'Mira la frase de arriba y copia palabra a palabra, sin cambiar ninguna letra.'),
      hint(2, 'Fíjate en la mayúscula con la que empieza y en el signo con el que termina.', 'words', { words: ['mayúscula al empezar', 'punto, ¿? o ¡! al final'] }),
      hint(3, 'Copia despacio, una palabra cada vez. ¿Has revisado las tildes y los signos antes de seguir?'),
    ]
  }
  return [
    hint(1, 'Lee el modelo: cada hueco es una pregunta. Responde a una por una, con palabras tuyas.'),
    hint(2, 'Una frase corta tiene una idea. Empieza con mayúscula y acaba con punto.', 'words', { words: ['una idea por frase', 'mayúscula al empezar', 'punto al final'] }),
    hint(3, 'Escribe cada hueco con una palabra o una frase corta. ¿Están todos escritos? Entonces pulsa para terminar.'),
  ]
}

/** One line for the daily plan and for the adults. A copy never shows its sentence. */
export function statementWriting(ex: LngCopyExercise | LngGuidedExercise): string {
  return ex.kind === 'lng-copy' ? 'Copia una frase con el teclado' : `Escritura guiada: ${ex.task.toLocaleLowerCase('es')}`
}
