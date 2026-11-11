/* World 2 lessons: place value ("cada número en su casa") and column addition with carries. */
import { lesson, show, tryIt } from './dsl'

const carry368 = { a: 368, b: 257 }
const carry2486 = { a: 2486, b: 1357 }
const add243 = { a: 243, b: 125 }

export const w2PlaceValue = lesson('w2-placevalue', 'Cada número en su casa', [
  show('place-value', { n: 2486 }, 'El número 2486 tiene 4 cifras. Cada cifra vive en su casa.'),
  show('place-value', { n: 2486 }, 'Empezando por la derecha: unidades, decenas, centenas y millares.'),
  show('place-value', { n: 2486 }, 'El 6 vale 6, el 8 vale 80, el 4 vale 400 y el 2 vale 2000.'),
  // A worked example of the addition before the child writes one: step 0 sets the numbers, then one column per step.
  show('carry', add243, 'Para sumar 243 más 125, escribimos un número debajo del otro: unidades debajo de unidades, decenas debajo de decenas.', 'frog'),
  show('carry', add243, 'Empezamos siempre por la derecha, por las unidades: 3 más 5 son 8. Escribimos el 8 abajo.', 'frog'),
  show('carry', add243, 'Ahora las decenas: 4 más 2 son 6.'),
  show('carry', add243, 'Y las centenas: 2 más 1 son 3. 243 más 125 son 368.'),
  tryIt('place-value', { n: 243 }, '¡Te toca! Suma casa por casa, empezando por las unidades.', { kinds: ['column-add'], digits: 3, regroup: 'none' }),
])

export const w2Carry = lesson('w2-carry', '¡Me llevo una!', [
  show('carry', carry368, 'A veces una casa suma 10 o más. Pero en cada casa solo cabe una cifra. ¿Qué hacemos?', 'frog'),
  show('carry', carry368, 'Unidades: 8 más 7 son 15. En la casa solo cabe una cifra: escribo el 5 y la decena que sobra me la llevo. La escribo pequeñita arriba, en las decenas.'),
  show('carry', carry368, 'Decenas: 6 más 5 son 11, y 1 que me llevaba, 12. Escribo el 2 y me llevo 1 a las centenas.'),
  show('carry', carry368, 'Centenas: 3 más 2 son 5, y 1 que me llevaba, 6. 368 más 257 son 625.'),
  show('carry', carry368, 'La llevada es como una mochila: escríbela pequeñita arriba. ¡Y no te olvides de sumarla!'),
  tryIt('carry', carry368, '¡Te toca! Que no se escape ninguna llevada.', { kinds: ['column-add'], digits: 3, regroup: 'one' }),
  show('carry', carry2486, 'Con 4 cifras es igual, pero hay una casa más: los millares.'),
  show('carry', carry2486, 'Unidades: 6 más 7 son 13. Escribo el 3 y me llevo 1.'),
  show('carry', carry2486, 'Decenas: 8 más 5 son 13, y 1 que me llevaba, 14. Escribo el 4 y me llevo 1.'),
  show('carry', carry2486, 'Centenas: 4 más 3 son 7, y 1 que me llevaba, 8. Escribo el 8.'),
  show('carry', carry2486, 'Millares: 2 más 1 son 3. 2486 más 1357 son 3843.'),
  tryIt('carry', carry2486, '¡Ahora una de 4 cifras! Casa por casa.', { kinds: ['column-add'], digits: 4, regroup: 'one' }),
])
