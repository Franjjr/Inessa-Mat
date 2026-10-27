/* Clases de 3.º de Primaria, una por tema del temario (src/content/syllabus/grade3.ts). */
import { show, tryIt } from '@/content/lessons/dsl'
import { w4Borrow, w4Zero } from '@/content/lessons/w4'
import { clase, type ClassDef } from './dsl'

/* Sumar y restar, de menos a más. Cada clase: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o
   cuatro sin pistas (cada una un poco más difícil) y una frase que resume la regla. */
const sumar2d = clase({
  id: 'c3-suma-2d',
  topicId: 'suma-2d',
  title: 'Sumar con dos cifras',
  para: [
    show('place-value', { n: 34 }, 'En la feria del cole vendemos pulseras. Yo ya he hecho 34.', 'frog'),
    show('place-value', { n: 34 }, 'Mi amiga Dani trae 25 más. ¿Cuántas hay en total? Sumamos 34 + 25.', 'ladybug'),
  ],
  ejemplo: [
    show('carry', { a: 34, b: 25 }, 'Vamos a sumar 34 + 25. Empezamos por las unidades, como siempre.'),
    show('carry', { a: 34, b: 25 }, '4 + 5 = 9. Escribo el 9 en las unidades.'),
    show('carry', { a: 34, b: 25 }, 'Ahora las decenas: 3 + 2 = 5. ¡34 + 25 = 59!'),
    show('carry', { a: 38, b: 25 }, 'Ahora una con llevada: 38 + 25. Empezamos por las unidades.'),
    show('carry', { a: 38, b: 25 }, '8 + 5 = 13. Escribo el 3 y me llevo 1 decena.'),
    show('carry', { a: 38, b: 25 }, 'Decenas: 3 + 2 + 1 = 6. ¡38 + 25 = 63!'),
  ],
  guiada: [
    tryIt('carry', { a: 34, b: 25 }, '¡Te toca! Empieza por las unidades.', { skills: ['add:2d:c0'] }),
    tryIt('carry', { a: 34, b: 25 }, '¡Otra! Primero las unidades, después las decenas.', { skills: ['add:2d:c0'] }),
  ],
  sola: [
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Unidades primero.', { skills: ['add:2d:c1'] }),
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Si salen 10 o más, me llevo 1 decena.', { skills: ['add:2d:c1'] }),
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Cuidado con las llevadas.', { skills: ['add:2d:c0', 'add:2d:c1'] }),
  ],
  cierre: show('carry', { a: 38, b: 25 }, 'La regla: suma primero las unidades. Si salen 10 o más, escribe la cifra de las unidades y lleva 1 a las decenas.'),
})

const sumar3d = clase({
  id: 'c3-suma-3d',
  topicId: 'suma-3d-sin-llevar',
  title: 'Sumar con tres cifras',
  para: [
    show('place-value', { n: 342 }, 'La frutera tiene 342 peras en su cajón. ¡Hoy llegan 215 más del campo!', 'ladybug'),
    show('place-value', { n: 342 }, '¿Cuántas peras hay ahora? Sumamos 342 + 215, cifra con cifra.', 'frog'),
  ],
  ejemplo: [
    show('carry', { a: 342, b: 215 }, 'Vamos a sumar 342 + 215. Empezamos por las unidades.'),
    show('carry', { a: 342, b: 215 }, '2 + 5 = 7. Escribo el 7 en las unidades.'),
    show('carry', { a: 342, b: 215 }, 'Decenas: 4 + 1 = 5. Escribo el 5 en las decenas.'),
    show('carry', { a: 342, b: 215 }, 'Centenas: 3 + 2 = 5. ¡342 + 215 = 557!'),
  ],
  guiada: [
    tryIt('carry', { a: 342, b: 215 }, '¡Te toca! Empieza por las unidades.', { skills: ['add:3d:c0'] }),
    tryIt('carry', { a: 342, b: 215 }, '¡Otra! De las unidades a las centenas.', { skills: ['add:3d:c0'] }),
  ],
  sola: [
    tryIt('carry', { a: 342, b: 215 }, '¡Tu turno! Unidades primero.', { skills: ['add:2d:c1'] }),
    tryIt('carry', { a: 342, b: 215 }, '¡Tu turno! Cifra con cifra.', { skills: ['add:3d:c0'] }),
    tryIt('carry', { a: 342, b: 215 }, '¡Tu turno! Sin pistas: unidades, decenas y centenas.', { skills: ['add:3d:c0'] }),
  ],
  cierre: show('carry', { a: 342, b: 215 }, 'La regla: cifra con cifra, unidades con unidades, decenas con decenas y centenas con centenas.'),
})

