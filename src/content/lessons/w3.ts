/* World 3 lessons: the two tricks for the 6 table ("el 5 y uno más" and "los pares que riman"). */
import { lesson, show, tryIt, tryTrick } from './dsl'

export const w3Five = lesson('w3-five', 'Truco 1: el 5 y uno más', [
  show('known-facts', { table: 6, map: 1 }, 'Mira la tabla del 6. ¡Ya sabes 6 × 1, 6 × 2, 6 × 5 y 6 × 10!'),
  show('array-rotate', { rows: 2, cols: 6, emoji: '🍄' }, 'Gracias al espejo, 2 × 6 es lo mismo que 6 × 2, que ya sabías.'),
  show('five-plus-one', { b: 7 }, 'Truco 1: el 5 y uno más. 6 grupos son 5 grupos y uno más.'),
  show('five-plus-one', { b: 7 }, 'Por ejemplo, 6 × 7. Cinco grupos de 7 son 35. Y un grupo más de 7: 35 más 7 son 42.'),
  show('five-plus-one', { b: 3 }, 'Otro ejemplo, 6 × 3. Cinco grupos de 3 son 15. Y un grupo más de 3: 15 más 3 son 18.'),
  // The try avoids the 9 (its own trick comes later) and asks for the trick of this lesson.
  tryTrick('five-plus-one', { b: 7 }, '¡Te toca! Piensa en la del 5 y suma uno más.', { kinds: ['fact-mul'], skills: ['mul:3x6', 'mul:4x6', 'mul:6x7'] }, 'five-plus-one'),
  show('known-facts', { table: 6, map: 1 }, 'Di la frase entera en voz alta: «seis por siete, cuarenta y dos». ¡Tu oído también aprende!'),
])

export const w3Rhyme = lesson('w3-rhyme', 'Truco 2: los pares que riman', [
  show('even-six-rhyme', undefined, 'Truco 2: los pares que riman. 6 × 2 son 12, 6 × 4 son 24…'),
  show('even-six-rhyme', undefined, 'Si multiplicas el 6 por un número par, el resultado acaba en ese mismo número.'),
  show('even-six-rhyme', undefined, 'Y delante va su mitad. 6 × 8 acaba en 8, y la mitad de 8 es 4. ¡Son 48!'),
  tryIt('even-six-rhyme', undefined, '¡Te toca! Busca la rima.', { kinds: ['fact-mul'], skills: ['mul:4x6', 'mul:6x6', 'mul:6x8'] }),
  show('known-facts', { table: 6, map: 1 }, '¡Ya tienes dos trucos para la tabla del 6!', 'ladybug'),
])

/* «Los trucos de Lumi»: a review of the tricks for the tables, one by one, after the two tricks of the 6. */

export const w3Tricks = lesson('w3-tricks', 'Los trucos de Lumi', [
  show('easy-tables', {}, 'Ya conoces varios trucos para las tablas. Vamos a repasarlos uno a uno.'),
  show('double-chain', { start: 3, steps: 1 }, 'El doble, para la tabla del 2: 2 × 3 es 3 más 3. Son 6.'),
  show('double-chain', { start: 7, steps: 2 }, 'Doble del doble, para el 4: el doble de 7 es 14, y el doble de 14 es 28. Así, 4 × 7 = 28.'),
  show('easy-tables', {}, 'La mitad del 10, para el 5: 10 × 8 son 80. La mitad de 80 es 40. Así, 5 × 8 = 40.'),
  show('nine-trick', { a: 7, only: 'ten' }, 'Diez menos una vez, para el 9: 10 × 7 son 70. Quitas un 7 y quedan 63. Así, 9 × 7 = 63.'),
  show('five-plus-one', { b: 7 }, 'El 5 y uno más, para el 6: 6 × 7 es 5 × 7, que son 35, y un 7 más: 42.'),
  show('array-rotate', { rows: 3, cols: 7, emoji: '🍄' }, 'El espejo sirve para todas: 7 × 3 es lo mismo que 3 × 7. Si una no la sabes, dale la vuelta.'),
  tryIt('easy-tables', {}, '¡Te toca! Es de la tabla del 6. Usa el truco que prefieras.', { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] }),
])
