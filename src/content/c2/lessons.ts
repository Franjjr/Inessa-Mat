/* Lessons of the 2.º adventure (season 'c2'): groups of ten and the houses up to 999, adding and subtracting with two
   digits (with and without carrying), doubles and halves, and the towers of the tables of 3 and 4. The 2.º Forja reuses
   the 3.º lessons on what multiplying is and the easy tables (w1-groups, w1-easy). */
import type { LessonDef } from '@/types'
import { lesson, show, tryIt } from '../lessons/dsl'

export const c2Tens = lesson('c2-w1-tens', 'Grupos de diez', [
  show('groups', { groups: 3, perGroup: 10, emoji: '🍄' }, 'Las hadas cuentan las setas de diez en diez: 10, 20, 30. ¡Mucho más rápido!'),
  show('groups', { groups: 3, perGroup: 10, emoji: '🍄' }, 'Un grupo de 10 unidades es una decena. Y diez decenas son una centena: ¡cien!', 'owl'),
  show('place-value', { n: 345 }, 'El número 345 vive en 3 casas: centenas, decenas y unidades.'),
  show('place-value', { n: 345 }, 'El 3 vale 300, el 4 vale 40 y el 5 vale 5. 300 + 40 + 5 = 345.'),
  tryIt('place-value', { n: 345 }, '¡Te toca! Cuenta los bloques y escribe el número.', { skills: ['num:place:blocks:999'] }),
  show('place-value', { n: 207 }, 'Si una casa está vacía, se escribe un 0: dos centenas y siete unidades son 207.', 'owl'),
  tryIt('place-value', { n: 207 }, '¡Otra! Descompón el número en sus casas.', { skills: ['num:place:expanded:999'] }),
])

export const c2Sum = lesson('c2-w2-sum', 'Sumar casa por casa', [
  show('place-value', { n: 34 }, 'Para sumar, cada cifra va en su casa: unidades debajo de unidades, decenas debajo de decenas.', 'frog'),
  show('carry', { a: 34, b: 25 }, 'Empieza siempre por las unidades: 4 + 5 = 9.'),
  show('carry', { a: 34, b: 25 }, 'Luego las decenas: 3 + 2 = 5. ¡34 + 25 = 59!'),
  tryIt('carry', { a: 34, b: 25 }, '¡Te toca! Casa por casa, empezando por las unidades.', { kinds: ['column-add'], digits: 2, regroup: 'none' }),
])

export const c2Carry = lesson('c2-w2-carry', '¡Me llevo una!', [
  show('carry', { a: 47, b: 35 }, 'En cada casa solo cabe una cifra. ¿Y si sale 10 o más?', 'frog'),
  show('carry', { a: 47, b: 35 }, 'Unidades: 7 + 5 = 12. Escribo el 2 y me llevo 1 decena.'),
  show('carry', { a: 47, b: 35 }, 'Decenas: 1 + 4 + 3 = 8. ¡47 + 35 = 82!'),
  show('carry', { a: 47, b: 35 }, 'La llevada es como una mochila: escríbela pequeñita arriba. ¡Y no te olvides de sumarla!', 'frog'),
  tryIt('carry', { a: 47, b: 35 }, '¡Te toca! Que no se escape ninguna llevada.', { kinds: ['column-add'], digits: 2, regroup: 'one' }),
])

export const c2Borrow = lesson('c2-w4-borrow', 'Pedir ayuda a la vecina', [
  show('borrow', { a: 52, b: 27 }, 'El número grande va arriba. Se empieza por las unidades: 2 − 7… ¡no se puede!', 'polarbear'),
  show('borrow', { a: 52, b: 27 }, '¡Pide ayuda a la vecina! Las decenas te prestan 1 decena, que son 10 unidades.', 'polarbear'),
  show('borrow', { a: 52, b: 27 }, 'El 5 se convierte en 4 y el 2 en 12. Ahora sí: 12 − 7 = 5. Y 4 − 2 = 2. ¡52 − 27 = 25!'),
  tryIt('borrow', { a: 52, b: 27 }, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { kinds: ['column-sub'], digits: 2, regroup: 'one' }),
  show('sub-check', { a: 52, b: 27 }, 'La prueba mágica: 25 + 27 = 52. ¡El resultado más el de abajo da el de arriba!'),
  show('sub-check', { a: 52, b: 27 }, 'Si en tu cole restáis «llevando», ¡hazlo como en el cole! El resultado es el mismo.'),
])

export const c2Double = lesson('c2-w5-double', 'Dobles y mitades', [
  show('groups', { groups: 2, perGroup: 4, emoji: '🐙' }, 'Octavio tiene 4 brazos a un lado y 4 al otro. El doble de 4 es 8.', 'octopus'),
  show('groups', { groups: 2, perGroup: 6, emoji: '🐚' }, 'El doble es lo mismo dos veces: el doble de 6 es 6 + 6 = 12.'),
  show('groups', { groups: 2, perGroup: 6, emoji: '🐚' }, 'Y la mitad es partir en dos montones iguales: la mitad de 12 es 6.'),
  show('double-chain', { start: 3, steps: 3 }, 'Con números más grandes, dobla las decenas y las unidades: el doble de 23 es 40 + 6.'),
  tryIt('double-chain', { start: 3, steps: 3 }, '¡Te toca! Calcula el doble o la mitad.', { skills: ['mental:dobles', 'mental:mitades'] }),
])

export const c2Towers = lesson('c2-w8-towers', 'Torres de 3 y de 4', [
  show('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, 'Cada torre del castillo tiene 3 pisos. 4 torres son 3 + 3 + 3 + 3 = 12 pisos.', 'queen'),
  show('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, 'Más rápido: 4 × 3 = 12. ¡La tabla del 3 va de tres en tres!'),
  tryIt('groups', { groups: 4, perGroup: 3, emoji: '🧱' }, '¡Te toca! Usa la tabla del 3.', { kinds: ['fact-mul'], tables: [3], factorRange: [2, 9] }),
  show('groups', { groups: 3, perGroup: 4, emoji: '🧱' }, 'Las torres altas tienen 4 pisos: la tabla del 4 es el doble de la del 2. 3 × 2 = 6, así que 3 × 4 = 12.'),
  tryIt('groups', { groups: 3, perGroup: 4, emoji: '🧱' }, '¡Otra! Ahora con la tabla del 4.', { kinds: ['fact-mul'], tables: [4], factorRange: [2, 9] }),
])

export const c2Lessons: LessonDef[] = [c2Tens, c2Sum, c2Carry, c2Borrow, c2Double, c2Towers]
