/* Lessons of the 2.º adventure (season 'c2'): groups of ten and the houses up to 999, adding and subtracting with two
   digits (with and without carrying), doubles and halves, and the towers of the tables of 3 and 4. The 2.º Forja reuses
   the 3.º lessons on what multiplying is and the easy tables (w1-groups, w1-easy). */
import type { LessonDef } from '@/types'
import { lesson, show, tryIt } from '../lessons/dsl'

export const c2Tens = lesson('c2-w1-tens', 'Grupos de diez', [
  show('groups', { groups: 3, perGroup: 10, emoji: '🍄' }, 'Las hadas cuentan las setas de diez en diez: 10, 20, 30. ¡Mucho más rápido!'),
  show('groups', { groups: 3, perGroup: 10, emoji: '🍄' }, 'Un grupo de 10 unidades es una decena. Y diez decenas son una centena: ¡cien!', 'owl'),
  // blocks: 1 draws the base-ten blocks in every house (a big square, a bar, a small cube).
  show('place-value', { n: 345, blocks: 1 }, 'El número 345 vive en 3 casas: centenas, decenas y unidades.'),
  show('place-value', { n: 345, blocks: 1 }, 'Centenas: cuadrado grande. Decenas: barra. Unidades: cubito. 3 cuadrados, 4 barras y 5 cubitos son 345.'),
  show('place-value', { n: 345, blocks: 1 }, 'El 3 vale 300, el 4 vale 40 y el 5 vale 5. 300 + 40 + 5 = 345.'),
  tryIt('place-value', { n: 345, blocks: 1 }, '¡Te toca! Cuenta los bloques y escribe el número.', { skills: ['num:place:blocks:999'] }),
  show('place-value', { n: 207, blocks: 1 }, 'Si una casa está vacía, se escribe un 0: dos centenas y siete unidades son 207.', 'owl'),
  show('place-value', { n: 207, blocks: 1 }, 'Descomponer es decir cuánto vale cada cifra: 207 son 200 más 7.'),
  tryIt('place-value', { n: 207, blocks: 1 }, '¡Otra! Descompón el número en sus casas.', { skills: ['num:place:expanded:999'] }),
])

export const c2Sum = lesson('c2-w2-sum', 'Sumar casa por casa', [
  show('place-value', { n: 34 }, 'Para sumar, cada cifra va en su casa: unidades debajo de unidades, decenas debajo de decenas.', 'frog'),
  // One step sets the numbers, then one step per column: the last step shows the whole sum.
  show('carry', { a: 34, b: 25 }, 'Escribimos un número debajo del otro: 34 arriba y 25 abajo.'),
  show('carry', { a: 34, b: 25 }, 'Empezamos siempre por la derecha, por las unidades: 4 más 5 son 9.'),
  show('carry', { a: 34, b: 25 }, 'Luego las decenas: 3 más 2 son 5. ¡34 más 25 son 59!'),
  tryIt('carry', { a: 34, b: 25 }, '¡Te toca! Casa por casa, empezando por las unidades.', { kinds: ['column-add'], digits: 2, regroup: 'none' }),
])

export const c2Carry = lesson('c2-w2-carry', '¡Me llevo una!', [
  show('carry', { a: 47, b: 35 }, 'En cada casa solo cabe una cifra. ¿Y si sale 10 o más?', 'frog'),
  show('carry', { a: 47, b: 35 }, 'Unidades: 7 más 5 son 12. Escribo el 2 y me llevo 1 decena.'),
  show('carry', { a: 47, b: 35 }, 'Decenas: 4 más 3 son 7, y 1 que me llevaba, 8. ¡47 más 35 son 82!'),
  show('carry', { a: 47, b: 35 }, 'La llevada es como una mochila: escríbela pequeñita arriba. ¡Y no te olvides de sumarla!', 'frog'),
  tryIt('carry', { a: 47, b: 35 }, '¡Te toca! Que no se escape ninguna llevada.', { kinds: ['column-add'], digits: 2, regroup: 'one' }),
])

export const c2Borrow = lesson('c2-w4-borrow', 'Pedir ayuda a la vecina', [
  // One step to set the numbers and one step per column (units first).
  show('borrow', { a: 52, b: 27, byColumn: 1 }, 'El número grande va arriba. Empezamos por las unidades: 2 − 7… ¡no se puede!', 'polarbear'),
  show('borrow', { a: 52, b: 27, byColumn: 1 }, '¡Pide ayuda a la vecina! Las decenas prestan 1 decena: 10 unidades. El 5 pasa a 4 y el 2 a 12. 12 − 7 = 5.', 'polarbear'),
  show('borrow', { a: 52, b: 27, byColumn: 1 }, 'Decenas: 4 − 2 = 2. ¡52 − 27 = 25!'),
  tryIt('borrow', { a: 52, b: 27 }, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { kinds: ['column-sub'], digits: 2, regroup: 'one' }),
  show('sub-check', { a: 52, b: 27 }, 'Ahora, la prueba mágica. ¿Cómo sabemos que una resta está bien hecha?'),
  show('sub-check', { a: 52, b: 27 }, 'Sumamos el resultado y el número de abajo: 25 más 27 son 52, el de arriba. ¡Está bien!'),
])

export const c2Double = lesson('c2-w5-double', 'Dobles y mitades', [
  show('big-text', { text: '4 + 4 = 8' }, 'Octavio tiene 4 brazos a un lado y 4 al otro. 4 más 4 son 8. El doble de 4 es 8.', 'octopus'),
  show('big-text', { text: '6 + 6 = 12' }, 'El doble es sumar un número consigo mismo: el doble de 6 es 6 más 6, 12.'),
  show('big-text', { text: '12 = 6 + 6' }, 'La mitad es repartir en dos montones iguales: 12 en dos montones son 6 y 6. La mitad de 12 es 6.'),
  show('big-text', { text: '40 + 6 = 46' }, 'Con dos cifras, por partes: 23 son 20 y 3. El doble de 20 es 40 y el de 3 es 6. 40 más 6 son 46.'),
  show('big-text', { text: '5 + 2 = 7' }, 'La mitad, por partes: 14 son 10 y 4. La mitad de 10 es 5 y la de 4 es 2. 5 más 2 son 7.'),
  tryIt('big-text', { text: 'Doble y mitad' }, '¡Te toca! Calcula el doble o la mitad, por partes.', { skills: ['mental:dobles', 'mental:mitades'] }),
])

export const c2Towers = lesson('c2-w8-towers', 'Torres de 3 y de 4', [
  show('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, 'Cada torre del castillo tiene 3 pisos. 4 torres son 3 + 3 + 3 + 3 = 12 pisos.', 'queen'),
  show('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, 'Más rápido: 4 × 3 = 12. ¡La tabla del 3 va de tres en tres!'),
  tryIt('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, '¡Te toca! Usa la tabla del 3.', { kinds: ['fact-mul'], tables: [3], factorRange: [2, 9] }),
  show('groups', { groups: 3, perGroup: 4, emoji: '🧱' }, 'Torres de 4 pisos. El 4 es el doble de 2: 3 × 2 son 6, y el doble es 12. Así, 3 × 4 = 12.'),
  show('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, 'Más rápido: 4 torres de 3 pisos es 4 × 3, que son 12.'),
  tryIt('groups', { groups: 3, perGroup: 4, emoji: '🧱' }, '¡Otra! Ahora con la tabla del 4.', { kinds: ['fact-mul'], tables: [4], factorRange: [2, 9] }),
])

export const c2Lessons: LessonDef[] = [c2Tens, c2Sum, c2Carry, c2Borrow, c2Double, c2Towers]
