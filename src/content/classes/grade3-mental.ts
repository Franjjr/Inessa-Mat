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
    tryIt('big-text', { text: 'Doble y triple' }, '¡Otra! Primero el doble, y luego suma otra vez el número.', { skills: ['mental:dobles'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Triples' }, '¡Tu turno! Tres veces lo mismo.', { skills: ['mental:triples'] }),
    tryIt('big-text', { text: 'Triples' }, '¡Tu turno! Parte el número en decenas y unidades.', { skills: ['mental:triples'] }),
    tryIt('big-text', { text: 'Doble y triple' }, '¡Tu turno! Doble o triple, según te pidan.', { skills: ['mental:dobles', 'mental:triples'] }),
  ],
  cierre: show('big-text', { text: '14 × 3 = 42', sub: 'el triple de 14' }, 'La regla: el triple es sumar tres veces lo mismo, o doblar y sumar una vez más.'),
})

/* Completar: se cuenta desde el número hasta el número redondo que toca: 10, 100 o 1 000. */
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
    show('number-line', { from: 600, to: 700, step: 10, mark: 640, jump: 60 }, 'Con las centenas, lo mismo: de 640 a 700 faltan 60, porque 640 + 60 = 700.'),
  ],
  guiada: [
    tryIt('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, '¡Te toca! Cuenta hasta el número redondo.', { skills: ['mental:completar10'] }),
    tryIt('number-line', { from: 600, to: 700, step: 10, mark: 640, jump: 60 }, '¡Otra! Para las centenas, cuenta hasta el 700.', { skills: ['mental:completar100'] }),
  ],
  sola: [
    tryIt('number-line', { from: 0, to: 10, step: 1, mark: 7, jump: 3 }, '¡Tu turno! ¿Cuánto falta para el 10?', { skills: ['mental:completar10'] }),
    tryIt('number-line', { from: 600, to: 700, step: 10, mark: 640, jump: 60 }, '¡Tu turno! Ahora para el 700.', { skills: ['mental:completar100'] }),
    tryIt('big-text', { text: 'Completar 1 000' }, '¡Tu turno! ¿Cuánto falta para el 1 000?', { skills: ['mental:completar1000'] }),
  ],
  cierre: show('number-line', { from: 600, to: 700, step: 10, mark: 640, jump: 60 }, 'La regla: para completar, cuenta hasta el número redondo: 10, 100 o 1 000.'),
})

/* Decenas y centenas: al sumar o restar decenas y centenas, solo cambia esa cifra. */
const decenasCentenas = clase({
  id: 'c3-decenas-centenas',
  topicId: 'decenas-centenas',
  title: 'Sumar y restar decenas y centenas',
  para: [
    show('big-text', { text: '340 + 200 = 540' }, 'Dani tiene 340 pegatinas y le dan 200 más. ¿Cuántas tiene ahora?', 'frog'),
    show('number-line', { from: 300, to: 600, step: 100, mark: 340, jump: 200 }, 'En la recta, del 340 saltamos de centena en centena: 440, 540.', 'frog'),
  ],
  ejemplo: [
    show('number-line', { from: 300, to: 600, step: 100, mark: 340, jump: 200 }, '¿Qué sé? Tiene 340 y le dan 200. ¿Qué me preguntan? Cuántas tiene en total. Es una suma.'),
    show('big-text', { text: '340 + 200 = 540', sub: '3 centenas + 2 centenas = 5 centenas' }, 'Las centenas: 3 más 2 son 5 centenas. Las decenas y las unidades no cambian: el 40 se queda.'),
    show('big-text', { text: '540 − 30 = 510', sub: '54 decenas − 3 decenas = 51 decenas' }, 'Restar decenas es lo mismo con las cifras de las decenas: 54 − 3 = 51, así que 510.'),
  ],
  guiada: [
    tryIt('number-line', { from: 300, to: 600, step: 100, mark: 340, jump: 200 }, '¡Te toca! Salta de centena en centena.', { skills: ['mental:centenas'] }),
    tryIt('big-text', { text: '540 − 30' }, '¡Otra! Mira las decenas: ¿cuántas hay?', { skills: ['mental:decenas'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Decenas' }, '¡Tu turno! Cambia solo la cifra de las decenas.', { skills: ['mental:decenas'] }),
    tryIt('big-text', { text: 'Centenas' }, '¡Tu turno! Cambia solo la cifra de las centenas.', { skills: ['mental:centenas'] }),
    tryIt('number-line', { from: 0, to: 1000, step: 100, mark: 350, jump: 500 }, '¡Tu turno! Ahora en la recta de los miles.', { skills: ['num:line:1000'] }),
  ],
  cierre: show('big-text', { text: '340 + 200 = 540', sub: 'solo cambia la cifra de las centenas' }, 'La regla: al sumar o restar decenas y centenas, solo cambia esa cifra; las demás se quedan igual.'),
})

/* Compensar: para sumar 9, se suma 10 y se quita 1. */
const compensar = clase({
  id: 'c3-compensar',
  topicId: 'compensar',
  title: 'Compensar',
  para: [
    show('big-text', { text: '46 + 9', sub: '¿Hay un truco?' }, 'Dani tiene 46 cromos y le dan 9 más. Sumar 9 cuesta un poco. ¿Hay un truco?', 'owl'),
    show('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 9 }, 'Sumar 10 es muy fácil. Y como 9 es 10 menos 1, el truco funciona.', 'owl'),
  ],
  ejemplo: [
    show('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 9 }, 'Sumar 9 es sumar 10 y quitar 1. Primero sumamos 10 a 46: 56.'),
    show('big-text', { text: '46 + 9 = 46 + 10 − 1', sub: '56 − 1 = 55' }, 'Como sumamos un 1 de más, lo quitamos al final: 56 − 1 = 55. Así que 46 + 9 = 55.'),
    show('big-text', { text: '38 + 9 = 47', sub: '38 + 10 − 1 = 47' }, 'El mismo truco sirve para otros números: 38 + 10 = 48, y 48 − 1 = 47.'),
  ],
  guiada: [
    tryIt('number-line', { from: 40, to: 60, step: 10, mark: 46, jump: 9 }, '¡Te toca! ¿Cuánto llegas si sumas 10 de más?', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: '+ 10 − 1', sub: 'compensar' }, '¡Otra! Suma la decena y quita lo que te pasaste.', { skills: ['mental:compensar'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Suma 10 y quita 1.', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Ahora con otro número que acabe en 9.', { skills: ['mental:compensar'] }),
    tryIt('big-text', { text: 'Compensar' }, '¡Tu turno! Piensa en el 10 más cercano y ajusta.', { skills: ['mental:compensar'] }),
  ],
  cierre: show('big-text', { text: '46 + 9 = 46 + 10 − 1', sub: 'de 46 a 56 y menos 1' }, 'La regla: para sumar 9, suma 10 y quita 1. Para sumar 19, suma 20 y quita 1.'),
})

/** The mental-calculation classes (3.º): one per topic of the block «Cálculo mental». */
export const MENTAL_CLASSES: ClassDef[] = [
  doblesMitades,
  dobleTriple,
  completar,
  decenasCentenas,
  compensar,
]