const sumarLlevando = clase({
  id: 'c3-suma-llevando',
  topicId: 'suma-3d-llevando',
  title: 'Sumar y llevar',
  mapLessonId: 'w2-carry',
  para: [
    show('place-value', { n: 368 }, 'En el mercadillo, la tienda de Pepa tiene 368 pegatinas.', 'octopus'),
    show('place-value', { n: 368 }, 'Llegan 257 más. Para contarlas, sumamos 368 + 257. ¡Hay columnas que pasan de 10!', 'octopus'),
  ],
  ejemplo: [
    show('carry', { a: 368, b: 257 }, 'Vamos a sumar 368 + 257. Empezamos por las unidades.', 'frog'),
    show('carry', { a: 368, b: 257 }, '8 + 7 = 15. Escribo el 5 y me llevo 1.'),
    show('carry', { a: 368, b: 257 }, 'Decenas: 6 + 5 + 1 = 12. Escribo el 2 y me llevo 1.'),
    show('carry', { a: 368, b: 257 }, 'Centenas: 3 + 2 + 1 = 6. ¡368 + 257 = 625!'),
    show('carry', { a: 368, b: 257 }, 'La llevada es como una mochila: escríbela pequeñita arriba, y no te olvides de sumarla.'),
  ],
  guiada: [
    tryIt('carry', { a: 368, b: 257 }, '¡Te toca! Que no se escape ninguna llevada.', { skills: ['add:3d:c1'] }),
    tryIt('carry', { a: 368, b: 257 }, '¡Otra! Las llevadas van en la mochila de arriba.', { skills: ['add:3d:c1'] }),
  ],
  sola: [
    tryIt('carry', { a: 368, b: 257 }, '¡Tu turno! Empieza por las unidades.', { skills: ['add:3d:c1'] }),
    tryIt('carry', { a: 368, b: 257 }, '¡Tu turno! Ojo, pueden salir dos llevadas.', { skills: ['add:3d:c2'] }),
    tryIt('carry', { a: 368, b: 257 }, '¡Tu turno! Tres llevadas: no te olvides de ninguna.', { skills: ['add:3d:c3'] }),
  ],
  cierre: show('carry', { a: 368, b: 257 }, 'La regla: si una columna suma 10 o más, escribo solo la cifra de las unidades y llevo 1 a la columna de la izquierda.'),
})

const sumar4d = clase({
  id: 'c3-suma-4d',
  topicId: 'suma-4d',
  title: 'Sumar con cuatro cifras',
  para: [
    show('place-value', { n: 2475 }, 'La biblioteca del cole tiene 2 475 libros. ¡Hoy llegan 1 368 de una donación!', 'owl'),
    show('place-value', { n: 2475 }, '¿Cuántos libros hay ahora? Sumamos 2 475 + 1 368, con cuatro casas.', 'owl'),
  ],
  ejemplo: [
    show('carry', { a: 2475, b: 1368 }, 'Vamos a sumar 2 475 + 1 368. Son cuatro casas. Empezamos por las unidades.'),
    show('carry', { a: 2475, b: 1368 }, '5 + 8 = 13. Escribo el 3 y me llevo 1.'),
    show('carry', { a: 2475, b: 1368 }, 'Decenas: 7 + 6 + 1 = 14. Escribo el 4 y me llevo 1.'),
    show('carry', { a: 2475, b: 1368 }, 'Centenas: 4 + 3 + 1 = 8. Escribo el 8.'),
    show('carry', { a: 2475, b: 1368 }, 'Unidades de mil: 2 + 1 = 3. ¡2 475 + 1 368 = 3 843!'),
  ],
  guiada: [
    tryIt('carry', { a: 2475, b: 1368 }, '¡Te toca! Cuatro casas, de derecha a izquierda.', { skills: ['add:4d:c0'] }),
    tryIt('carry', { a: 2475, b: 1368 }, '¡Otra! Empieza por las unidades.', { skills: ['add:4d:c0'] }),
  ],
  sola: [
    tryIt('carry', { a: 2475, b: 1368 }, '¡Tu turno! Unidades primero.', { skills: ['add:4d:c1'] }),
    tryIt('carry', { a: 2475, b: 1368 }, '¡Tu turno! Algunas columnas llevan.', { skills: ['add:4d:c2'] }),
    tryIt('carry', { a: 2475, b: 1368 }, '¡Tu turno! Muchas llevadas seguidas.', { skills: ['add:4d:c3'] }),
  ],
  cierre: show('carry', { a: 2475, b: 1368 }, 'La regla no cambia con más casas: unidades primero, y cada columna que llega a 10 lleva 1 a la de la izquierda.'),
})

