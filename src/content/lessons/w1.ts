/* World 1 lessons: what multiplying is (groups → arrays → mirror rule) and the easy tables. */
import { lesson, show, tryIt } from './dsl'

const mushrooms = { groups: 4, perGroup: 3, emoji: '🍄' }
const flowers = { rows: 3, cols: 5, emoji: '🌸' }

export const w1Groups = lesson('w1-groups', '¿Qué es multiplicar?', [
  show('groups', mushrooms, 'Mira: las hadas han plantado 4 grupos de 3 setas.'),
  show('groups', mushrooms, 'Podemos sumar: 3 + 3 + 3 + 3 = 12. ¡Pero es un poco largo!'),
  show('groups', mushrooms, 'Más rápido: 4 × 3 = 12. Se lee «cuatro por tres, doce».'),
  show('groups', mushrooms, 'Multiplicar es sumar grupos iguales. ¡El primer número dice cuántos grupos hay!', 'owl'),
  tryIt('groups', { groups: 2, perGroup: 5, emoji: '🍓' }, '¡Te toca! Cuenta los grupos y escribe la multiplicación.', { kinds: ['groups'], factorRange: [2, 5] }),
  show('array-rotate', flowers, 'Las flores se plantan en filas: 3 filas de 5. 3 × 5 = 15.'),
  show('array-rotate', flowers, 'Si giras las flores, salen 5 filas de 3. ¡También son 15!'),
  show('array-rotate', flowers, 'Es el truco del espejo: el orden no cambia el resultado.'),
  tryIt('array-rotate', { rows: 2, cols: 6, emoji: '🌷' }, '¡Te toca! ¿Cuántas filas hay? ¿Cuántas flores en cada fila?', { kinds: ['array'], factorRange: [2, 6] }),
  show('array-rotate', { rows: 2, cols: 6, emoji: '🌷' }, 'Si sabes 3 × 5, ya sabes 5 × 3. ¡Solo tienes que aprender la mitad!'),
])

export const w1Easy = lesson('w1-easy', 'Las tablas fáciles', [
  show('easy-tables', undefined, 'Hay tablas muy fáciles. ¡Con ellas ya sabes muchísimas multiplicaciones!'),
  show('easy-tables', undefined, 'Por 1, se queda igual: 7 × 1 = 7.'),
  show('easy-tables', undefined, 'Por 2, es el doble: 2 × 8 = 8 + 8 = 16.'),
  show('easy-tables', undefined, 'Por 5, acaban en 0 o en 5: 5, 10, 15, 20…'),
  show('easy-tables', undefined, 'Por 10, ¡pon un 0 detrás! 10 × 6 = 60.'),
  tryIt('easy-tables', undefined, '¡Te toca! Usa uno de los trucos fáciles.', { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [2, 9] }),
  show('array-rotate', { rows: 2, cols: 7, emoji: '⭐' }, '¿Y 7 × 2? ¡Con el espejo es 2 × 7, el doble de 7: 14!'),
  tryIt('easy-tables', undefined, '¡Otra! Si te ayuda, usa el espejo.', { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [3, 9] }),
  show('easy-tables', undefined, 'Con el espejo y las tablas fáciles ya conoces muchísimas. ¡Vamos a comprobarlo!'),
])
