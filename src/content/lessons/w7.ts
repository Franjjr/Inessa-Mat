/* World 7 lessons: 2-digit × 1-digit by pieces, in column, and with carries. */
import { lesson, show, tryIt } from './dsl'

const split23 = { n: 23, m: 3 }
const col23 = { top: 23, bottom: 3 }
const col47 = { top: 47, bottom: 6 }

export const w7Split = lesson('w7-split', 'Multiplicar por trocitos', [
  show('split-multiply', split23, 'Las multiplicaciones grandes son como una pizza: ¡se hacen por trocitos!'),
  show('split-multiply', split23, '23 son 2 decenas y 3 unidades: 20 y 3.'),
  show('split-multiply', split23, '20 × 3 = 60 y 3 × 3 = 9. Después se juntan: 60 + 9 = 69.'),
  show('column-mul', col23, 'En columna es lo mismo, pero más ordenado. Primero las unidades: 3 × 3 = 9.'),
  show('column-mul', col23, 'Después las decenas: 3 × 2 = 6. ¡23 × 3 = 69!'),
  tryIt('column-mul', col23, '¡Te toca! Primero las unidades, después las decenas.', { kinds: ['column-mul'], regroup: 'none' }),
])

export const w7Carry = lesson('w7-carry', 'Multiplicar con llevadas', [
  show('column-mul', col47, 'Unidades: 6 × 7 = 42. Escribo el 2 y me llevo 4.', 'dragon'),
  show('column-mul', col47, 'Decenas: 6 × 4 = 24. Y ahora sumo la mochila: 24 + 4 = 28.', 'dragon'),
  show('column-mul', col47, '¡47 × 6 = 282!'),
  show('column-mul', col47, 'Ojo: la llevada se suma después de multiplicar. ¡Primero multiplica, luego suma la mochila!'),
  tryIt('column-mul', col47, '¡Te toca! Escribe la llevada arriba para que no se escape.', { kinds: ['column-mul'], regroup: 'one' }),
])
