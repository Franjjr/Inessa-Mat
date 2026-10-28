/* Prueba inicial de Lengua de 3.º: twelve items in three blocks (gramática, ortografía, vocabulario), no reading and no
   dictation (it needs the sound). Like the maths one: no hints, no feedback, «No lo sé» counts as not known, and each answer
   goes through the normal mastery update. Pure: builds the items. */
import type { Exercise, SkillKey } from '@/types'
import { generate } from '../generate'
import { createRng, hashString } from '../rng'
import { lenguaSkill } from '../skills'

/** Attempts of the Lengua placement carry this activity name in their context. */
export const LENGUA_PLACEMENT_ACTIVITY = 'prueba-lengua'

export type LenguaPlacementBlockId = 'gramatica' | 'ortografia' | 'vocabulario'

export const LENGUA_PLACEMENT_BLOCKS: { id: LenguaPlacementBlockId; label: string }[] = [
  { id: 'gramatica', label: 'Gramática' },
  { id: 'ortografia', label: 'Ortografía' },
  { id: 'vocabulario', label: 'Vocabulario' },
]

export const LENGUA_PLACEMENT_COUNT = 12

const PLAN: { block: LenguaPlacementBlockId; skills: SkillKey[] }[] = [
  {
    block: 'gramatica',
    skills: [lenguaSkill('gram', 'sustantivo', 'genero'), lenguaSkill('gram', 'articulo'), lenguaSkill('gram', 'adjetivo'), lenguaSkill('gram', 'verbo', 'presente')],
  },
  {
    block: 'ortografia',
    skills: [lenguaSkill('orto', 'mayusculas'), lenguaSkill('orto', 'c-qu'), lenguaSkill('orto', 'signos', 'punto'), lenguaSkill('orto', 'tonica')],
  },
  {
    block: 'vocabulario',
    skills: [lenguaSkill('voc', 'abecedario'), lenguaSkill('voc', 'sinonimos'), lenguaSkill('voc', 'familias'), lenguaSkill('voc', 'compuestas')],
  },
]

export interface LenguaPlacementItem {
  block: LenguaPlacementBlockId
  exercise: Exercise
}

/** The items of the Lengua placement, in order. The same seed and day give the same items. */
export function buildLenguaPlacement(seed: string, now: Date = new Date()): LenguaPlacementItem[] {
  const rng = createRng(hashString(seed))
  const out: LenguaPlacementItem[] = []
  for (const { block, skills } of PLAN) {
    for (const skill of skills) {
      const [exercise] = generate({ skills: [skill] }, 1, { rng: createRng(hashString(`${skill}:${rng()}`)), now })
      if (exercise) out.push({ block, exercise })
    }
  }
  return out
}

/** The block of a Lengua placement skill, or null when the placement does not test it. */
export function lenguaPlacementBlockOf(skill: SkillKey): LenguaPlacementBlockId | null {
  return PLAN.find((p) => p.skills.includes(skill))?.block ?? null
}
