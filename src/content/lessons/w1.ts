/* World 1 lessons: what multiplying is (groups → arrays → mirror rule) and the easy tables. */
import { lesson, show, tryIt } from './dsl'

const mushrooms = { groups: 4, perGroup: 3, emoji: '🍄' }
const flowers = { rows: 3, cols: 5, emoji: '🌸' }

export const w1Groups = lesson('w1-groups', '¿Qué es multiplicar?', [
  show('groups', mushrooms, 'Mira: las hadas han plantado 4 grupos de 3 setas.'),
  show('groups', mushrooms, 'Podemos sumar: 3 + 3 + 3 + 3 = 12. ¡Pero es un poco largo!'),
  show('groups', mushrooms, 'Más rápido: 4 × 3 = 12. Se lee «cuatro por tres, doce».'),
  show('groups', mushrooms, 'Multiplicar es sumar grupos iguales. ¡El primer número dice cuántos grupos hay!', 'owl'),
  tryIt('groups', { groups: 2, perGroup: 5, emoji: '🍓' }, '¡Te toca! Cuenta los grupos y escribe el resultado de la multiplicación.', { kinds: ['groups'], factorRange: [2, 5] }),
  show('array-rotate', flowers, 'Las flores se plantan en filas: 3 filas de 5. 3 × 5 = 15.'),
  show('array-rotate', flowers, 'Si giras las flores, salen 5 filas de 3. ¡También son 15!'),
  show('array-rotate', flowers, 'Es el truco del espejo: el orden no cambia el resultado.'),
  tryIt('array-rotate', { rows: 2, cols: 6, emoji: '🌷' }, '¡Te toca! ¿Cuántas filas hay? ¿Cuántas flores en cada fila?', { kinds: ['array'], factorRange: [2, 6] }),
  // The closing step is about the flowers of the example (3 × 5), not about the tulips of the try.
  show('array-rotate', flowers, 'Si sabes 3 × 5, ya sabes 5 × 3. ¡Solo tienes que aprender la mitad!'),
])

export const w1Easy = lesson('w1-easy', 'Las tablas fáciles', [
  show('easy-tables', undefined, 'Hay cuatro tablas muy fáciles: la del 1, la del 2, la del 5 y la del 10. Te enseño cómo se hace cada una.'),
  show('easy-tables', undefined, 'Por 1, el número se queda igual: 7 × 1 es un grupo de 7. Son 7.'),
  show('easy-tables', undefined, 'Por 2 es el doble, el número dos veces: 2 × 8 es 8 más 8. Son 16.'),
  show('easy-tables', undefined, 'Por 5, cuenta de 5 en 5: 5 × 4 es cinco, diez, quince, veinte. Son 20. Siempre acaba en 0 o en 5.'),
  show('easy-tables', undefined, 'Por 10, pon un 0 detrás del número: 10 × 6 son 60.'),
  tryIt('easy-tables', undefined, '¡Te toca! Mira qué tabla es y usa su truco.', { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [2, 9] }),
  show('array-rotate', { rows: 2, cols: 7, emoji: '⭐' }, '¿Y 7 × 2? Dale la vuelta: es 2 × 7, el doble de 7. 7 más 7 son 14.'),
  tryIt('easy-tables', undefined, '¡Otra! Si el número fácil está el segundo, dale la vuelta.', { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [3, 9] }),
])
