/* Clases de 3.º de Primaria, una por tema del temario (src/content/syllabus/grade3.ts). */
import { show, tryIt } from '@/content/lessons/dsl'
import { w4Borrow, w4Zero } from '@/content/lessons/w4'
import { w7Carry, w7Split } from '@/content/lessons/w7'
import { clase, type ClassDef } from './dsl'

/* Sumar y restar, de menos a más. Cada clase: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o
   cuatro sin pistas (cada una un poco más difícil) y una frase que resume la regla. */
const sumar2d = clase({
  id: 'c3-suma-2d',
  topicId: 'suma-2d',
  title: 'Sumar con dos cifras',
  para: [
    show('place-value', { n: 34 }, 'En la feria del cole vendemos pulseras. Yo ya he hecho 34.', 'frog'),
    show('place-value', { n: 34 }, 'El 34 son 3 decenas y 4 unidades. Mi amiga Dani trae 25 más: sumamos 34 + 25.', 'ladybug'),
  ],
  ejemplo: [
    show('carry', { a: 34, b: 25 }, 'Vamos a sumar 34 + 25. Empezamos por las unidades, como siempre.'),
    show('carry', { a: 34, b: 25 }, '4 + 5 = 9. Escribo el 9 en las unidades.'),
    show('carry', { a: 34, b: 25 }, 'Decenas: 3 + 2 = 5. ¡34 + 25 = 59!'),
    show('carry', { a: 38, b: 25 }, 'Ahora una con llevada: 38 + 25. Empezamos por las unidades.'),
    show('carry', { a: 38, b: 25 }, '8 + 5 = 13. Escribo el 3 y me llevo 1 decena.'),
    show('carry', { a: 38, b: 25 }, 'Decenas: 3 + 2 + 1 = 6. ¡38 + 25 = 63!'),
  ],
  guiada: [
    tryIt('carry', { a: 34, b: 25 }, '¡Te toca! Empieza por las unidades.', { skills: ['add:2d:c0'] }),
    tryIt('carry', { a: 34, b: 25 }, '¡Otra! Primero las unidades, después las decenas.', { skills: ['add:2d:c0'] }),
  ],
  sola: [
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Unidades primero.', { skills: ['add:2d:c0'] }),
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Si salen 10 o más, me llevo 1 decena.', { skills: ['add:2d:c1'] }),
    tryIt('carry', { a: 38, b: 25 }, '¡Tu turno! Cuidado con las llevadas.', { skills: ['add:2d:c1'] }),
  ],
  cierre: show('carry', { a: 38, b: 25 }, 'Se suma primero la columna de las unidades, y si salen 10 o más se escribe su cifra y se lleva 1 a las decenas.'),
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
    tryIt('carry', { a: 342, b: 215 }, '¡Tu turno! Unidades primero.', { skills: ['add:3d:c0'] }),
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
    show('carry', { a: 2475, b: 1368 }, 'Millares: 2 + 1 = 3. ¡2 475 + 1 368 = 3 843!'),
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
    show('place-value', { n: 586 }, 'En la tienda del pueblo hay 586 botellas de agua. ¡Qué calor hace!', 'frog'),
    show('place-value', { n: 586 }, 'Se venden 243. ¿Cuántas quedan? Hay que restar 586 − 243.', 'frog'),
  ],
  ejemplo: [
    show('borrow', { a: 586, b: 243 }, 'Vamos a restar 586 − 243. Empezamos por las unidades, como en las sumas.'),
    show('borrow', { a: 586, b: 243 }, 'Miro las unidades: 6 y 3.'),
    show('borrow', { a: 586, b: 243 }, 'El 6 es más grande que el 3. No hace falta pedir ayuda a la vecina.'),
    show('borrow', { a: 586, b: 243 }, 'Unidades: 6 − 3 = 3. Escribo el 3 abajo.'),
    show('borrow', { a: 586, b: 243 }, 'Decenas: 8 − 4 = 4. Escribo el 4.'),
    show('borrow', { a: 586, b: 243 }, 'Centenas: 5 − 2 = 3. ¡586 − 243 = 343!'),
  ],
  guiada: [
    tryIt('borrow', { a: 586, b: 243 }, '¡Te toca! Empieza por las unidades.', { skills: ['sub:3d:b0'] }),
    tryIt('borrow', { a: 586, b: 243 }, 'Mira si la cifra de arriba es más pequeña que la de abajo.', { skills: ['sub:3d:b0'] }),
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
    show('place-value', { n: 352 }, '127 se han ido a pastar lejos. ¿Cuántas quedan? Restamos 352 − 127. Cuando no alcanza, a esto lo llamamos pedir prestado arriba.', 'polarbear'),
  ],
  ejemplo: w4Borrow.steps.slice(0, 5),
  guiada: [
    tryIt('borrow', { a: 352, b: 127 }, '¡Te toca! Si arriba hay un número más pequeño, pide ayuda a la vecina.', { skills: ['sub:3d:b1'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Otra! Primero la vecina, después la resta.', { skills: ['sub:3d:b1'] }),
  ],
  sola: [
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Pide ayuda a la vecina si hace falta.', { skills: ['sub:3d:b1'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Ojo: a veces hay que pedir dos veces.', { skills: ['sub:3d:b2'] }),
    tryIt('borrow', { a: 352, b: 127 }, '¡Tu turno! Sin pistas, de derecha a izquierda.', { skills: ['sub:3d:b2'] }),
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
    show('place-value', { n: 503 }, 'Se llevan 128. Para saber cuántos quedan, restamos 503 − 128. Cuando no alcanza, pedimos prestado arriba. ¡Ojo con el cero!', 'ladybug'),
  ],
  ejemplo: w4Zero.steps.slice(0, 4),
  guiada: [
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Te toca! Cuidado con la trampa del cero.', { skills: ['sub:3d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Otra! Si la vecina es un cero, mira más lejos.', { skills: ['sub:3d:z'] }),
  ],
  sola: [
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Cuidado con el cero.', { skills: ['sub:3d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Ahora con cuatro casas.', { skills: ['sub:4d:z'] }),
    tryIt('zero-borrow', { a: 503, b: 128 }, '¡Tu turno! Sin pistas: ahora con cuatro casas y ceros.', { skills: ['sub:4d:z'] }),
  ],
  cierre: show('zero-borrow', { a: 503, b: 128 }, 'La regla: si el cero no tiene nada que prestar, se pide a la cifra siguiente, el cero pasa a ser 10 y ese 10 presta 1 a las unidades.'),
})

const restarCuatroCifras = clase({
  id: 'c3-resta-4d',
  topicId: 'resta-4d',
  title: 'Restar con cuatro cifras',
  // The story steps use the borrow picture too: its phases go on counting into the example (one run of 7 steps).
  para: [
    show('borrow', { a: 4365, b: 1228 }, 'En la fiesta del cole hay 4 365 pegatinas.', 'ladybug'),
    show('borrow', { a: 4365, b: 1228 }, 'Se reparten 1 228. ¿Cuántas quedan? Restamos 4 365 − 1 228. Cuando no alcanza, a esto lo llamamos pedir prestado arriba.', 'ladybug'),
  ],
  ejemplo: [
    show('borrow', { a: 4365, b: 1228 }, '5 no puede con 8. La vecina de las decenas presta 1: el 6 pasa a 5, y el 5 pasa a 15.'),
    show('borrow', { a: 4365, b: 1228 }, 'Unidades: 15 − 8 = 7. Escribo el 7.'),
    show('borrow', { a: 4365, b: 1228 }, 'Decenas: 5 − 2 = 3. Escribo el 3.'),
    show('borrow', { a: 4365, b: 1228 }, 'Centenas: 3 − 2 = 1. Escribo el 1.'),
    show('borrow', { a: 4365, b: 1228 }, 'Millares: 4 − 1 = 3. ¡4 365 − 1 228 = 3 137!'),
  ],
  guiada: [
    tryIt('borrow', { a: 4365, b: 1228 }, '¡Te toca! Cuatro casas, de derecha a izquierda.', { skills: ['sub:4d:b0'] }),
    tryIt('borrow', { a: 4365, b: 1228 }, '¡Otra! Empieza por las unidades.', { skills: ['sub:4d:b0'] }),
  ],
  sola: [
    tryIt('borrow', { a: 4365, b: 1228 }, '¡Tu turno! Pide ayuda a la vecina si hace falta.', { skills: ['sub:4d:b1'] }),
    tryIt('borrow', { a: 4365, b: 1228 }, '¡Tu turno! Algunas casas piden ayuda.', { skills: ['sub:4d:b2'] }),
    tryIt('borrow', { a: 4365, b: 1228 }, '¡Tu turno! Muchas ayudas seguidas.', { skills: ['sub:4d:b3'] }),
  ],
  cierre: show('borrow', { a: 4365, b: 1228 }, 'La regla no cambia con más casas: si arriba falta, pide 1 decena a la vecina.'),
})

/* Multiplicar, de menos a más. Mismo esquema: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o
   cuatro sin pistas (cada una igual o más difícil) y una frase que resume la regla. */
const mul2x1 = clase({
  id: 'c3-mul-2x1',
  topicId: 'mul-2x1-sin-llevar',
  title: 'Multiplicar por una cifra',
  mapLessonId: 'w7-split',
  para: [
    show('place-value', { n: 23 }, 'En la granja de Lola, cada una de las 23 gallinas pone 3 huevos al día.', 'frog'),
    show('place-value', { n: 23 }, '¿Cuántos huevos son en total? Multiplicamos 23 × 3, por trocitos.', 'frog'),
  ],
  ejemplo: w7Split.steps.slice(0, 5),
  guiada: [
    tryIt('column-mul', { top: 23, bottom: 3 }, '¡Te toca! Primero las unidades, después las decenas.', { skills: ['mul:2x1:c0'] }),
    tryIt('column-mul', { top: 23, bottom: 3 }, '¡Otra! Escribe el resultado de cada columna en su sitio.', { skills: ['mul:2x1:c0'] }),
  ],
  sola: [
    tryIt('column-mul', { top: 23, bottom: 3 }, '¡Tu turno! Empieza por las unidades.', { skills: ['mul:2x1:c0'] }),
    tryIt('column-mul', { top: 23, bottom: 3 }, '¡Tu turno! Cada columna, de derecha a izquierda.', { skills: ['mul:2x1:c0'] }),
    tryIt('column-mul', { top: 23, bottom: 3 }, '¡Tu turno! Multiplica cada cifra de arriba por la de abajo.', { skills: ['mul:2x1:c0'] }),
  ],
  cierre: show('column-mul', { top: 23, bottom: 3 }, 'Se multiplica cada cifra de arriba por la de abajo, empezando por las unidades, y cada resultado va en su columna.'),
})

const mul2x1Llevando = clase({
  id: 'c3-mul-2x1-llevando',
  topicId: 'mul-2x1-llevando',
  title: 'Multiplicar y llevar',
  mapLessonId: 'w7-carry',
  para: [
    show('place-value', { n: 47 }, 'En el puesto de helados de Tomás hay 6 cucuruchos para la fiesta del barrio.', 'octopus'),
    show('place-value', { n: 47 }, 'Cada cucurucho lleva 47 gominolas. ¿Cuántas son? Multiplicamos 47 × 6, y esta vez hay llevadas.', 'octopus'),
  ],
  ejemplo: w7Carry.steps.slice(0, 4),
  guiada: [
    tryIt('column-mul', { top: 47, bottom: 6 }, '¡Te toca! Que no se escape ninguna llevada.', { skills: ['mul:2x1:c1'] }),
    tryIt('column-mul', { top: 47, bottom: 6 }, '¡Otra! Las llevadas van arriba, en la columna de la izquierda.', { skills: ['mul:2x1:c1'] }),
  ],
  sola: [
    tryIt('column-mul', { top: 47, bottom: 6 }, '¡Tu turno! Empieza por las unidades.', { skills: ['mul:2x1:c1'] }),
    tryIt('column-mul', { top: 47, bottom: 6 }, '¡Tu turno! Primero multiplica, luego suma la llevada.', { skills: ['mul:2x1:c1'] }),
    tryIt('column-mul', { top: 47, bottom: 6 }, '¡Tu turno! Sin pistas: no te olvides de ninguna llevada.', { skills: ['mul:2x1:c1'] }),
  ],
  cierre: show('column-mul', { top: 47, bottom: 6 }, 'La llevada de una columna se suma después de multiplicar la columna siguiente: primero multiplica, luego suma la mochila.'),
})

const mul3x1 = clase({
  id: 'c3-mul-3x1',
  topicId: 'mul-3x1',
  title: 'Multiplicar 3 cifras por 1',
  para: [
    show('place-value', { n: 213 }, 'En la panadería de Nina, cada bandeja tiene 213 magdalenas. ¡Qué bien huele!', 'ladybug'),
    show('place-value', { n: 213 }, 'Nina llena 3 bandejas iguales. ¿Cuántas magdalenas son? Multiplicamos 213 × 3.', 'ladybug'),
  ],
  ejemplo: [
    show('place-value', { n: 213 }, '213 son 200, 10 y 3. Voy a multiplicar cada parte por 3.'),
    show('column-mul', { top: 213, bottom: 3 }, 'Unidades: 3 × 3 = 9. Escribo el 9.'),
    show('column-mul', { top: 213, bottom: 3 }, 'Decenas: 1 × 3 = 3 decenas, que son 30. Escribo el 3 en las decenas.'),
    show('column-mul', { top: 213, bottom: 3 }, 'Centenas: 2 × 3 = 6 centenas, que son 600.'),
    show('column-mul', { top: 213, bottom: 3 }, '600 + 30 + 9 = 639. ¡213 × 3 = 639!'),
  ],
  guiada: [
    tryIt('column-mul', { top: 213, bottom: 3 }, '¡Te toca! Empieza por las unidades, como siempre.', { skills: ['mul:3x1:c0'] }),
    tryIt('column-mul', { top: 213, bottom: 3 }, '¡Otra! Cada columna, de derecha a izquierda.', { skills: ['mul:3x1:c0'] }),
  ],
  sola: [
    tryIt('column-mul', { top: 213, bottom: 3 }, '¡Tu turno! Unidades primero.', { skills: ['mul:3x1:c0'] }),
    tryIt('column-mul', { top: 213, bottom: 3 }, '¡Tu turno! Ahora hay llevadas: ¡ojo con las columnas grandes!', { skills: ['mul:3x1:c1'] }),
    tryIt('column-mul', { top: 213, bottom: 3 }, '¡Tu turno! Sin pistas: no te olvides de las llevadas.', { skills: ['mul:3x1:c1'] }),
  ],
  cierre: show('column-mul', { top: 213, bottom: 3 }, 'Con tres cifras se hace igual: se multiplica cada columna de derecha a izquierda, y las llevadas se suman en la columna siguiente.'),
})

const mulPor10 = clase({
  id: 'c3-mul-10-100',
  topicId: 'mul-10-100',
  title: 'Multiplicar por 10 y por 100',
  para: [
    show('place-value', { n: 34 }, 'En el huerto de Sam, cada bancal tiene 34 tomates.', 'frog'),
    show('place-value', { n: 34 }, 'Sam tiene 10 bancales iguales. ¿Cuántos tomates son? Multiplicamos 34 × 10.', 'frog'),
  ],
  ejemplo: [
    show('place-value', { n: 34 }, 'Vamos a multiplicar 34 × 10. El 34 tiene 3 decenas y 4 unidades.'),
    show('place-value', { n: 340 }, 'Al multiplicar por 10, cada cifra sube una casa y las unidades se llenan con un 0. ¡34 × 10 = 340!'),
    show('place-value', { n: 3400 }, 'Por 100, cada cifra sube dos casas: el 3 pasa a los millares y el 4 a las centenas. ¡34 × 100 = 3 400!'),
  ],
  guiada: [
    tryIt('place-value', { n: 340 }, '¡Te toca! Cada cifra sube una casa hacia la izquierda.', { skills: ['mental:por10'] }),
    tryIt('place-value', { n: 340 }, '¡Otra! Mira cuántos ceros se añaden al final.', { skills: ['mental:por10'] }),
  ],
  sola: [
    tryIt('place-value', { n: 3400 }, '¡Tu turno! Cada cifra sube una casa hacia la izquierda.', { skills: ['mental:por10'] }),
    tryIt('place-value', { n: 3400 }, '¡Tu turno! Si hay más ceros, cada cifra sube más casas.', { skills: ['mental:por10'] }),
    tryIt('place-value', { n: 3400 }, '¡Tu turno! Ojo: si es una división, los ceros se quitan.', { skills: ['mental:por10'] }),
  ],
  cierre: show('place-value', { n: 3400 }, 'Multiplicar por 10, 100 o 1 000 es añadir ceros a la derecha: cada cifra sube tantas casas como ceros se añaden.'),
})

const mul2x2Partes = clase({
  id: 'c3-mul-2x2-partes',
  topicId: 'mul-2-cifras-intro',
  title: 'Multiplicar por dos cifras, por partes',
  para: [
    show('place-value', { n: 23 }, 'En la frutería hay 23 cajas de naranjas.', 'owl'),
    show('place-value', { n: 14 }, 'Cada caja tiene 14 naranjas. ¿Cuántas son? Calculemos 23 × 14 por partes.', 'owl'),
  ],
  ejemplo: [
    show('split-multiply', { n: 23, m: 4 }, 'Partimos el 14 en 10 y 4, y empezamos por el 4. El 23 son 20 y 3.'),
    show('split-multiply', { n: 23, m: 4 }, '20 × 4 = 80 y 3 × 4 = 12.'),
    show('split-multiply', { n: 23, m: 4 }, '80 + 12 = 92. Esta es la primera parte: 23 × 4 = 92.'),
    show('place-value', { n: 230 }, 'Ahora las decenas: 23 × 10 = 230. Al multiplicar por 10, cada cifra sube una casa.'),
    show('carry', { a: 230, b: 92 }, 'Juntamos las dos partes: 230 + 92 = 322. ¡23 × 14 = 322!'),
  ],
  guiada: [
    tryIt('split-multiply', { n: 23, m: 4 }, '¡Te toca! Parte el número de abajo en decenas y unidades.', { skills: ['mul:2dx2d'] }),
    tryIt('split-multiply', { n: 23, m: 4 }, '¡Otra! Multiplica primero por las unidades de abajo.', { skills: ['mul:2dx2d'] }),
  ],
  sola: [
    tryIt('split-multiply', { n: 23, m: 4 }, '¡Tu turno! Primero por las unidades de abajo.', { skills: ['mul:2dx2d'] }),
    tryIt('split-multiply', { n: 23, m: 4 }, '¡Tu turno! Después por las decenas: pon un cero detrás.', { skills: ['mul:2dx2d'] }),
    tryIt('split-multiply', { n: 23, m: 4 }, '¡Tu turno! Sin pistas: las dos partes y su suma.', { skills: ['mul:2dx2d'] }),
  ],
  cierre: show('carry', { a: 230, b: 92 }, 'Para multiplicar por dos cifras, parto el número de abajo en decenas y unidades, multiplico por cada parte y sumo los dos resultados.'),
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
  mul2x1,
  mul2x1Llevando,
  mul3x1,
  mulPor10,
  mul2x2Partes,
]
