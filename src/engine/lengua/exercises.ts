/* Every kind of Lengua de 3.º in one place: the generator, the checker, the hints and the statement line of each one.
   The grammar kinds live in grammar.ts; spelling in spelling.ts; syllables in syllables.ts; vocabulary in vocabulary.ts. */
import type { Answer, CheckResult, ExerciseKind, Hint, LenguaExercise, Rng, SkillKey } from '@/types'
import { buildGrammar, checkGrammar, grammarStatement, hintsGrammar } from './grammar'
import { buildDictation, buildMissingLetter, buildPunctuation, checkSpelling, hintsSpelling, statementSpelling } from './spelling'
import { buildStress, buildSyllables, checkStress, checkSyllables, hintsSyllables, statementSyllables } from './syllables'
import { buildAlphabet, buildPair, checkAlphabet, checkPair, hintsVocabulary, statementVocabulary } from './vocabulary'

export const LENGUA_KINDS: ExerciseKind[] = [
  'lng-tap-words', 'lng-sentence-parts', 'lng-classify', 'lng-transform',
  'lng-missing-letter', 'lng-punctuation', 'lng-stress', 'lng-syllables', 'lng-dictation', 'lng-alphabet', 'lng-pair-words',
]

/** The exercise of a Lengua kind for one skill. box is the child's mastery box of the skill: from box 2 the answer is typed
    (a missing letter is written, a syllable split is chosen from the three, a dictation is a sentence). */
export function buildLengua(kind: ExerciseKind, skill: SkillKey, rng: Rng, box = 0): LenguaExercise {
  switch (kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts':
    case 'lng-classify':
    case 'lng-transform': return buildGrammar(kind, skill, rng)
    case 'lng-missing-letter': return buildMissingLetter(skill, rng, box)
    case 'lng-punctuation': return buildPunctuation(skill, rng)
    case 'lng-stress': return buildStress(skill, rng)
    case 'lng-syllables': return buildSyllables(skill, rng, box >= 2 ? 'split' : 'count')
    case 'lng-dictation': return buildDictation(skill, rng, box)
    case 'lng-alphabet': return buildAlphabet(skill, rng)
    case 'lng-pair-words': return buildPair(skill, rng)
  }
  throw new Error(`lengua: '${kind}' is not a Lengua kind`)
}

export function checkLengua(ex: LenguaExercise, answer: Answer): CheckResult {
  switch (ex.kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts':
    case 'lng-classify':
    case 'lng-transform': return checkGrammar(ex, answer)
    case 'lng-missing-letter':
    case 'lng-punctuation':
    case 'lng-dictation': return checkSpelling(ex, answer)
    case 'lng-stress': return checkStress(ex, answer)
    case 'lng-syllables': return checkSyllables(ex, answer)
    case 'lng-alphabet': return checkAlphabet(ex, answer)
    case 'lng-pair-words': return checkPair(ex, answer)
  }
}

export function hintsLengua(ex: LenguaExercise): Hint[] {
  switch (ex.kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts':
    case 'lng-classify':
    case 'lng-transform': return hintsGrammar(ex)
    case 'lng-missing-letter':
    case 'lng-punctuation':
    case 'lng-dictation': return hintsSpelling(ex)
    case 'lng-stress':
    case 'lng-syllables': return hintsSyllables(ex)
    case 'lng-alphabet':
    case 'lng-pair-words': return hintsVocabulary(ex)
  }
}

/** One line for the daily plan and for the adults' reports. A dictation never shows its text. */
export function lenguaStatement(ex: LenguaExercise): string {
  switch (ex.kind) {
    case 'lng-tap-words':
    case 'lng-sentence-parts':
    case 'lng-classify':
    case 'lng-transform': return grammarStatement(ex)
    case 'lng-missing-letter':
    case 'lng-punctuation':
    case 'lng-dictation': return statementSpelling(ex)
    case 'lng-stress':
    case 'lng-syllables': return statementSyllables(ex)
    case 'lng-alphabet':
    case 'lng-pair-words': return statementVocabulary(ex)
  }
}
