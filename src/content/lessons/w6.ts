/* World 6 lessons: the 7 table is almost known already; the 3 new facts (weeks, the rainbow rhyme, the 9 trick). */
import { lesson, show, tryIt } from './dsl'

export const w6Seven = lesson('w6-seven', 'La tabla del 7: ¡ya sabes casi toda!', [
  show('known-facts', { table: 7, map: 1 }, '¿La tabla del 7 da miedo? Mira bien: las que tienen la marca verde ya las sabes.'),
  show('known-facts', { table: 7, map: 1 }, '7 × 6 y 6 × 7 dan lo mismo: 42. 7 × 8 y 8 × 7, también: 56. Da la vuelta y no cambia.'),
  show('known-facts', { table: 7, map: 1 }, 'Solo quedan 3 nuevas: 7 × 3, 7 × 7 y 7 × 9. La de 7 × 9 tiene truco propio, en la lección siguiente.'),
  show('groups', { groups: 3, perGroup: 7, emoji: '📅' }, 'Una semana tiene 7 días. 3 semanas son 3 × 7 = 21 días. Con el espejo, 7 × 3 también es 21.', 'fairy'),
  show('square-rhyme', undefined, '7 × 7 es un cuadrado de 7 filas de 7: 49. Rima: «Siete por siete, cuarenta y nueve, ¡y el arcoíris llueve!»', 'fairy'),
  tryIt('square-rhyme', undefined, '¡Te toca! Usa la semana o la rima.', { kinds: ['fact-mul'], skills: ['mul:3x7', 'mul:7x7'] }),
])

export const w6Nine = lesson('w6-nine', 'El truco del 9', [
  show('nine-trick', { a: 7 }, 'El truco del 9: 7 × 9. Piensa en el número justo antes del 7: es el 6. Esa es la primera cifra.'),
  show('nine-trick', { a: 7 }, '¿Qué número sumado a 6 da 9? El 3, porque 6 + 3 = 9. Esa es la segunda cifra. Así, 7 × 9 = 63.'),
  show('nine-trick', { a: 7 }, 'Otro camino: 10 veces 7 son 70. Pero queremos 9 veces, una menos, así que quitamos un 7: 70 − 7 = 63.'),
  show('nine-trick', { a: 4 }, 'Otro ejemplo, 4 × 9. Antes del 4 va el 3. ¿Qué número sumado a 3 da 9? El 6. Así, 4 × 9 = 36.'),
  tryIt('nine-trick', { a: 6 }, '¡Te toca! Primero el número de antes. Después, la cifra que falta para llegar a 9.', { kinds: ['fact-mul'], tables: [9], factorRange: [3, 9] }),
  show('nine-trick', { a: 8 }, '¡Ya conoces el truco del 9! Para comprobar, suma las dos cifras del resultado: siempre dan 9.'),
])
