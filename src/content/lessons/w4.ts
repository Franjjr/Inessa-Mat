/* World 4 lessons: column subtraction with borrowing ("pide ayuda a la vecina"), the zero trap, the magic check, the
   two ways of subtracting that schools teach («Dos formas de restar del cole») and the bar of the problems. */
import type { LessonStep, SkillSelector, SubMethod } from '@/types'
import { lesson, show, tryIt } from './dsl'

const b352 = { a: 352, b: 127 }
const z503 = { a: 503, b: 128 }
const z4352 = { a: 4352, b: 1728 }

export const w4Borrow = lesson('w4-borrow', 'Restar en la montaña', [
  show('borrow', b352, 'Regla 1: el número grande va arriba. Se resta el de arriba menos el de abajo.', 'polarbear'),
  show('borrow', b352, 'Regla 2: empieza por las unidades, como en las sumas. 2 − 7… ¡no se puede!', 'polarbear'),
  show('borrow', b352, 'Regla 3: ¡pide ayuda a la vecina! Las decenas te prestan 1 decena, que son 10 unidades.', 'polarbear'),
  show('borrow', b352, 'El 5 se convierte en 4 y el 2 en 12. Ahora sí: 12 − 7 = 5.'),
  show('borrow', b352, 'Decenas: 4 − 2 = 2. Centenas: 3 − 1 = 2. ¡352 − 127 = 225!'),
  tryIt('borrow', b352, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false }),
  show('sub-check', b352, 'Ahora, la prueba mágica. ¿Cómo sabemos que una resta está bien hecha?'),
  show('sub-check', b352, 'Para saber si está bien, sumamos el resultado y el número de abajo: 225 más 127 son 352, que es el de arriba. ¡Está bien!'),
])

export const w4Zero = lesson('w4-zero', 'La trampa del cero', [
  show('zero-borrow', z503, '3 − 8 no se puede. Y la vecina es un 0: ¡no tiene nada que prestar!'),
  show('zero-borrow', z503, 'Entonces se pide a la centena: el 5 pasa a 4, y el 0 pasa a 10.'),
  show('zero-borrow', z503, 'Ahora el 10 le presta una decena a las unidades: se queda en 9 y el 3 se convierte en 13.'),
  show('zero-borrow', z503, '13 − 8 = 5. 9 − 2 = 7. 4 − 1 = 3. ¡503 − 128 = 375!'),
  tryIt('zero-borrow', z503, '¡Te toca! Cuidado con la trampa del cero.', { kinds: ['column-sub'], digits: 3, zeros: true }),
  // Four digits, column by column: one step to set the numbers and one step per column.
  show('borrow', z4352, 'Con 4 cifras se hace igual: casa por casa, empezando por la derecha.'),
  show('borrow', z4352, 'Unidades: 2 menos 8 no se puede. Las decenas prestan: el 5 pasa a 4 y el 2 a 12. 12 menos 8 son 4.'),
  show('borrow', z4352, 'Decenas: 4 menos 2 son 2.'),
  show('borrow', z4352, 'Centenas: 3 menos 7 no se puede. Los millares prestan: el 4 pasa a 3 y el 3 a 13. 13 menos 7 son 6.'),
  show('borrow', z4352, 'Millares: 3 menos 1 son 2. Resultado: 2624.'),
  tryIt('borrow', z4352, '¡Una de 4 cifras! Y después, si quieres, haz la prueba mágica.', { kinds: ['column-sub'], digits: 4, regroup: 'one', zeros: false }),
  show('sub-check', z4352, 'La prueba mágica sirve siempre: 2624 + 1728 = 4352.'),
])

/* «Dos formas de restar del cole»: the two ways that Spanish schools teach, with the same example. Optional: it sits at
   the end of the world, and the child's family picks the way in the settings. Its tries are always 3-digit
   subtractions without zeros and with one borrowing, the shape of the example. */
