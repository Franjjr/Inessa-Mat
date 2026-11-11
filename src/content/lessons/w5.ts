/* World 5 lessons: the 8 table ("doble, doble y doble", the units pattern and 5-6-7-8). */
import { lesson, show, tryIt, tryTrick } from './dsl'

export const w5Double = lesson('w5-double', 'Doble, doble y doble', [
  show('known-facts', { table: 8, map: 1 }, 'Esta es la tabla del 8. Las que tienen la marca verde ya las sabes.'),
  show('double-chain', { start: 3, steps: 3 }, 'Para las demás hay un truco. Multiplicar por 8 es hacer el doble tres veces seguidas.', 'octopus'),
  show('double-chain', { start: 3, steps: 3 }, 'Mira 8 × 3. Empiezo con el 3. El doble de 3 es 6. El doble de 6 es 12. El doble de 12 es 24. Así que 8 × 3 = 24.'),
  show('double-chain', { start: 7, steps: 3 }, 'Ahora 8 × 7. El doble de 7 es 14. El doble de 14 es 28. El doble de 28 es 56. Así que 8 × 7 = 56.'),
  tryIt('double-chain', { start: 7, steps: 3 }, '¡Te toca! Escribe el doble, luego el doble de ese y otra vez el doble. El último número es el resultado de multiplicar por 8.', { kinds: ['double-chain'], tables: [8] }),
  show('double-chain', { start: 6, steps: 2 }, 'Un regalo: para multiplicar por 4, haz el doble solo dos veces. 4 × 6: el doble de 6 es 12 y el doble de 12 es 24.'),
])

export const w5Pattern = lesson('w5-pattern', 'Los secretos del 8', [
  show('pattern-units', { table: 8 }, 'Mira la última cifra de cada resultado de la tabla del 8: 8, 16, 24, 32, 40. Las últimas cifras son 8, 6, 4, 2 y 0.'),
  show('pattern-units', { table: 8 }, 'Cada vez bajan 2: 8, 6, 4, 2, 0. Y después vuelven a empezar: 48, 56, 64, 72, 80.'),
  show('pattern-units', { table: 8 }, 'Este secreto sirve para comprobar. Si 8 × 4 te da 33, está mal: tiene que terminar en 2. Es 32.'),
  show('five-six-seven-eight', undefined, 'Y una rima para no olvidar 8 × 7: cinco, seis, siete, ocho. Cincuenta y seis es siete por ocho.'),
  show('known-facts', { table: 8, map: 2 }, 'Ya solo te quedan 4 nuevas: 8 × 3, 8 × 4, 8 × 8 y 8 × 9. Todas salen con doble, doble y doble.'),
  show('double-chain', { start: 9, steps: 3 }, 'Por ejemplo, 8 × 9: el doble de 9 es 18, el doble de 18 es 36 y el doble de 36 es 72.'),
  tryTrick('known-facts', { table: 8, map: 2 }, '¡Te toca! Haz el doble tres veces y mira si la última cifra sigue el secreto.', { kinds: ['fact-mul'], skills: ['mul:3x8', 'mul:4x8', 'mul:8x8', 'mul:8x9'] }, 'double-double'),
])
