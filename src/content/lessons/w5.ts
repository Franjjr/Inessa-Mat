/* World 5 lessons: the 8 table ("doble, doble y doble", the units pattern and 5-6-7-8). */
import { lesson, show, tryIt } from './dsl'

export const w5Double = lesson('w5-double', 'Doble, doble y doble', [
  show('known-facts', { table: 8 }, 'Mira la tabla del 8. ¡Ya sabes muchas! Hasta 8 × 6, que es de la Cueva.'),
  show('double-chain', { start: 3, steps: 3 }, 'Para multiplicar por 8, haz el doble… otra vez el doble… ¡y otra vez el doble!', 'octopus'),
  show('double-chain', { start: 3, steps: 3 }, '8 × 3: 3 → 6 → 12 → 24. ¡Funciona porque 8 = 2 × 2 × 2!'),
  show('double-chain', { start: 7, steps: 3 }, '8 × 7: 7 → 14 → 28 → 56.'),
  tryIt('double-chain', { start: 7, steps: 3 }, '¡Te toca! Dobla tres veces.', { kinds: ['double-chain'], tables: [8] }),
  show('double-chain', { start: 6, steps: 2 }, 'Bonus: la tabla del 4 es doble y doble. 4 × 6: 6 → 12 → 24.'),
])

export const w5Pattern = lesson('w5-pattern', 'Los secretos del 8', [
  show('pattern-units', { table: 8 }, 'El patrón secreto del 8: mira las unidades. 8, 16, 24, 32, 40…'),
  show('pattern-units', { table: 8 }, '¡Bajan de 2 en 2: 8, 6, 4, 2, 0… y vuelven a empezar!'),
  show('five-six-seven-eight', undefined, 'Y la rima que lo cambia todo: 5, 6, 7, 8… ¡56 = 7 × 8!'),
  show('known-facts', { table: 8 }, '¡Ya solo te quedan 4 nuevas: 8 × 3, 8 × 4, 8 × 8 y 8 × 9!'),
  tryIt('known-facts', { table: 8 }, '¡Te toca! Usa el truco que más te guste.', { kinds: ['fact-mul'], skills: ['mul:3x8', 'mul:4x8', 'mul:8x8', 'mul:8x9'] }),
])