const restarSinLlevar = clase({
  id: 'c3-resta-sin-llevar',
  topicId: 'resta-3d-sin-llevar',
  title: 'Restar con tres cifras',
  para: [
    show('place-value', { n: 586 }, 'En el mercadillo hay 586 botellas de agua. ¡Qué calor hace!', 'frog'),
    show('place-value', { n: 586 }, 'Se venden 243. ¿Cuántas quedan? Hay que restar 586 − 243.', 'frog'),
  ],
  ejemplo: [
    show('borrow', { a: 586, b: 243 }, 'Vamos a restar 586 − 243. Empezamos por las unidades, como en las sumas.'),
    show('borrow', { a: 586, b: 243 }, 'Miro las unidades: 6 y 3.'),
    show('borrow', { a: 586, b: 243 }, 'El 6 es más grande que el 3. No hace falta pedir ayuda a la vecina.'),
    show('borrow', { a: 586, b: 243 }, 'Unidades: 6 − 3 = 3. Escribo el 3 abajo.'),
    show('borrow', { a: 586, b: 243 }, 'Decenas: 8 − 4 = 4. Centenas: 5 − 2 = 3. ¡586 − 243 = 343!'),
  ],
  guiada: [
    tryIt('borrow', { a: 586, b: 243 }, '¡Te toca! Empieza por las unidades.', { skills: ['sub:3d:b0'] }),
    tryIt('borrow', { a: 586, b: 243 }, '¡Otra! Mira si arriba hay más que abajo.', { skills: ['sub:3d:b0'] }),
  ],
  sola: [
    tryIt('borrow', { a: 586, b: 243 }, '¡Tu turno! Unidades primero.', { skills: ['sub:3d:b0'] }),
    tryIt('borrow', { a: 586, b: 243 }, '¡Tu turno! De derecha a izquierda.', { kinds: ['column-sub'], digits: 3, regroup: 'none' }),
    tryIt('borrow', { a: 586, b: 243 }, '¡Tu turno! Sin pistas.', { skills: ['sub:3d:b0'] }),
  ],
  cierre: show('borrow', { a: 586, b: 243 }, 'La regla: resta cifra con cifra, de derecha a izquierda; si la de arriba es más pequeña, pide ayuda a la vecina.'),
})

