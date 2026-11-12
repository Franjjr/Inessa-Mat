/* World 7 lessons: 2-digit × 1-digit by pieces, in column, and with carries. */
import { lesson, show, tryIt } from './dsl'

const split23 = { n: 23, m: 3 }
const col23 = { top: 23, bottom: 3 }
const col41 = { top: 41, bottom: 3 }
const col47 = { top: 47, bottom: 6 }

export const w7Split = lesson('w7-split', 'Multiplicar por trocitos', [
  show('split-multiply', split23, '23 × 3 parece difícil. Lo partimos en trozos fáciles: 23 son 2 decenas y 3 unidades, es decir, 20 y 3.'),
  show('split-multiply', split23, 'Multiplicamos cada trozo por 3. 20 × 3: 2 decenas por 3 son 6 decenas, que son 60. Y 3 × 3 = 9.'),
  show('split-multiply', split23, 'Ahora juntamos los trozos: 60 + 9 = 69. Así que 23 × 3 = 69.'),
  show('column-mul', col23, 'En columna, lo mismo, pero ordenado. Unidades: 3 por 3, 9. Escribo el 9 debajo de las unidades.'),
  show('column-mul', col23, 'Ahora las decenas: 3 por 2, 6. Escribo el 6 debajo de las decenas. Son 6 decenas, el 60 de antes. 23 × 3 = 69.'),
  show('column-mul', col41, 'A veces dan 10 o más. 41 × 3: 3 por 1, 3. 3 por 4, 12. Como no quedan cifras, escribo el 12 entero: 123.'),
  tryIt('column-mul', col23, '¡Te toca! Primero las unidades y después las decenas. Escribe cada resultado debajo de su casa.', { kinds: ['column-mul'], regroup: 'none' }),
])

export const w7Carry = lesson('w7-carry', 'Multiplicar con llevadas', [
  show('column-mul', col47, '47 × 6. Unidades: 6 por 7, 42. Escribo el 2 y me llevo 4, pequeñito encima de las decenas.', 'dragon'),
  show('column-mul', col47, 'Ahora las decenas: 6 por 4, 24. Y le sumo lo que me llevaba: 24 + 4 = 28.'),
  show('column-mul', col47, 'Como ya no quedan cifras, escribo el 28 entero: el 8 en las decenas y el 2 delante. 47 × 6 = 282.'),
  show('column-mul', col47, 'Cuidado: primero se multiplica y después se suma la llevada. No sumes 4 + 4 antes de multiplicar.'),
  tryIt('column-mul', col47, '¡Te toca! Escribe la llevada arriba para que no se escape.', { kinds: ['column-mul'], regroup: 'one' }),
])
