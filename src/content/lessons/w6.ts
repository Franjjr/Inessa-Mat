/* World 6 lessons: the 7 table is almost known already; the 3 new facts (weeks, the rainbow rhyme, the 9 trick). */
import { lesson, show, tryIt } from './dsl'

export const w6Seven = lesson('w6-seven', 'La tabla del 7: ¡ya sabes casi toda!', [
  show('known-facts', { table: 7 }, '¿La tabla del 7 da miedo? Mira bien… ¡ya te sabes casi toda!'),
  show('known-facts', { table: 7 }, '7 × 6 es el espejo de 6 × 7, de la Cueva. Y 7 × 8 es del Lago.'),
  show('known-facts', { table: 7 }, 'Solo hay 3 nuevas: 7 × 3, 7 × 7 y 7 × 9.'),
  show('groups', { groups: 3, perGroup: 7, emoji: '📅' }, '7 × 3: tres semanas de 7 días son 21 días.', 'fairy'),
  show('square-rhyme', undefined, '«Siete por siete, cuarenta y nueve… ¡y el arcoíris llueve!»', 'fairy'),
  tryIt('square-rhyme', undefined, '¡Te toca! Usa la semana o la rima.', { kinds: ['fact-mul'], skills: ['mul:3x7', 'mul:7x7'] }),
])

export const w6Nine = lesson('w6-nine', 'El truco del 9', [
  show('nine-trick', { a: 7 }, 'El truco del 9. Para 7 × 9, el resultado empieza por uno menos: el 6.'),
  show('nine-trick', { a: 7 }, 'Y las dos cifras suman 9: 6 + 3 = 9. ¡7 × 9 = 63!'),
  show('nine-trick', { a: 7 }, 'Otro camino: 7 × 10 − 7 = 70 − 7 = 63. ¡Elige el que más te guste!'),
  tryIt('nine-trick', { a: 6 }, '¡Te toca! Uno menos… y que sumen 9.', { kinds: ['fact-mul'], tables: [9], factorRange: [3, 9] }),
  show('known-facts', { table: 7 }, '¿Lo ves? La tabla del 7 no era un monstruo. ¡Ya la habías conquistado casi entera!'),
])
