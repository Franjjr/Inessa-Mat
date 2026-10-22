/* World 3 lessons: the two tricks for the 6 table ("el 5 y uno más" and "los pares que riman"). */
import { lesson, show, tryIt } from './dsl'

export const w3Five = lesson('w3-five', 'Truco 1: el 5 y uno más', [
  show('known-facts', { table: 6 }, 'Mira la tabla del 6. ¡Ya sabes 6 × 1, 6 × 2, 6 × 5 y 6 × 10!'),
  show('known-facts', { table: 6 }, 'Gracias al espejo, 2 × 6 es igual que 6 × 2. ¡Esa ya la sabías!'),
  show('five-plus-one', { b: 7 }, 'Truco 1: el 5 y uno más. 6 grupos son 5 grupos y uno más.'),
  show('five-plus-one', { b: 7 }, '6 × 7 = 5 × 7 + 7. Es decir: 35 + 7 = 42.'),
  show('five-plus-one', { b: 3 }, '6 × 3 = 5 × 3 + 3. Es decir: 15 + 3 = 18.'),
  tryIt('five-plus-one', { b: 9 }, '¡Te toca! Piensa en la del 5 y suma uno más.', { kinds: ['fact-mul'], skills: ['mul:3x6', 'mul:6x7', 'mul:6x9'] }),
  show('known-facts', { table: 6 }, 'Di la frase entera en voz alta: «seis por siete, cuarenta y dos». ¡Tu oído también aprende!'),
])

export const w3Rhyme = lesson('w3-rhyme', 'Truco 2: los pares que riman', [
  show('even-six-rhyme', undefined, 'Truco 2: los pares que riman. 6 × 2 = 12, 6 × 4 = 24…'),
  show('even-six-rhyme', undefined, 'Si multiplicas el 6 por un número par, acaba en ese mismo número.'),
  show('even-six-rhyme', undefined, 'Y delante va su mitad. 6 × 8: acaba en 8, y la mitad de 8 es 4. ¡48!'),
  tryIt('even-six-rhyme', undefined, '¡Te toca! Busca la rima.', { kinds: ['fact-mul'], skills: ['mul:4x6', 'mul:6x6', 'mul:6x8'] }),
  show('known-facts', { table: 6 }, '¡Ya tienes dos trucos para la tabla del 6!', 'ladybug'),
])
