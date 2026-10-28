/* Clases de cálculo mental de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato que
   las de números: para qué sirve, un ejemplo resuelto, dos prácticas guiadas, tres sin ayuda y una frase que resume la regla.
   Se calcula con la cabeza, así que las rectas y los saltos muestran el camino, y las pruebas salen del mismo ejemplo. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Dobles y mitades: el doble es sumar dos veces lo mismo; la mitad, repartir en dos partes iguales. */
const doblesMitades = clase({
  id: 'c3-dobles-mitades',
  topicId: 'dobles-mitades',
  title: 'Dobles y mitades',
  para: [
    show('double-chain', { start: 4, steps: 1 }, 'Dani tiene 4 canicas y Pepa tiene las mismas. ¿Cuántas tienen entre las dos?', 'frog'),
    show('big-text', { text: '4 + 4 = 8', sub: 'el doble de 4' }, 'Sumar dos cantidades iguales es doblar. El doble de 4 es 8, y no hace falta contar.', 'frog'),
  ],
  ejemplo: [
    show('big-text', { text: 'El doble de 35', sub: '35 + 35' }, '¿Cuánto es el doble de 35? Lo partimos en decenas y unidades: 30 y 5.'),
    show('big-text', { text: '35 + 35 = 30 + 30 + 5 + 5', sub: '60 + 10 = 70' }, 'El doble de 30 es 60 y el doble de 5 es 10. 60 + 10 = 70. El doble de 35 es 70.'),
    show('big-text', { text: 'La mitad de 70 = 35', sub: '35 + 35 = 70' }, 'La mitad es lo contrario del doble: la mitad de 70 es 35, porque 35 + 35 = 70.'),
  ],
  guiada: [
    tryIt('double-chain', { start: 4, steps: 1 }, '¡Te toca! Piensa en el doble.', { skills: ['mental:dobles'] }),
    tryIt('big-text', { text: 'Mitades' }, '¡Otra! La mitad es repartir en dos partes iguales.', { skills: ['mental:mitades'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Dobles' }, '¡Tu turno! Parte el número en decenas y unidades, y dobla cada parte.', { skills: ['mental:dobles'] }),
    tryIt('big-text', { text: 'Mitades' }, '¡Tu turno! Reparte el número en dos partes iguales.', { skills: ['mental:mitades'] }),
    tryIt('big-text', { text: 'Dobles y mitades' }, '¡Tu turno! Doble o mitad, según te pidan.', { skills: ['mental:dobles', 'mental:mitades'] }),
  ],
  cierre: show('big-text', { text: '35 + 35 = 70', sub: 'el doble de 35' }, 'La regla: el doble es sumar dos veces lo mismo; la mitad es repartir en dos partes iguales.'),
})

/* Doble y triple: el triple es sumar tres veces lo mismo, o doblar y sumar una vez más. */
const dobleTriple = clase({
  id: 'c3-doble-triple',
  topicId: 'doble-triple',
  title: 'Doble y triple',
  para: [
    show('double-chain', { start: 14, steps: 1 }, 'Dani tiene 14 cromos. Hoy queremos saber cuánto es el triple: tres veces 14.', 'ladybug'),
    show('big-text', { text: '14 + 14 + 14 = 42', sub: 'el triple de 14' }, 'El triple es sumar tres veces lo mismo.', 'ladybug'),
  ],
  ejemplo: [
    show('double-chain', { start: 14, steps: 1 }, 'Doblar 14 da 28: 14 + 14 = 28.'),
    show('big-text', { text: '14 + 14 + 14 = 42', sub: '28 + 14 = 42' }, 'Después sumamos un 14 más: 28 + 14 = 42. El triple de 14 es 42.'),
    show('big-text', { text: '10 + 10 + 10 + 4 + 4 + 4', sub: '30 + 12 = 42' }, 'Otra forma: el triple de 10 es 30 y el triple de 4 es 12. 30 + 12 = 42.'),
  ],
  guiada: [
    tryIt('double-chain', { start: 6, steps: 1 }, '¡Te toca! Dobla y suma una vez más.', { skills: ['mental:triples'] }),
    tryIt('big-text', { text: 'Doble y triple' }, '¡Otra! ¿Cuánto es el doble? Suma el número dos veces.', { skills: ['mental:dobles'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Triples' }, '¡Tu turno! Tres veces lo mismo.', { skills: ['mental:triples'] }),
    tryIt('big-text', { text: 'Triples' }, '¡Tu turno! Parte el número en decenas y unidades.', { skills: ['mental:triples'] }),
    tryIt('big-text', { text: 'Doble y triple' }, '¡Tu turno! Doble o triple, según te pidan.', { skills: ['mental:dobles', 'mental:triples'] }),
  ],
  cierre: show('big-text', { text: '14 × 3 = 42', sub: 'el triple de 14' }, 'La regla: el triple es sumar tres veces lo mismo, o doblar y sumar una vez más.'),
})

/* Completar: se cuenta desde el número hasta el número redondo que toca: la decena, el 100 o el 1 000. Las pruebas no nombran
   otro objetivo que el que pide su generador. */
const completar = clase({
  id: 'c3-completar',
  topicId: 'completar',
  title: 'Completar al número redondo',
  para: [
    show('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, 'Dani tiene 7 canicas y quiere tener 10. ¿Cuántas le faltan?', 'frog'),
    show('big-text', { text: '7 + 3 = 10', sub: 'lo que falta para 10' }, 'Completar es contar hasta el número redondo.', 'frog'),
  ],
  ejemplo: [
    show('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, 'Dani tiene 7 y quiere llegar a 10. Contamos desde el 7 hasta el 10.'),
    show('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, 'Del 7 al 10 hay 3 saltos: 7 + 3 = 10. Le faltan 3 canicas.'),
    show('number-line', { from: 60, to: 100, step: 10, mark: 64, jump: 6 }, 'Con 64 vamos a 100. Primero llegamos a la decena siguiente: de 64 a 70 hay 6.'),
    show('number-line', { from: 60, to: 100, step: 10, mark: 70, jump: 30 }, 'Después, de 70 a 100 hay 30. Así que 6 + 30 = 36: a 64 le faltan 36 para llegar a 100.'),
  ],
  guiada: [
    tryIt('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, '¡Te toca! Cuenta hasta el número redondo.', { skills: ['mental:completar10'] }),
    tryIt('number-line', { from: 60, to: 100, step: 10, mark: 64, jump: 36 }, '¡Otra! Para las centenas, ¿cuánto falta para llegar a 100?', { skills: ['mental:completar100'] }),
  ],
  sola: [
    tryIt('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, '¡Tu turno! ¿Cuánto falta para la decena siguiente?', { skills: ['mental:completar10'] }),
    tryIt('number-line', { from: 60, to: 100, step: 10, mark: 64, jump: 36 }, '¡Tu turno! Ahora para llegar a 100.', { skills: ['mental:completar100'] }),
    tryIt('big-text', { text: 'Completar 1 000' }, '¡Tu turno! ¿Cuánto falta para llegar a 1 000?', { skills: ['mental:completar1000'] }),
  ],
  cierre: show('number-line', { from: 60, to: 100, step: 10, mark: 64, jump: 36 }, 'La regla: para completar, cuenta hasta el número redondo: la decena, el 100 o el 1 000.'),
})

/* Decenas y centenas: se cuentan las decenas; si al sumar pasan de 9, la centena sube (380 + 50 = 430). */
const decenasCentenas = clase({
  id: 'c3-decenas-centenas',
  topicId: 'decenas-centenas',
  title: 'Sumar y restar decenas y centenas',
  para: [
    show('big-text', { text: '380 + 50 = 430' }, 'Dani tiene 380 pegatinas y le dan 50 más. ¿Cuántas tiene ahora?', 'frog'),
    show('number-line', { from: 300, to: 500, step: 100, mark: 380, jump: 50 }, 'En la recta, desde el 380 damos un salto de 50 y llegamos al 430.', 'frog'),
  ],
  ejemplo: [
    show('number-line', { from: 300, to: 500, step: 100, mark: 380, jump: 50 }, '¿Qué sé? Tiene 380 y le dan 50. ¿Qué me preguntan? Cuántas tiene en total. Es una suma.'),
    show('big-text', { text: '38 + 5 = 43', sub: '38 decenas + 5 decenas = 43 decenas' }, 'Miramos solo las decenas: 38 decenas más 5 decenas son 43 decenas.'),
    show('big-text', { text: '380 + 50 = 430', sub: '43 decenas = 430' }, 'Las decenas: 8 + 5 pasan de 9, son 13. Escribimos 3 y llevamos 1 a las centenas: 3 + 1 = 4. Sale 430.'),
    show('big-text', { text: '540 − 30 = 510', sub: '54 decenas − 3 decenas = 51 decenas' }, 'Al restar decenas, la cuenta se hace con las decenas: 54 − 3 = 51, y 51 decenas son 510.'),
  ],
  guiada: [
    tryIt('number-line', { from: 300, to: 500, step: 100, mark: 380, jump: 50 }, '¡Te toca! Cambia solo la cifra de las centenas.', { skills: ['mental:centenas'] }),
    tryIt('big-text', { text: '540 − 30' }, '¡Otra! Haz la cuenta con las decenas, y mira si la centena cambia.', { skills: ['mental:decenas'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Decenas' }, '¡Tu turno! Cuenta las decenas. Si pasan de 9 o no alcanzan, la centena cambia.', { skills: ['mental:decenas'] }),
    tryIt('big-text', { text: 'Centenas' }, '¡Tu turno! Cambia solo las centenas.', { skills: ['mental:centenas'] }),
    tryIt('number-line', { from: 0, to: 10000, step: 1000, mark: 3000, jump: 2000 }, '¡Tu turno! Ahora de mil en mil.', { skills: ['num:line:1000'] }),
  ],
  cierre: show('big-text', { text: '380 + 50 = 430', sub: '38 decenas + 5 decenas = 43 decenas' }, 'La regla: se cuentan las decenas. Si al sumar pasan de 9, la centena sube; si al restar no alcanzan, la centena baja.'),
})

/* Compensar: sumar 9 es sumar 10 y quitar 1; restar 9 es restar 10 y sumar 1. Las rectas muestran lo que dice el texto. */
const compensar = clase({
  id: 'c3-compensar',
  topicId: 'compensar',
  title: 'Compensar',
  para: [
    show('big-text', { text: '46 + 9', sub: '¿Hay un truco?' }, 'Dani tiene 46 cromos y le dan 9 más. Sumar 9 cuesta un poco. ¿Hay un truco?', 'owl'),
    show('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 10 }, 'Sumar 10 es muy fácil: de 46 llegamos a 56. Y como 9 es 10 menos 1, el truco funciona.', 'owl'),
  ],
  ejemplo: [
    show('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 10 }, 'Sumar 9 es sumar 10 y quitar 1. Primero sumamos 10 a 46: llegamos a 56.'),
    show('big-text', { text: '46 + 9 = 46 + 10 − 1', sub: '56 − 1 = 55' }, 'Como sumamos 1 de más, lo quitamos al final: 56 − 1 = 55. Así que 46 + 9 = 55.'),
    show('big-text', { text: '55 − 9 = 55 − 10 + 1', sub: '45 + 1 = 46' }, 'Restar 9 es al revés: restamos 10 y sumamos 1. 55 − 10 = 45, y 45 + 1 = 46. Así que 55 − 9 = 46.'),
  ],
  guiada: [
    tryIt('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 10 }, '¡Te toca! Piensa en la decena cercana.', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: 'Compensar' }, '¡Otra! Si es una suma, quita 1 al final. Si es una resta, suma 1 al final.', { skills: ['mental:compensar'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Usa el número redondo cercano y corrige con 1.', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Mira si es suma o resta: cada una tiene su truco.', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Con una resta también, pero al revés.', { skills: ['mental:compensar'] }),
  ],
  cierre: show('big-text', { text: '46 + 9 = 46 + 10 − 1', sub: '55 − 9 = 55 − 10 + 1' }, 'La regla: para sumar 9, suma 10 y quita 1. Para restar 9, resta 10 y suma 1. Con 19, lo mismo con 20.'),
})

/** The mental-calculation classes (3.º): one per topic of the block «Cálculo mental». */
export const MENTAL_CLASSES: ClassDef[] = [
  doblesMitades,
  dobleTriple,
  completar,
  decenasCentenas,
  compensar,
]
