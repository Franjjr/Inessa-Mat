/* Finale of the 2.º adventure: the same scenes as the 3.º finale (src/content/stories/finale.ts), with the trick the
   child teaches Borrón taken from 2.º (doubles by tens and units, counting in fives and tens). */
import type { StoryDef } from '@/types'
import { finale } from '../stories/finale'

const SWAP: Record<string, string> = {
  '{child} se acuerda de lo difícil que le parecía la tabla del 7 al principio.':
    '{child} se acuerda de lo difíciles que le parecían las restas con llevada al principio.',
  '—Mira: cinco, seis, siete, ocho. ¡Cincuenta y seis es siete por ocho! —explica {child}.':
    '—Mira: el doble de 15 es 15 + 15. Decenas con decenas, 10 + 10 = 20, y unidades con unidades, 5 + 5 = 10. ¡Son 30! —explica {child}.',
  'Cinco, seis, siete, ocho… ¡56 = 7 × 8! ¡Qué fácil!':
    'Decenas con decenas, unidades con unidades… ¡30! ¡Qué fácil!',
  '—Y si se te olvida, haces doble, doble y doble —añade {child}.':
    '—Y para contar muchas cosas, cuenta de 5 en 5 o de 10 en 10 —añade {child}.',
}

export const c2Finale: StoryDef = {
  ...finale,
  id: 'c2-finale',
  scenes: finale.scenes.map((sc) => ({ ...sc, lines: sc.lines.map((l) => (SWAP[l.text] ? { ...l, text: SWAP[l.text] } : l)) })),
}

/** The 3.º lines the 2.º finale replaces (kept for the tests: each one must exist in the 3.º finale). */
export const C2_FINALE_SWAPS = Object.keys(SWAP)