const threeDigitsOneBorrow: SkillSelector = { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false }

/** A "¡pruébalo tú!" step that must be solved with one method. */
function tryWith(method: SubMethod, text: string): LessonStep {
  return { ...tryIt('sub-check', b352, text, threeDigitsOneBorrow), method }
}

export const w4FourWays = lesson('w4-four-ways', 'Dos formas de restar del cole', [
  show('borrow', b352, 'En el cole se enseñan dos formas de restar. Las dos dan el mismo resultado. Las verás con el mismo ejemplo: 352 − 127. Primera forma: pedir prestado.'),
  show('borrow', b352, 'Empezamos por las unidades: 2 − 7… ¡no se puede!'),
  show('borrow', b352, 'Las decenas nos prestan 1 decena, que son 10 unidades.'),
  show('borrow', b352, 'El 5 se convierte en 4 y el 2 en 12. Ahora sí: 12 − 7 = 5.'),
  show('borrow', b352, 'Decenas: 4 menos 2 son 2. Centenas: 3 menos 1 son 2. Resultado: 225.'),
  tryWith('borrow', '¡Pruébalo tú! Pide prestado arriba.'),
  show('sub-carry', b352, 'Segunda forma: me llevo una. Unidades: 2 menos 7 no se puede. Ponemos un 1 delante del 2 y es 12. 12 menos 7 son 5.'),
  show('sub-carry', b352, 'Como hemos puesto 10 arriba, nos llevamos una: se la sumamos al 2 de abajo de las decenas. 2 y 1 son 3.'),
  show('sub-carry', b352, 'Decenas: 5 menos 3 son 2.'),
  show('sub-carry', b352, 'Centenas: 3 menos 1 son 2. Resultado: 225.'),
  tryWith('carry', '¡Pruébalo tú! Me llevo una abajo.'),
  show('sub-check', b352, 'Haz la que hacéis en tu cole. Si no sabes cuál es, pregunta a tu familia.'),
])

/* «Dibujar la historia»: the bar diagram for problems. The child first sees the drawing for a sum (the whole is unknown)
   and for a take-away (the whole is known and a part is the «?»), and then solves it with the bar. */

export const w4Bars = lesson('w4-bars', 'Dibujar la historia', [
  show('bar-model', { a: 5, b: 3, total: 8 }, 'Para entender un problema, lo dibujamos con una barra. La barra entera es el total. Los trozos son las partes.'),
  show('bar-model', { a: 5, b: 3, total: 8 }, 'Ana tiene 5 canicas y Luis tiene 3. Dibujamos un trozo de 5 y otro trozo de 3.'),
  show('bar-model', { a: 5, b: 3, total: 8 }, '¿Cuántas tienen entre los dos? Es la barra entera. Juntamos los trozos: 5 más 3 son 8. Juntar es sumar.'),
  // b = 0 draws the second part as «?» (see BarModelVisual): the whole is known, a part is missing.
  show('bar-model', { a: 4, b: 0, total: 13 }, 'Otro problema: Leo tenía 13 cromos y regala 4. Ahora la barra entera es lo que tenía: 13.'),
  show('bar-model', { a: 4, b: 0, total: 13 }, 'Un trozo son los 4 que regala. El otro trozo, con el signo de interrogación, es lo que le queda.'),
  show('bar-model', { a: 4, b: 0, total: 13 }, 'Para hallar un trozo que falta, al total le quitamos el otro trozo: 13 menos 4 son 9. Quitar es restar.'),
  show('bar-model', { a: 5, b: 3, total: 8 }, 'En el ejercicio: toca un número y después toca su trozo de la barra. Luego elige Juntar o Quitar y escribe el resultado.'),
  tryIt('bar-model', { a: 5, b: 3, total: 8 }, '¡Te toca! Coloca los números, elige la operación y escribe cuánto es.', { kinds: ['bar-problem'], skills: ['bar:add', 'bar:sub'] }),
])
