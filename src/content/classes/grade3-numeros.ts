/* Clases de números de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato que las
   de sumar y restar: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una frase
   que resume la regla. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Descomponer: cada cifra vale según su casa. */
const descomponer = clase({
  id: 'c3-descomponer',
  topicId: 'descomponer-9999',
  title: 'Descomponer números',
  para: [
    show('place-value', { n: 4325 }, 'Un número se puede separar en sus casas: millares, centenas, decenas y unidades.', 'frog'),
    show('place-value', { n: 4325 }, 'Vamos a separar el 4 325 para ver cuánto vale cada cifra.', 'ladybug'),
  ],
  ejemplo: [
    show('place-value', { n: 4325 }, 'El 4 está en la casa de los millares: vale 4 000.'),
    show('big-text', { text: '4 325 = 4 000 + 300 + 20 + 5' }, 'El 3 está en las centenas: vale 300. El 2 está en las decenas: vale 20. El 5 vale 5.'),
    show('big-text', { text: '4 325 = 4 000 + 300 + 20 + 5' }, 'Si sumamos todas las partes, sale el número otra vez: 4 325.'),
    show('big-text', { text: '6 071 = 6 000 + 70 + 1' }, 'Ahora el 6 071. ¡Mira las centenas!'),
    show('big-text', { text: '6 071 = 6 000 + 70 + 1' }, 'Como las centenas son 0, esa casa no suma nada y no la escribimos.'),
  ],
  guiada: [
    tryIt('place-value', undefined, '¡Te toca! Empieza por la casa de los millares.', { skills: ['num:place:expanded'] }),
    tryIt('place-value', undefined, '¡Otra! Mira cuántos bloques tiene cada casa.', { skills: ['num:place:blocks'] }),
  ],
  sola: [
    tryIt('place-value', undefined, '¡Tu turno! Cada cifra vale según su casa.', { skills: ['num:place:expanded'] }),
    tryIt('place-value', undefined, '¡Tu turno! Si una casa tiene 0, no la olvides.', { skills: ['num:place:expanded'] }),
    tryIt('place-value', undefined, '¡Tu turno! Sin pistas: cuenta los bloques de cada casa.', { skills: ['num:place:blocks'] }),
  ],
  cierre: show('big-text', { text: '4 325 = 4 000 + 300 + 20 + 5' }, 'La regla: cada cifra vale según su casa. Si una casa tiene 0, no hace falta escribirla.'),
})

