/* World 8 lessons: dividing is fair sharing and multiplication backwards (fact families); the galera, the remainder
   and the division check. The inline sign for dividing is «:» (the one of the school), «÷» is not used in the lessons. */
import type { SkillSelector } from '@/types'
import { lesson, said, show, tryIt } from './dsl'

const share12 = { total: 12, groups: 3, emoji: '💎' }
const g84 = { dividend: 84, divisor: 4, written: 1 }
const g17 = { dividend: 17, divisor: 5, written: 1 }

export const w8Share = lesson('w8-share', 'Dividir es repartir', [
  show('share', share12, 'La reina tiene 12 gemas para 3 cofres. ¡A todos lo mismo!', 'queen'),
  show('share', share12, 'Reparte de una en una… ¡a cada cofre le tocan 4!'),
  said(
    show('share', share12, '12 : 3 = 4. Se lee «doce entre tres, cuatro». El signo «:» quiere decir «repartir entre».'),
    'Doce entre tres, cuatro. Así se lee. El signo de dividir son dos puntos, y quiere decir «repartir entre».',
  ),
  tryIt('share', { total: 10, groups: 2, emoji: '⭐' }, '¡Te toca! Piensa en repartir a todos lo mismo. ¿Cuánto le toca a cada uno?', { kinds: ['fact-div'], tables: [2, 3, 5], factorRange: [2, 5] }),
  show('fact-family', { a: 3, b: 4 }, 'Con 3, 4 y 12 puedes hacer 4 operaciones. ¡Es una familia de números!'),
  show('fact-family', { a: 3, b: 4 }, 'Mira las cuatro: 3 por 4 son 12, 4 por 3 son 12, 12 entre 3 son 4 y 12 entre 4 son 3.'),
  show('fact-family', { a: 6, b: 7 }, 'El gran secreto: dividir es lo contrario de multiplicar. Para hacer 42 : 6 pregúntate: ¿6 por cuánto da 42?'),
  show('fact-family', { a: 6, b: 7 }, 'Busca en la tabla del 6: 6 × 7 = 42. ¡Entonces 42 : 6 = 7!'),
  tryIt('fact-family', { a: 6, b: 8 }, '¡Te toca! Piensa en la multiplicación.', { kinds: ['fact-div'], tables: [6, 7, 8], factorRange: [2, 9] }),
])

/** The galera is drawn with its subtractions written (written: 1); one step per beat: the casita, the quotient digit,
    the subtraction, the next quotient digit… (see galeraBeats in the visual). */
export const w8Galera = lesson('w8-galera', 'La casita de la división', [
  show('galera', g84, 'Esta es la casita de la división. Fuera, a la izquierda, va el número que repartimos: el 84. Se llama dividendo.'),
  show('galera', g84, 'Dentro de la casita va el divisor: el 4, entre cuántos repartimos. Debajo irá el cociente, el resultado.'),
  show('galera', g84, 'Primera cifra, el 8. ¿Cuántas veces cabe el 4 en el 8? Dos, porque 2 × 4 = 8. Escribo el 2 debajo del divisor.'),
  show('galera', g84, 'Ahora resto: 8 − 8 = 0. No sobra nada.'),
  show('galera', g84, 'Bajo la cifra siguiente, el 4. ¿Cuántas veces cabe el 4 en el 4? Una vez. Escribo el 1 al lado del 2.'),
  show('galera', g84, 'Y 4 − 4 = 0. ¡Terminado! 84 : 4 = 21. El cociente es 21 y no sobra nada.'),
  tryIt('galera', g84, '¡Te toca! Mira la primera cifra: ¿cuántas veces cabe el divisor? Escríbelo, resta y baja la cifra siguiente.', { kinds: ['division'], divisionVariants: ['exact'] }),
  show('galera', g17, '¿Y 17 : 5? El 1 es más pequeño que el 5: no cabe. Por eso cogemos las dos cifras, el 17.'),
  show('galera', g17, '¿Cuánto por 5 se acerca a 17 sin pasarse? 5 × 3 = 15. Con 5 × 4 = 20 me paso. El cociente es 3.'),
  show('galera', g17, 'Ahora resto: 17 − 15 = 2. Esos 2 que sobran son el resto. Es siempre más pequeño que el divisor.'),
  show('division-check', { dividend: 17, divisor: 5 }, 'Haz la prueba: el divisor por el cociente, 5 por 3, 15. Más el resto, 15 + 2 = 17. ¡Sale el dividendo!'),
  tryIt('galera', g17, '¡Te toca! Busca en la tabla del divisor lo que más se acerca sin pasarse. El resto es lo que sobra.', { kinds: ['division'], divisionVariants: ['rem'] }),
])

/* «Dos formas de hacer la galera»: the same 84 : 4 with the subtractions written and without them. The world map has
   no optional stops yet (every earlier stop must be done), so the lesson sits right before the guardian and asks for
   ONE try, with the way the grown-ups set in the settings (no fixed `divMethod`: the try slot reads
   ChildSettings.divMethod). */
const exactDivision: SkillSelector = { kinds: ['division'], divisionVariants: ['exact'] }

export const w8DivWays = lesson('w8-div-ways', 'Dos formas de hacer la galera', [
  show('galera', g84, 'Hay dos formas de hacer la galera. Con restas: 8 entre 4, a 2. 2 por 4, 8. Y 8 − 8 = 0, debajo.'),
  show('galera', g84, 'Bajo el 4. 4 entre 4, a 1. 1 por 4, 4. Y 4 − 4 = 0. El cociente es 21.'),
  show('galera', { dividend: 84, divisor: 4 }, 'La segunda, sin restas: haces lo mismo, pero las restas las piensas. Solo escribes el cociente y lo que sobra.'),
  tryIt('galera', { dividend: 84, divisor: 4 }, '¡Pruébalo tú! Haz la galera como la hacéis en tu cole. Si no sabes cuál es, pregunta a tu familia.', exactDivision),
])
