/* Clases de problemas y comprobar de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato
   que las de números: para qué sirve, un ejemplo resuelto, dos prácticas guiadas, tres sin ayuda y una frase que resume la
   regla. Los cinco problemas enseñan las mismas tres preguntas: ¿qué sé?, ¿qué me preguntan? y ¿qué operación?. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Problemas de juntar: se suman las dos partes para saber el total. */
const probSumar = clase({
  id: 'c3-prob-sumar',
  topicId: 'prob-sumar',
  title: 'Problemas de juntar',
  para: [
    show('bar-model', { a: 14, b: 9, total: 23 }, 'Dani tiene 14 canicas y Pepa le da 9 más. ¿Cuántas tiene Dani ahora?', 'frog'),
    show('big-text', { text: '¿Qué sé? ¿Qué me preguntan? ¿Qué operación?' }, 'Antes de calcular, hacemos tres preguntas: qué sé, qué me preguntan y qué operación.', 'ladybug'),
  ],
  ejemplo: [
    show('bar-model', { a: 14, b: 9, total: 23 }, '¿Qué sé? Dani tiene 14 canicas y le dan 9. ¿Qué me preguntan? Cuántas tiene al final.'),
    show('big-text', { text: '14 + 9 = 23', sub: 'juntar es sumar' }, '¿Qué operación? Juntar dos cantidades es sumarlas: 14 + 9.'),
    show('big-text', { text: '14 + 9 = 23', sub: 'Dani tiene 23 canicas' }, 'Solución: 14 + 9 = 23. Dani tiene 23 canicas.'),
  ],
  guiada: [
    tryIt('bar-model', { a: 14, b: 9, total: 23 }, '¡Te toca! Mira qué sabes y qué te preguntan.', { skills: ['bar:add'] }),
    tryIt('bar-model', { a: 14, b: 9, total: 23 }, '¡Otra! Pregúntate qué operación pide la historia.', { skills: ['word:add'] }),
  ],
  sola: [
    tryIt('bar-model', { a: 14, b: 9, total: 23 }, '¡Tu turno! Las dos partes juntas dan el total.', { skills: ['bar:add'] }),
    tryIt('bar-model', { a: 14, b: 9, total: 23 }, '¡Tu turno! Lee la historia y decide la operación.', { skills: ['word:add'] }),
    tryIt('bar-model', { a: 14, b: 9, total: 23 }, '¡Tu turno! Qué sabes, qué te preguntan y qué operación.', { skills: ['bar:add', 'word:add'] }),
  ],
  cierre: show('big-text', { text: '14 + 9 = 23', sub: 'juntar es sumar' }, 'La regla: antes de calcular, mira qué sabes, qué te preguntan y qué operación pide la historia.'),
})

/* Problemas de quitar y comparar: se resta la parte que se va. */
const probRestar = clase({
  id: 'c3-prob-restar',
  topicId: 'prob-restar',
  title: 'Problemas de quitar',
  para: [
    show('bar-model', { a: 9, b: 4, total: 13 }, 'Dani tenía 13 cromos y regala 4 a su hermano. ¿Cuántos le quedan?', 'frog'),
    show('big-text', { text: '¿Qué sé? ¿Qué me preguntan? ¿Qué operación?' }, 'Las mismas tres preguntas de siempre: qué sé, qué me preguntan y qué operación.', 'ladybug'),
  ],
  ejemplo: [
    show('bar-model', { a: 9, b: 4, total: 13 }, '¿Qué sé? Dani tenía 13 cromos y regala 4. ¿Qué me preguntan? Cuántos le quedan.'),
    show('bar-model', { a: 9, b: 4, total: 13 }, '¿Qué operación? Quitar: de la barra entera se separa la parte que se va. Es una resta.'),
    show('bar-model', { a: 9, b: 4, total: 13 }, 'Comparar también es quitar. Pepa tiene 13 cromos y Dani tiene 4. ¿Cuántos más tiene Pepa? Quitamos los de Dani a los de Pepa: 13 − 4 = 9. Pepa tiene 9 más.'),
    show('big-text', { text: '13 − 4 = 9', sub: 'le quedan 9 cromos' }, 'Solución: 13 − 4 = 9. A Dani le quedan 9 cromos.'),
  ],
  guiada: [
    tryIt('bar-model', { a: 9, b: 4, total: 13 }, '¡Te toca! ¿Qué parte se quita de la barra?', { skills: ['bar:sub'] }),
    tryIt('bar-model', { a: 9, b: 4, total: 13 }, '¡Otra! Mira qué te preguntan: lo que queda.', { skills: ['word:sub'] }),
  ],
  sola: [
    tryIt('bar-model', { a: 9, b: 4, total: 13 }, '¡Tu turno! Una parte se quita del total.', { skills: ['bar:sub'] }),
    tryIt('bar-model', { a: 9, b: 4, total: 13 }, '¡Tu turno! Lee la historia y decide la operación.', { skills: ['word:sub'] }),
    tryIt('bar-model', { a: 9, b: 4, total: 13 }, '¡Tu turno! Qué sabes, qué te preguntan y qué operación.', { skills: ['bar:sub', 'word:sub'] }),
  ],
  cierre: show('big-text', { text: '13 − 4 = 9', sub: 'quitar es restar' }, 'La regla: si la historia quita una parte del total, o compara dos cantidades para ver cuántos más hay, la operación es una resta.'),
})

