/* World 2 lessons: place value ("cada número en su casa") and column addition with carries. */
import { lesson, show, tryIt } from './dsl'

const carry368 = { a: 368, b: 257 }

export const w2PlaceValue = lesson('w2-placevalue', 'Cada número en su casa', [
  show('place-value', { n: 2486 }, 'El número 2486 vive en 4 casas. ¡Cada cifra en la suya!'),
  show('place-value', { n: 2486 }, 'U son las unidades, D las decenas, C las centenas y UM las unidades de mil.'),
  show('place-value', { n: 2486 }, 'El 2 vale 2000, el 4 vale 400, el 8 vale 80 y el 6 vale 6.'),
  show('place-value', { n: 368 }, 'Regla 1: coloca los números empezando por la derecha. Unidades debajo de unidades.', 'frog'),
  show('place-value', { n: 368 }, 'Regla 2: empieza a sumar siempre por las unidades.', 'frog'),
  tryIt('place-value', { n: 243 }, '¡Te toca! Suma casa por casa, empezando por las unidades.', { kinds: ['column-add'], digits: 3, regroup: 'none' }),
])

export const w2Carry = lesson('w2-carry', '¡Me llevo una!', [
  show('carry', carry368, 'Regla 3: en cada casa solo cabe una cifra. ¿Y si sale 10 o más?', 'frog'),
  show('carry', carry368, 'Unidades: 8 + 7 = 15. Escribo el 5 y me llevo 1.'),
  show('carry', carry368, 'Decenas: 1 + 6 + 5 = 12. Escribo el 2 y me llevo 1.'),
  show('carry', carry368, 'Centenas: 1 + 3 + 2 = 6. ¡368 + 257 = 625!'),
  show('carry', carry368, 'La llevada es como una mochila: escríbela pequeñita arriba. ¡Y no te olvides de sumarla!'),
  tryIt('carry', carry368, '¡Te toca! Que no se escape ninguna llevada.', { kinds: ['column-add'], digits: 3, regroup: 'one' }),
  show('carry', { a: 2486, b: 1357 }, 'Con 4 cifras es igual, pero hay una casa más: las unidades de mil.'),
  tryIt('carry', { a: 2486, b: 1357 }, '¡Ahora una de 4 cifras! Casa por casa.', { kinds: ['column-add'], digits: 4, regroup: 'one' }),
])
