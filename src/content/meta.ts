/* Season-level copy and optional extras used around the finale (chest, diploma, teaser). */
import type { ActivityConfig, TemplateString } from '@/types'

/** Optional teach-back game for the finale ("Enséñale a Borrón"): the child solves the 6/7/8 facts *for* Borrón.
    Hosts may run it between the finale's confession and the secret word; the finale story also works on its own. */
export const TEACH_BACK_ACTIVITY: ActivityConfig = {
  kind: 'facts',
  title: 'Enséñale a Borrón',
  instructions: 'Borrón quiere aprender. Resuelve cada multiplicación y enséñale tu truco favorito.',
  selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [3, 9] },
  count: 6,
  params: { showTrick: true, helper: 'borron' },
}

/** Season 2 teaser shown after the finale and on the season map (locked, "Próximamente"). */
export const SEASON2_TEASER = {
  id: 's2',
  name: 'Las Islas de las Fracciones',
  label: 'Próximamente',
  text: 'Entre las nubes asoman unas islas… ¡Pronto empezará una nueva aventura!',
} as const

/** Printable diploma copy (rendered with renderTemplate). Mirrors the workbook's "Diploma de Gran Maga". */
export const DIPLOMA_TEXT: { kicker: TemplateString; title: TemplateString; subtitle: TemplateString; givenTo: TemplateString; body: TemplateString; signature: TemplateString } = {
  kicker: 'Reino de Numeria',
  title: 'DIPLOMA',
  subtitle: '{cg:de Gran Maga de los Números|de Gran Mago de los Números}',
  givenTo: 'Se entrega a',
  body:
    'por encontrar los 8 cristales mágicos de Numeria, conquistar las tablas del 6, del 7 y del 8, sumar, restar, ' +
    'multiplicar y dividir {cg:como una auténtica maga|como un auténtico mago} y demostrar que es muy VALIENTE.',
  signature: 'Lumi, unicornio guardián',
}

/** Words of the Gran Cofre screen. The prize itself is set by the adult in the adult area. */
export const CHEST_TEXT: { locked: TemplateString; prompt: TemplateString; open: TemplateString } = {
  locked: 'El Gran Cofre necesita las 8 letras de la palabra secreta.',
  prompt: 'Escribe la palabra secreta y dila en voz alta, {child}.',
  open: '¡El Gran Cofre se ha abierto! Dentro hay una sorpresa solo para ti.',
}