/* Problemas de grupos: se multiplica el número de grupos por lo que hay en cada grupo. */
const probMultiplicar = clase({
  id: 'c3-prob-multiplicar',
  topicId: 'prob-multiplicar',
  title: 'Problemas de grupos',
  para: [
    show('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, 'Pili pone 4 bandejas con 3 galletas en cada una. ¿Cuántas galletas hay?', 'frog'),
    show('big-text', { text: '¿Qué sé? ¿Qué me preguntan? ¿Qué operación?' }, 'Para no equivocarnos: qué sé, qué me preguntan y qué operación.', 'ladybug'),
  ],
  ejemplo: [
    show('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¿Qué sé? 4 bandejas, y 3 galletas en cada una. ¿Qué me preguntan? Cuántas galletas hay en total.'),
    show('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¿Qué operación? Son grupos iguales: se multiplica el número de grupos por lo que hay en cada uno.'),
    show('big-text', { text: '4 × 3 = 12', sub: '3 + 3 + 3 + 3 = 12' }, 'Solución: 4 × 3 = 12. Hay 12 galletas en total.'),
  ],
  guiada: [
    tryIt('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¡Te toca! ¿Cuántos grupos hay y cuántos en cada uno?', { skills: ['bar:mul'] }),
    tryIt('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¡Otra! Pregúntate qué operación pide la historia.', { skills: ['word:mul'] }),
  ],
  sola: [
    tryIt('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¡Tu turno! Cuenta los grupos iguales.', { skills: ['bar:mul'] }),
    tryIt('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¡Tu turno! Lee la historia y decide la operación.', { skills: ['word:mul'] }),
    tryIt('groups', { groups: 4, perGroup: 3, emoji: '🍪' }, '¡Tu turno! Qué sabes, qué te preguntan y qué operación.', { skills: ['bar:mul', 'word:mul'] }),
  ],
  cierre: show('big-text', { text: '4 × 3 = 12', sub: 'grupos por cantidad en cada grupo' }, 'La regla: grupos iguales se resuelven con una multiplicación.'),
})

/* Problemas de repartir: se divide el total entre el número de partes iguales. */
const probDividir = clase({
  id: 'c3-prob-dividir',
  topicId: 'prob-dividir',
  title: 'Problemas de repartir',
  para: [
    show('share', { total: 12, groups: 3, emoji: '🍬' }, 'Hay 12 caramelos para 3 amigos, y los reparten en partes iguales. ¿Cuántos le tocan a cada uno?', 'octopus'),
    show('big-text', { text: '¿Qué sé? ¿Qué me preguntan? ¿Qué operación?' }, 'Otra vez las tres preguntas: qué sé, qué me preguntan y qué operación.', 'ladybug'),
  ],
  ejemplo: [
    show('share', { total: 12, groups: 3, emoji: '🍬' }, '¿Qué sé? 12 caramelos y 3 amigos. ¿Qué me preguntan? Cuántos le tocan a cada amigo.'),
    show('share', { total: 12, groups: 3, emoji: '🍬' }, '¿Qué operación? Repartir en partes iguales es dividir: 12 entre 3.'),
    show('big-text', { text: '12 ÷ 3 = 4', sub: 'a cada amigo le tocan 4' }, 'Solución: 12 ÷ 3 = 4. A cada amigo le tocan 4 caramelos.'),
  ],
  guiada: [
    tryIt('share', { total: 12, groups: 3, emoji: '🍬' }, '¡Te toca! ¿Cuántas partes iguales hay?', { skills: ['bar:div'] }),
    tryIt('share', { total: 12, groups: 3, emoji: '🍬' }, '¡Otra! Mira qué te preguntan: lo que le toca a cada uno.', { skills: ['word:div'] }),
  ],
  sola: [
    tryIt('share', { total: 12, groups: 3, emoji: '🍬' }, '¡Tu turno! El total se reparte en partes iguales.', { skills: ['bar:div'] }),
    tryIt('share', { total: 12, groups: 3, emoji: '🍬' }, '¡Tu turno! Lee la historia y decide la operación.', { skills: ['word:div'] }),
    tryIt('share', { total: 12, groups: 3, emoji: '🍬' }, '¡Tu turno! Qué sabes, qué te preguntan y qué operación.', { skills: ['bar:div', 'word:div'] }),
  ],
  cierre: show('big-text', { text: '12 ÷ 3 = 4', sub: 'repartir es dividir' }, 'La regla: si el total se reparte en partes iguales, la operación es una división.'),
})

/* Problemas de dos pasos: primero una cuenta, y con su resultado, la siguiente. */
const probDosPasos = clase({
  id: 'c3-prob-dos-pasos',
  topicId: 'prob-dos-pasos',
  title: 'Problemas de dos pasos',
  para: [
    show('big-text', { text: '12 pegatinas', sub: 'le dan 8 más y luego regala 5' }, 'Lucía tiene 12 pegatinas. Le dan 8 más y después regala 5. ¿Cuántas le quedan?', 'ladybug'),
    show('big-text', { text: '¿Qué sé? ¿Qué me preguntan? ¿Qué operación?' }, 'Hay dos cuentas seguidas: primero una, y después otra con su resultado.', 'frog'),
  ],
  ejemplo: [
    show('big-text', { text: '12, 8 y 5', sub: 'tiene, recibe y regala' }, '¿Qué sé? Tres números: tiene 12, le dan 8 y regala 5. ¿Qué me preguntan? Cuántas le quedan.'),
    show('bar-model', { a: 12, b: 8, total: 20 }, 'Paso 1: primero juntamos lo que tiene con lo que le dan. 12 + 8 = 20. Ahora tiene 20.'),
    show('bar-model', { a: 15, b: 5, total: 20 }, 'Paso 2: luego quitamos lo que regala. 20 − 5 = 15. Le quedan 15 pegatinas.'),
  ],
  guiada: [
    tryIt('bar-model', { a: 12, b: 8, total: 20 }, '¡Te toca! Haz primero la cuenta del principio de la historia.', { skills: ['bar:two'] }),
    tryIt('bar-model', { a: 15, b: 5, total: 20 }, '¡Otra! Usa el resultado de la primera cuenta para la segunda.', { skills: ['bar:two'] }),
  ],
  sola: [
    tryIt('bar-model', { a: 12, b: 8, total: 20 }, '¡Tu turno! Una cuenta, y después otra con su resultado.', { skills: ['bar:two'] }),
    tryIt('bar-model', { a: 15, b: 5, total: 20 }, '¡Tu turno! Escribe las dos operaciones en orden.', { skills: ['bar:two'] }),
    tryIt('bar-model', { a: 12, b: 8, total: 20 }, '¡Tu turno! Qué sabes, qué te preguntan y qué operaciones.', { skills: ['bar:two'] }),
  ],
  cierre: show('big-text', { text: '12 + 8 = 20 · 20 − 5 = 15', sub: 'dos cuentas seguidas' }, 'La regla: en un problema de dos pasos, la segunda cuenta usa el resultado de la primera.'),
})

/* Encuentra el error: se revisa la cuenta columna a columna y se ve dónde falla. */
const encuentraError = clase({
  id: 'c3-encuentra-error',
  topicId: 'encuentra-error',
  title: 'Encuentra el error',
  para: [
    show('big-text', { text: '47 + 35 = 72' }, 'Dani ha hecho esta suma: 47 + 35 = 72. ¿Está bien? Para saberlo, la revisamos.', 'ladybug'),
    show('carry', { a: 47, b: 35 }, 'Revisar es volver a mirar la cuenta, columna a columna, con calma.', 'ladybug'),
  ],
  ejemplo: [
    show('carry', { a: 47, b: 35 }, 'Columna de las unidades: 7 + 5 = 12. Escribo el 2 y llevo 1 a las decenas.'),
    show('carry', { a: 47, b: 35 }, 'Columna de las decenas: 4 + 3 = 7, y el 1 que llevábamos: 8. Escribo el 8.'),
    show('big-text', { text: '47 + 35 = 82', sub: 'Dani olvidó el 1 que llevaba' }, 'El resultado es 82, no 72. El error está en las decenas: se olvidó de sumar el 1 que llevaba.'),
  ],
  guiada: [
    tryIt('big-text', { text: '¿Está bien la cuenta?' }, '¡Te toca! Revisa primero la columna de las unidades.', { skills: ['hunt:add'] }),
    tryIt('big-text', { text: '¿Está bien la cuenta?' }, '¡Otra! Si una columna no cuadra, ahí está el error.', { skills: ['hunt:sub'] }),
  ],
  sola: [
    tryIt('big-text', { text: '¿Está bien la cuenta?' }, '¡Tu turno! Mira cada columna y decide si la cuenta es correcta.', { skills: ['hunt:add'] }),
    tryIt('big-text', { text: '¿Está bien la cuenta?' }, '¡Tu turno! Si está mal, dime en qué columna falla.', { skills: ['hunt:sub'] }),
    tryIt('big-text', { text: '¿Está bien la cuenta?' }, '¡Tu turno! Revisa una multiplicación columna a columna.', { skills: ['hunt:mul'] }),
  ],
  cierre: show('big-text', { text: '47 + 35 = 82', sub: 'revisar columna a columna' }, 'La regla: si una cuenta sale mal, el error está en una columna. Revísala columna a columna.'),
})

/* Comprobar: la operación contraria dice si el resultado está bien. */
const comprobarResultado = clase({
  id: 'c3-comprobar',
  topicId: 'comprobar-resultado',
  title: 'Comprobar el resultado',
  para: [
    show('big-text', { text: '352 − 127 = 225' }, 'Dani ha restado 352 − 127 y ha puesto 225. ¿Cómo lo comprobamos?', 'owl'),
    show('sub-check', { a: 352, b: 127 }, 'Comprobar es hacer la operación contraria, y ver si da el número de partida.', 'owl'),
  ],
  ejemplo: [
    show('sub-check', { a: 352, b: 127 }, 'La resta: 352 − 127 = 225. La prueba: 225 + 127 tiene que dar 352.'),
    show('sub-check', { a: 352, b: 127 }, 'Comprobamos: 225 + 127 = 352. ¡Da 352! La resta está bien.'),
    show('division-check', { dividend: 17, divisor: 5 }, 'En una división la prueba es: cociente × divisor + resto = dividendo. 17 ÷ 5 = 3 y sobran 2: 3 × 5 + 2 = 17.'),
  ],
  guiada: [
    tryIt('sub-check', { a: 352, b: 127 }, '¡Te toca! Suma el resultado con el número de abajo.', { skills: ['check:sub'] }),
    tryIt('division-check', { dividend: 17, divisor: 5 }, '¡Otra! Multiplica el cociente por el divisor y suma lo que sobra.', { skills: ['check:div'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'Comprobar' }, '¡Tu turno! Para comprobar una suma, ¿qué operación haces?', { skills: ['check:add'] }),
    tryIt('sub-check', { a: 352, b: 127 }, '¡Tu turno! Comprueba la resta con una suma.', { skills: ['check:sub'] }),
    tryIt('division-check', { dividend: 17, divisor: 5 }, '¡Tu turno! Comprueba la división con la prueba.', { skills: ['check:div'] }),
  ],
  cierre: show('sub-check', { a: 352, b: 127 }, 'La regla: para comprobar, haz la operación contraria. Si da el número de partida, el resultado está bien.'),
})

/** The problem and checking classes (3.º): one per topic of the blocks «Problemas» and «Comprobar». */
export const PROBLEMAS_CLASSES: ClassDef[] = [
  probSumar,
  probRestar,
  probMultiplicar,
  probDividir,
  probDosPasos,
  encuentraError,
  comprobarResultado,
]
