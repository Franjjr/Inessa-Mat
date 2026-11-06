/* The guardians of the island, one per stage (src/content/ingles/island.ts). Each one is beaten with the stage's English
   exercises, the listening kinds left out (ISLAND_KINDS): six items in rounds of the stage's skill families, pass with all
   but one right, no timer. There is no Hechizo del Cristal and no letter: the island is not the secret word. */
import type { GuardianDef, SkillSelector } from '@/types'
import { familiesOf, ISLAND_STAGES } from './island'

const ITEMS = 6

function guardianOf(stage: (typeof ISLAND_STAGES)[number]): GuardianDef {
  const families = familiesOf(stage)
  const perRound = ITEMS / families.length
  const rounds = families.map((f) => ({ selector: { skills: f.skills, kinds: f.kinds } as SkillSelector, count: perRound }))
  return {
    id: `isla-${stage.n}-guardian`,
    character: stage.guardian,
    title: stage.guardianTitle,
    intro: `¡Hola, {child}! Demuéstrame lo que sabes de ${stage.name.toLowerCase()} en inglés, y tu compañero podrá salir de la niebla.`,
    rounds,
    passMin: ITEMS - 1,
    letter: '',
    rescueStory: `isla-${stage.n}-rescate`,
    retryText: '¡Casi, {child}! Repasa la clase de esta etapa con Lumi y vuelve a intentarlo. ¡Te espero!',
  }
}

export const islandGuardians: GuardianDef[] = ISLAND_STAGES.map(guardianOf)
