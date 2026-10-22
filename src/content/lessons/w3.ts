/* World 3 lessons: the two tricks for the 6 table ("el 5 y uno más" and "los pares que riman"). */
import { TABLE_METHODS } from '@/engine/methods'
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

/* «Los trucos de Lumi»: the tricks for the tables as strategies the child can choose. The favourite is saved as
   ChildSettings.tableMethod and the hint of a fact names it when it applies. */

export const w3Tricks = lesson('w3-tricks', 'Los trucos de Lumi', [
  show('easy-tables', {}, 'Lumi tiene trucos para las tablas. Te los enseño y, al final, eliges el que más te guste.'),
  show('double-chain', { start: 3, steps: 1 }, 'El doble: 3 + 3 = 6. Sirve para la tabla del 2.'),
  show('double-chain', { start: 7, steps: 2 }, 'Doble, y doble otra vez: 7 → 14 → 28. Es 4 × 7.'),
  show('easy-tables', {}, 'Con el 5: la mitad de la tabla del 10. 5 × 8 es la mitad de 80, que es 40.'),
  show('nine-trick', { a: 7 }, 'Con el 9: diez veces el número, y quita una vez. 9 × 7 = 70 − 7 = 63.'),
  show('five-plus-one', { b: 7 }, 'Con el 6 y el 7: cinco veces el otro número, y una más. 6 × 7 = 42.'),
  show('array-rotate', { rows: 3, cols: 7, emoji: '🍄' }, 'El espejo: 7 × 3 es lo mismo que 3 × 7. Das la vuelta a la fila.'),
  tryIt('easy-tables', {}, '¡Te toca! Usa el truco que más te guste.', { kinds: ['fact-mul'], tables: [9], factorRange: [2, 9] }),
  {
    visual: 'easy-tables',
    params: {},
    text: '¿Cuál te ha resultado más fácil? Elígelo: será tu truco favorito para las tablas.',
    interaction: 'choose',
    preference: 'tableMethod',
    choices: TABLE_METHODS.map((m) => ({ label: m.label, value: m.id })),
  },
])