const restarPrestando = clase({
  id: 'c3-resta-prestando',
  topicId: 'resta-3d-prestando',
  title: 'Restar pidiendo prestado',
  mapLessonId: 'w4-borrow',
  para: [
    show('place-value', { n: 352 }, 'Un oso polar cuida 352 ovejas en la montaña.', 'polarbear'),
    show('place-value', { n: 352 }, '127 se han ido a pastar lejos. ¿Cuántas quedan? Restamos 352 − 127.', 'polarbear'),
  ],
  ejemplo: w4Borrow.steps.slice(0, 5),
  guiada: [
    tryIt('borrow', { a: 352, b: 127 }, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { skills: ['sub:3d:b1'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Otra! Primero la vecina, después la resta.', { skills: ['sub:3d:b1'] }),
  ],
  sola: [
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Pide ayuda a la vecina si hace falta.', { skills: ['sub:3d:b1'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Ojo: a veces hay que pedir dos veces.', { skills: ['sub:3d:b2'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Sin pistas, de derecha a izquierda.', { skills: ['sub:3d:b1', 'sub:3d:b2'] }),
  ],
  cierre: show('borrow', { a: 352, b: 127 }, 'La regla: si arriba falta, la vecina presta 1 decena, que son 10 unidades.'),
})

const restarCeros = clase({
  id: 'c3-resta-ceros',
  topicId: 'resta-con-ceros',
  title: 'Restar con ceros',
  mapLessonId: 'w4-zero',
  para: [
    show('place-value', { n: 503 }, 'En la papelería quedan 503 tebeos en la estantería.', 'ladybug'),
    show('place-value', { n: 503 }, 'Se llevan 128. Para saber cuántos quedan, restamos 503 − 128. ¡Ojo con el cero!', 'ladybug'),
  ],
  ejemplo: w4Zero.steps.slice(0, 4),
  guiada: [
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Te toca! Cuidado con la trampa del cero.', { skills: ['sub:3d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Otra! Si la vecina es un cero, mira más lejos.', { skills: ['sub:3d:z'] }),
  ],
  sola: [
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Cuidado con el cero.', { skills: ['sub:3d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Ahora con cuatro casas.', { skills: ['sub:4d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Sin pistas: a veces con tres casas, a veces con cuatro.', { skills: ['sub:3d:z', 'sub:4d:z'] }),
  ],
  cierre: show('zero-borrow', { a: 503, b: 128 }, 'La regla: si el cero no tiene nada que prestar, se pide a la cifra siguiente, y el cero pasa a ser 10.'),
})

const restarCuatroCifras = clase({
  id: 'c3-resta-4d',
  topicId: 'resta-4d',
  title: 'Restar con cuatro cifras',
  para: [
    show('place-value', { n: 4352 }, 'En la fiesta del cole hay 4 352 pegatinas.', 'ladybug'),
    show('place-value', { n: 4352 }, 'Se reparten 1 728. ¿Cuántas quedan? Restamos 4 352 − 1 728, casa por casa.', 'ladybug'),
  ],
  ejemplo: [
    show('borrow', { a: 4352, b: 1728 }, 'Ahora restamos con cuatro casas. Es igual que con tres: empezamos por la derecha.'),
    show('borrow', { a: 4352, b: 1728 }, '2 no puede con 8. Pido ayuda a la vecina de las decenas.'),
    show('borrow', { a: 4352, b: 1728 }, 'La vecina presta 1 decena: el 5 pasa a 4, y el 2 pasa a 12.'),
    show('borrow', { a: 4352, b: 1728 }, 'Unidades: 12 − 8 = 4. Escribo el 4. Las centenas también piden ayuda: el 3 pasa a 13, y el 4 de los millares presta 1.'),
    show('borrow', { a: 4352, b: 1728 }, 'Decenas: 4 − 2 = 2. Centenas: 13 − 7 = 6. Millares: 3 − 1 = 2. ¡4 352 − 1 728 = 2 624!'),
  ],
  guiada: [
    tryIt('borrow', { a: 4352, b: 1728 }, '¡Te toca! Cuatro casas, de derecha a izquierda.', { skills: ['sub:4d:b0'] }),
    tryIt('borrow', { a: 4352, b: 1728 }, '¡Otra! Empieza por las unidades.', { skills: ['sub:4d:b0'] }),
  ],
  sola: [
    tryIt('borrow', { a: 4352, b: 1728 }, '¡Tu turno! Pide ayuda a la vecina si hace falta.', { skills: ['sub:4d:b1'] }),
    tryIt('borrow', { a: 4352, b: 1728 }, '¡Tu turno! Algunas casas piden ayuda.', { skills: ['sub:4d:b2'] }),
    tryIt('borrow', { a: 4352, b: 1728 }, '¡Tu turno! Muchas ayudas seguidas.', { skills: ['sub:4d:b3'] }),
  ],
  cierre: show('borrow', { a: 4352, b: 1728 }, 'La regla no cambia con más casas: si arriba falta, pide 1 decena a la vecina.'),
})

export const GRADE3_CLASSES: ClassDef[] = [
  sumar2d,
  sumar3d,
  sumarLlevando,
  sumar4d,
  restarSinLlevar,
  restarPrestando,
  restarCeros,
  restarCuatroCifras,
]
