/* Prueba inicial de Inglés de 3.º: ten items in five blocks (saludos, números, colores, animales, comida). It has no listening
   kind, so it is the same with the sound off. «No lo sé» counts as not known, and the answers go through the normal mastery
   update, as in the maths and Lengua placements (src/engine/placement.ts, lengua/placement.ts). Pure: builds the items. */
import type { Exercise, ExerciseKind, SkillKey } from '@/types'
import { generate } from '../generate'
import { createRng, hashString } from '../rng'
import { englishSkill } from '../skills'

/** Attempts of the English placement carry this activity name in their context. */
export const ENGLISH_PLACEMENT_ACTIVITY = 'prueba-ingles'

export type EnglishPlacementBlockId = 'saludos' | 'numeros' | 'colores' | 'animales' | 'comida'

export const ENGLISH_PLACEMENT_BLOCKS: { id: EnglishPlacementBlockId; label: string }[] = [
  { id: 'saludos', label: 'Saludos' },
  { id: 'numeros', label: 'Números' },
  { id: 'colores', label: 'Colores' },
  { id: 'animales', label: 'Animales' },
  { id: 'comida', label: 'Comida' },
]

export const ENGLISH_PLACEMENT_COUNT = 10

const PLAN: { block: EnglishPlacementBlockId; skill: SkillKey; kind: ExerciseKind }[] = [
  { block: 'saludos', skill: englishSkill('frase', 'saludos'), kind: 'eng-complete' },
  { block: 'saludos', skill: englishSkill('voc', 'saludos'), kind: 'eng-write-word' },
  { block: 'numeros', skill: englishSkill('num', '0-20'), kind: 'eng-num-write' },
  { block: 'numeros', skill: englishSkill('num', '0-20'), kind: 'eng-num-write' },
  { block: 'numeros', skill: englishSkill('num', 'decenas'), kind: 'eng-num-write' },
  { block: 'colores', skill: englishSkill('voc', 'colores'), kind: 'eng-match' },
  { block: 'colores', skill: englishSkill('voc', 'colores'), kind: 'eng-write-word' },
  { block: 'animales', skill: englishSkill('voc', 'animales'), kind: 'eng-match' },
  { block: 'animales', skill: englishSkill('frase', 'its-a'), kind: 'eng-complete' },
  { block: 'comida', skill: englishSkill('voc', 'comida'), kind: 'eng-write-word' },
]

/** The block of an English placement skill, or null when the placement does not test it. */
export function englishPlacementBlockOf(skill: SkillKey): EnglishPlacementBlockId | null {
  return PLAN.find((p) => p.skill === skill)?.block ?? null
}

export interface EnglishPlacementItem {
  block: EnglishPlacementBlockId
  exercise: Exercise
}

/** The items of the English placement, in order. The same seed and day give the same items. */
export function buildEnglishPlacement(seed: string, now: Date = new Date()): EnglishPlacementItem[] {
  const rng = createRng(hashString(seed))
  const used: string[] = []
  const out: EnglishPlacementItem[] = []
  for (const { block, skill, kind } of PLAN) {
    const [exercise] = generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(hashString(`${skill}:${kind}:${rng()}`)), now, avoidIds: used })
    if (exercise) {
      used.push(exercise.id)
      out.push({ block, exercise })
    }
  }
  return out
}
