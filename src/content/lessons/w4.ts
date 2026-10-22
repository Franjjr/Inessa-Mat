/* World 4 lessons: column subtraction with borrowing ("pide ayuda a la vecina"), the zero trap, the magic check, and
   the four ways to subtract («Cuatro caminos para restar»), which ends with the child's favourite method. */
import { SUB_METHODS } from '@/engine/methods'
import type { LessonStep, SkillSelector, SubMethod } from '@/types'
import { lesson, show, tryIt } from './dsl'

const b352 = { a: 352, b: 127 }
const z503 = { a: 503, b: 128 }

export const w4Borrow = lesson('w4-borrow', 'Restar en la montaña', [
  show('borrow', b352, 'Regla 1: el número grande va arriba. Se resta el de arriba menos el de abajo.', 'polarbear'),
  show('borrow', b352, 'Regla 2: empieza por las unidades, como en las sumas. 2 − 7… ¡no se puede!', 'polarbear'),
  show('borrow', b352, 'Regla 3: ¡pide ayuda a la vecina! Las decenas te prestan 1 decena, que son 10 unidades.', 'polarbear'),
  show('borrow', b352, 'El 5 se convierte en 4 y el 2 en 12. Ahora sí: 12 − 7 = 5.'),
  show('borrow', b352, 'Decenas: 4 − 2 = 2. Centenas: 3 − 1 = 2. ¡352 − 127 = 225!'),
  tryIt('borrow', b352, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false }),
  show('sub-check', b352, 'La prueba mágica: suma el resultado y el número de abajo. ¡Te tiene que dar el de arriba!'),
  show('sub-check', b352, '225 + 127 = 352. ¡Está bien!'),
  show('sub-check', b352, 'Si en tu cole restáis «llevando», ¡hazlo como en el cole! El resultado es el mismo.'),
])

export const w4Zero = lesson('w4-zero', 'La trampa del cero', [
  show('zero-borrow', z503, '3 − 8 no se puede. Y la vecina es un 0: ¡no tiene nada que prestar!'),
  show('zero-borrow', z503, 'Entonces se pide a la centena: el 5 pasa a 4, y el 0 pasa a 10.'),
  show('zero-borrow', z503, 'Ahora el 10 presta 1 a las unidades: se queda en 9, y el 3 se convierte en 13.'),
  show('zero-borrow', z503, '13 − 8 = 5. 9 − 2 = 7. 4 − 1 = 3. ¡503 − 128 = 375!'),
  tryIt('zero-borrow', z503, '¡Te toca! Cuidado con la trampa del cero.', { kinds: ['column-sub'], digits: 3, zeros: true }),
  show('borrow', { a: 4352, b: 1728 }, 'Con 4 cifras se hace igual: casa por casa, empezando por la derecha.'),
  tryIt('borrow', { a: 4352, b: 1728 }, '¡Una de 4 cifras! Y después, si quieres, haz la prueba mágica.', { kinds: ['column-sub'], digits: 4, regroup: 'one', zeros: false }),
  show('sub-check', { a: 4352, b: 1728 }, 'La prueba mágica sirve siempre: 2624 + 1728 = 4352.'),
])

const fourWays = { a: 352, b: 127 }
const threeDigitsOneBorrow: SkillSelector = { kinds: ['column-sub'], digits: 3, regroup: 'one', zeros: false }

/** A "¡pruébalo tú!" step that must be solved with one method. */
function tryWith(method: SubMethod, text: string): LessonStep {
  return { ...tryIt('sub-check', fourWays, text, threeDigitsOneBorrow), method }
}

const labelOf = (id: SubMethod) => SUB_METHODS.find((m) => m.id === id)?.label ?? id

export const w4FourWays = lesson('w4-four-ways', 'Cuatro caminos para restar', [
  show('sub-check', fourWays, 'Para restar hay cuatro caminos. Los verás con el mismo ejemplo: 352 − 127.'),
  show('borrow', fourWays, `Camino 1: ${labelOf('borrow')}. El 2 no puede con 7: la vecina presta 1 decena.`),
  show('borrow', fourWays, 'El 5 se vuelve 4 y el 2, 12. Ahora: 12 − 7 = 5, 4 − 2 = 2 y 3 − 1 = 2.'),
  tryWith('borrow', '¡Pruébalo tú! Pide prestado arriba.'),
  show('sub-carry', fourWays, `Camino 2: ${labelOf('carry')}. 12 − 7 = 5, y al 2 de abajo le sumas 1.`),
  show('sub-carry', fourWays, 'Ahora: 5 − 3 = 2 y 3 − 1 = 2. ¡225 otra vez!'),
  tryWith('carry', '¡Pruébalo tú! Me llevo una abajo.'),
  show('sub-parts', fourWays, `Camino 3: ${labelOf('parts')}. Parte el 127 en 100, 20 y 7, y quítalos uno a uno.`),
  show('sub-parts', fourWays, '352 − 100 = 252, 252 − 20 = 232 y 232 − 7 = 225.'),
  tryWith('parts', '¡Pruébalo tú! Resta por partes.'),
  show('sub-line', fourWays, `Camino 4: ${labelOf('line')}. Desde 127 cuento hasta 352, saltando a números redondos.`),
  show('sub-line', fourWays, '127 → 130 (3), 130 → 300 (170), 300 → 350 (50), 350 → 352 (2). En total, 225.'),
  tryWith('line', '¡Pruébalo tú! Cuenta con saltos.'),
  {
    visual: 'sub-check',
    params: fourWays,
    text: '¿Cuál te ha resultado más fácil? Elígelo: será tu método favorito para restar.',
    interaction: 'choose',
    choices: SUB_METHODS.map((m) => ({ label: m.label, value: m.id })),
  },
])

/* «Dibujar la historia»: the bar diagram for problems. The child first sees the drawing for each kind (juntar, quitar,
   comparar, repartir) and then solves it with the bar; the drawing is taken away once the bar is mastered. */

export const w4Bars = lesson('w4-bars', 'Dibujar la historia', [
  show('bar-model', { a: 5, b: 3, total: 8 }, 'Para un problema puedes dibujar una barra. Cada parte es una cantidad y el total es la barra entera.'),
  show('bar-model', { a: 5, b: 3, total: 8 }, 'Si Ana tiene 5 canicas y Luis tiene 3, las dos juntas son 5 + 3 = 8. Juntar es sumar.'),
  show('bar-model', { a: 9, b: 4, total: 13 }, 'Y si de 13 quitas 4, lo que queda es 13 − 4 = 9. Quitar es restar.'),
  tryIt('bar-model', { a: 5, b: 3, total: 8 }, '¡Te toca! Pon los números en la barra y elige la operación.', { kinds: ['bar-problem'], skills: ['bar:add'] }),
])
