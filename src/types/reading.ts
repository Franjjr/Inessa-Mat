import type { SkillKey } from './exercise'

/** A reading of Lengua de 3.º (lectura y literatura): a story, a poem or a riddle, with its questions. `text` is a list of
    paragraphs (template strings: {child} and {pet}); each paragraph is at most 400 characters (the speech service). */
export interface ReadingDef {
  id: string
  title: string
  text: string[]
  questions: ReadingQuestion[]
  /** The skills the reading practises (each question carries one of them). */
  skills: SkillKey[]
}

interface ReadingQuestionBase {
  /** The question, as the child reads it. */
  prompt: string
  skill: SkillKey
}

/** The child taps one option; `answer` is the index of the right one (options are shown in this order). */
export interface ReadingChoiceQuestion extends ReadingQuestionBase {
  kind: 'choice'
  options: string[]
  answer: number
}
/** The child writes one word from the text; compared with 'ignore-case' (accents count). */
export interface ReadingTextQuestion extends ReadingQuestionBase {
  kind: 'text'
  answer: string
  rule: 'ignore-case'
}
/** The events of the text, in the order they happen (`events` is the right order; the child sees them shuffled). */
export interface ReadingOrderQuestion extends ReadingQuestionBase {
  kind: 'order'
  events: string[]
}

export type ReadingQuestion = ReadingChoiceQuestion | ReadingTextQuestion | ReadingOrderQuestion