/* Leer y escribir: se lee casa a casa, y los ceros no se leen. */
const leerEscribir = clase({
  id: 'c3-leer-escribir',
  topicId: 'leer-escribir-9999',
  title: 'Leer y escribir números',
  para: [
    show('big-text', { text: '2 064', sub: 'dos mil sesenta y cuatro' }, 'Así se escribe el 2 064 con cifras. Y así se lee con palabras.', 'frog'),
    show('place-value', { n: 2064 }, 'Lo leemos casa a casa: 2 millares, 0 centenas, 6 decenas y 4 unidades.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '3 517', sub: 'tres mil quinientos diecisiete' }, 'Lo leemos casa a casa, de mayor a menor: tres mil, quinientos, diecisiete.'),
    show('big-text', { text: '7 300', sub: 'siete mil trescientos' }, 'Los ceros no se leen: el 7 300 es siete mil trescientos.'),
    show('big-text', { text: '1 000', sub: 'mil' }, 'Mil no lleva «un» delante: el 1 000 se lee mil.'),
    show('big-text', { text: '9 999', sub: 'nueve mil novecientos noventa y nueve' }, 'El número más grande de esta etapa es el 9 999.'),
  ],
  guiada: [
    tryIt('big-text', undefined, '¡Te toca! Empieza por los millares.', { skills: ['num:place:words'] }),
    tryIt('big-text', undefined, '¡Otra! Mira los ceros: no se leen.', { skills: ['num:place:words'] }),
  ],
  sola: [
    tryIt('big-text', undefined, '¡Tu turno! Lee casa a casa.', { skills: ['num:place:words'] }),
    tryIt('big-text', undefined, '¡Tu turno! Cuidado con los ceros.', { skills: ['num:place:words'] }),
    tryIt('big-text', undefined, '¡Tu turno! Sin pistas, de mayor a menor.', { skills: ['num:place:words'] }),
  ],
  cierre: show('big-text', { text: '2 064', sub: 'dos mil sesenta y cuatro' }, 'La regla: se lee casa a casa, de mayor a menor. Los ceros no se leen, pero ocupan su casa.'),
})

/* Comparar y ordenar: se mira primero la casa de mayor valor. */
const compararOrdenar = clase({
  id: 'c3-comparar',
  topicId: 'comparar-ordenar-9999',
  title: 'Comparar y ordenar',
  para: [
    show('place-value', { n: 4052 }, 'En el concurso de dibujo, Dani tiene 4 052 puntos y Pepa tiene 3 998. ¿Quién gana?', 'ladybug'),
    show('big-text', { text: '4 052 · 3 998', sub: 'los dos puntajes' }, 'Para saber quién tiene más, comparamos los dos números: miramos primero los millares.', 'frog'),
  ],
  ejemplo: [
    show('big-text', { text: '4 052 > 3 998', sub: 'mayor que' }, 'El signo > significa «mayor que». La boca del signo mira al número más grande.'),
    show('big-text', { text: '4 052 > 3 998' }, 'El 4 de los millares gana al 3. Por eso 4 052 es mayor, sin mirar más cifras.'),
    show('big-text', { text: '2 760 < 2 809', sub: 'menor que' }, 'Los millares son iguales: miramos las centenas. El 7 es menos que el 8.'),
    show('big-text', { text: '5 000 = 5 000', sub: 'son iguales' }, 'Si todas las casas son iguales, los números son iguales: se usa el signo =.'),
    show('big-text', { text: '1 905 < 2 100 < 3 020', sub: 'de menor a mayor' }, 'Para ordenar, empezamos por el más pequeño y terminamos por el más grande.'),
  ],
  guiada: [
    tryIt('big-text', undefined, '¡Te toca! Mira primero los millares.', { skills: ['num:compare'] }),
    tryIt('big-text', undefined, '¡Otra! Si los millares son iguales, mira las centenas.', { skills: ['num:compare'] }),
  ],
  sola: [
    tryIt('big-text', undefined, '¡Tu turno! Mira la casa de mayor valor.', { skills: ['num:compare'] }),
    tryIt('big-text', undefined, '¡Tu turno! Ordena del más pequeño al más grande.', { skills: ['num:order'] }),
    tryIt('big-text', undefined, '¡Tu turno! Sin pistas: si una casa es igual, pasa a la siguiente.', { skills: ['num:compare'] }),
  ],
  cierre: show('big-text', { text: '4 052 > 3 998' }, 'La regla: se mira primero la casa de mayor valor. Si es igual, se pasa a la casa siguiente.'),
})

/* Redondear: la recta muestra la decena o la centena más cercana; la cifra de al lado decide. */
const redondear = clase({
  id: 'c3-redondear',
  topicId: 'redondear',
  title: 'Redondear',
  para: [
    show('big-text', { text: '3 456', sub: 'pegatinas' }, 'Dani ha contado 3 456 pegatinas. Para decirlo rápido, queremos un número redondo.', 'frog'),
    show('number-line', { from: 3400, to: 3500, step: 10, mark: 3456 }, 'En la recta, el 3 456 está entre el 3 450 y el 3 460.', 'ladybug'),
  ],
  ejemplo: [
    show('number-line', { from: 3400, to: 3500, step: 10, mark: 3456 }, 'Redondear es buscar el número redondo más cercano. ¿A qué decena está más cerca el 3 456?'),
    show('number-line', { from: 3400, to: 3500, step: 10, mark: 3456, jump: 4 }, 'Miro la cifra de las unidades: es 6. Como es 5 o más, subo: a las decenas, 3 456 es 3 460.'),
    show('number-line', { from: 3400, to: 3500, step: 100, mark: 3456, jump: 44 }, 'Ahora a las centenas miro la cifra de las decenas: es 5, así que sube. Redondeado, 3 456 es 3 500.'),
  ],
  guiada: [
    tryIt('number-line', undefined, '¡Te toca! Mira la cifra de al lado: 5 o más sube.', { skills: ['num:round:10'] }),
    tryIt('number-line', undefined, '¡Otra! Para las centenas, mira las decenas.', { skills: ['num:round:100'] }),
  ],
  sola: [
    tryIt('number-line', undefined, '¡Tu turno! Redondea a las decenas.', { skills: ['num:round:10'] }),
    tryIt('number-line', undefined, '¡Tu turno! Ahora a las centenas.', { skills: ['num:round:100'] }),
    tryIt('number-line', undefined, '¡Tu turno! Sin pistas: decenas o centenas, según te pidan.', { skills: ['num:round:10', 'num:round:100'] }),
  ],
  cierre: show('number-line', { from: 3400, to: 3500, step: 10, mark: 3456, jump: 4 }, 'La regla: mira la cifra de al lado. Si es 5 o más, sube; si es menos de 5, se queda la misma decena.'),
})

/* Ordinales: el orden de una fila, del primero al trigésimo. */
const ordinales = clase({
  id: 'c3-ordinales',
  topicId: 'ordinales',
  title: 'Ordinales',
  para: [
    show('big-text', { text: 'Tercero', sub: '3.º' }, 'En la carrera de la feria, Dani llega tercero. ¿Qué quiere decir?', 'ladybug'),
    show('big-text', { text: '1.º · 2.º · 3.º · 4.º · 5.º' }, 'Los números que dicen el orden son los ordinales. Se escriben con el número y la letra o pequeña.', 'frog'),
  ],
  ejemplo: [
    show('big-text', { text: '1.º · 2.º · 3.º · 4.º · 5.º', sub: 'primero, segundo, tercero, cuarto, quinto' }, 'Cuenta desde la punta de la fila: el primero es el que está delante.'),
    show('big-text', { text: '4.º', sub: 'cuarto' }, 'El cuarto va después del tercero. Se escribe el número y la o pequeña: 4.º.'),
    show('big-text', { text: '7.º', sub: 'séptimo' }, 'El séptimo es el 7.º. El sexto es el 6.º, así que no se confunden.'),
    show('big-text', { text: '21.º', sub: 'vigésimo primero' }, 'Del veinte en adelante, primero se dice vigésimo y después el número: el 21.º es el vigésimo primero.'),
  ],
  guiada: [
    tryIt('big-text', undefined, '¡Te toca! Cuenta desde la punta de la fila.', { skills: ['num:ordinal:10'] }),
    tryIt('big-text', undefined, '¡Otra! Mira el orden: primero, segundo, tercero…', { skills: ['num:ordinal:10'] }),
  ],
  sola: [
    tryIt('big-text', undefined, '¡Tu turno! Sin pistas: cuenta con el dedo.', { skills: ['num:ordinal:10'] }),
    tryIt('big-text', undefined, '¡Tu turno! Del once al veinte, cuenta con cuidado.', { skills: ['num:ordinal:20'] }),
    tryIt('big-text', undefined, '¡Tu turno! Del veinte en adelante, primero el vigésimo.', { skills: ['num:ordinal:30'] }),
  ],
  cierre: show('big-text', { text: '21.º', sub: 'vigésimo primero' }, 'La regla: el ordinal se escribe con el número y la letra o pequeña, y se lee con su palabra: 3.º, tercero.'),
})

/* Números de cinco cifras (introducción): la casa nueva es la decena de millar. */
const cincoCifras = clase({
  id: 'c3-cinco-cifras',
  topicId: 'numeros-5-cifras',
  title: 'Números de cinco cifras',
  para: [
    show('big-text', { text: '12 345', sub: 'doce mil trescientos cuarenta y cinco' }, 'Ya tenemos más de 9 999: hay números con cinco cifras.', 'owl'),
    show('big-text', { text: '10 000', sub: 'diez mil' }, 'Diez millares hacen diez mil: 10 000 es una decena de millar.', 'owl'),
  ],
  ejemplo: [
    show('big-text', { text: '12 345 = 10 000 + 2 000 + 300 + 40 + 5' }, 'El 1 de 12 345 está en las decenas de millar: vale 10 000.'),
    show('big-text', { text: '12 345 = 10 000 + 2 000 + 300 + 40 + 5' }, 'El 2 está en los millares: vale 2 000. El 3 vale 300, el 4 vale 40 y el 5 vale 5.'),
    show('big-text', { text: '12 345', sub: 'decenas de millar, millares, centenas, decenas, unidades' }, 'Las casas, de mayor a menor. Cada una es diez veces la de su derecha.'),
    show('big-text', { text: '19 999 + 1 = 20 000' }, 'El número que sigue al 19 999 es el 20 000.'),
  ],
  guiada: [
    tryIt('big-text', undefined, '¡Te toca! Mira la casa de las decenas de millar.', { skills: ['num:place:blocks:19999'] }),
    tryIt('big-text', undefined, '¡Otra! Lee el número casa a casa.', { skills: ['num:place:words:19999'] }),
  ],
  sola: [
    tryIt('big-text', undefined, '¡Tu turno! Cuenta las casas, de la mayor a la menor.', { skills: ['num:place:blocks:19999'] }),
    tryIt('big-text', undefined, '¡Tu turno! Si las decenas de millar son iguales, mira los millares.', { skills: ['num:compare:19999'] }),
    tryIt('big-text', undefined, '¡Tu turno! Sin pistas: cuidado con los ceros.', { skills: ['num:place:words:19999'] }),
  ],
  cierre: show('big-text', { text: '12 345 = 10 000 + 2 000 + 300 + 40 + 5' }, 'La regla no cambia: cada cifra vale según su casa. Con cinco cifras aparece una casa más: la decena de millar.'),
})

/* Signo igual: los dos lados valen lo mismo. */
const igualdad = clase({
  id: 'c3-igualdad',
  topicId: 'igualdad',
  title: 'El signo igual',
  para: [
    show('big-text', { text: '5 + 3 = 8', sub: 'Esto es una igualdad' }, 'En la pizarra hay una cuenta con el signo igual. ¿Qué significa?', 'frog'),
    show('big-text', { text: '7 + 2 = 4 + 5' }, 'El signo = quiere decir que los dos lados valen lo mismo, como una balanza en equilibrio.', 'frog'),
  ],
  ejemplo: [
    show('bar-model', { a: 5, b: 3, total: 8 }, 'El 5 y el 3 juntos valen 8, lo mismo que el 8 entero.'),
    show('big-text', { text: '5 + 3 = 8' }, 'Los dos lados valen lo mismo: 5 + 3 vale 8, y el 8 vale 8.'),
    show('big-text', { text: '7 + 2 = 4 + 5' }, 'Los dos lados pueden tener sumas: 7 + 2 es 9, y 4 + 5 también es 9.'),
    show('big-text', { text: '7 + 2 = 4 + 5' }, 'El signo = no significa «ahora viene el resultado»: significa «valen igual».'),
    show('big-text', { text: '8 = 3 + 5' }, 'El lado que va primero no importa: 8 = 3 + 5 también es verdad.'),
  ],
  guiada: [
    tryIt('big-text', undefined, '¡Te toca! Mira los dos lados: ¿qué número falta para que valgan lo mismo?', { skills: ['eq:flex'] }),
    tryIt('big-text', undefined, '¡Otra! Calcula un lado y compara con el otro.', { skills: ['eq:flex'] }),
  ],
  sola: [
    tryIt('big-text', undefined, '¡Tu turno! Los dos lados valen lo mismo.', { skills: ['eq:flex'] }),
    tryIt('big-text', undefined, '¡Tu turno! Puede faltar un número en cualquier lado.', { skills: ['eq:flex'] }),
    tryIt('big-text', undefined, '¡Tu turno! Sin pistas: calcula y compara.', { skills: ['eq:flex'] }),
  ],
  cierre: show('big-text', { text: '7 + 2 = 4 + 5' }, 'La regla: el signo = une dos lados que valen lo mismo, aunque estén escritos de forma distinta.'),
})

/** The maths classes of the number topics (3.º). */
export const NUMEROS_CLASSES: ClassDef[] = [
  descomponer,
  leerEscribir,
  compararOrdenar,
  redondear,
  ordinales,
  cincoCifras,
  igualdad,
]
