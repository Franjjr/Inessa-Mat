/* World 4 lessons: column subtraction with borrowing ("pide ayuda a la vecina"), the zero trap, the magic check. */
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
