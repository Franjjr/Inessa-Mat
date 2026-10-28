/* Clases de medida de 3.º de Primaria: una por tema del bloque «medida» del temario (src/content/syllabus/grade3.ts). Mismo
   formato que las demás: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una frase
   que resume la regla. Las prácticas usan solo habilidades de su propio tema, y su texto sirve para todas las variantes del
   generador (src/engine/measure.ts): cualquier unidad de su tipo, los medios y los cuartos, y las dos direcciones de cada
   conversión. Las prácticas de la regla llevan una tarjeta de texto y no un dibujo: el ejercicio ya pinta su propia regla. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Longitud: el metro tiene 100 centímetros y el kilómetro, 1 000 metros. Para la unidad pequeña se multiplica; para la grande, se divide. */
const unidadesLongitud = clase({
  id: 'c3-medida-unidades-longitud',
  topicId: 'unidades-longitud',
  title: 'Longitud: cm, m y km',
  para: [
    show('units', { kind: 'length' }, 'Para medir la longitud usamos centímetros, metros y kilómetros. Un centímetro es pequeño: cabe en una uña.', 'frog'),
    show('big-text', { text: 'Un kilómetro es una distancia grande: de tu casa al colegio, por ejemplo.' }, 'Para distancias largas usamos kilómetros. Para cosas de la clase, metros o centímetros.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '1 m = 100 cm' }, 'Un metro tiene 100 centímetros. Si tienes 3 metros, son 3 × 100 = 300 centímetros.'),
    show('big-text', { text: '1 km = 1 000 m' }, 'Un kilómetro tiene 1 000 metros. Si tienes 5 kilómetros, son 5 × 1 000 = 5 000 metros.'),
    show('big-text', { text: '400 cm = 4 m' }, 'Al revés: 400 centímetros son 4 metros, porque 100 centímetros hacen un metro: 400 ÷ 100 = 4.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'cm · m · km' }, '¡Te toca! Piensa en el tamaño real de lo que mides, no en el número. Imagínalo antes de elegir.', { skills: ['measure:unit:length'] }),
    tryIt('big-text', { text: 'cm · m · km' }, '¡Otra! Mira si te piden la cantidad en la unidad grande o en la pequeña. Ya sabes cuántas unidades pequeñas caben en una grande.', { skills: ['measure:convert:length'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'cm · m · km' }, '¡Tu turno! Elige la unidad que usarías: piensa en el tamaño real de lo que mides, no en el número.', { skills: ['measure:unit:length'] }),
    tryIt('big-text', { text: 'a la unidad grande · a la unidad pequeña' }, '¡Tu turno! Mira si la unidad que te piden es más grande o más pequeña que la que te dan, y pasa la cantidad.', { skills: ['measure:convert:length'] }),
    tryIt('big-text', { text: 'medio · un cuarto' }, '¡Tu turno! Si te dan medio metro o un cuarto de kilómetro, mira en cuántas partes iguales se divide la unidad grande.', { skills: ['measure:convert:length'] }),
    tryIt('big-text', { text: 'la unidad que te piden' }, '¡Tu turno! Lee bien qué unidad te piden y pasa la cantidad a esa unidad.', { skills: ['measure:convert:length'] }),
  ],
  cierre: show('big-text', { text: '1 m = 100 cm', sub: '1 km = 1 000 m' }, 'La regla: un metro tiene 100 centímetros y un kilómetro, 1 000 metros. Para pasar a la unidad pequeña se multiplica; para la grande, se divide.'),
})

/* Regla: se pone el 0 de la regla en el principio del objeto. Si el objeto empieza en el 0, su medida es el número donde acaba. */
const regla = clase({
  id: 'c3-medida-regla',
  topicId: 'regla',
  title: 'Medir con la regla',
  para: [
    show('ruler', { cm: 8, object: '✏️' }, 'La regla tiene marcas de centímetro en centímetro. Este lápiz empieza en el 0 y acaba en el 8: mide 8 centímetros.', 'frog'),
    show('ruler', { cm: 4, object: '🧽' }, 'Una goma empieza en el 0 y acaba en el 4: mide 4 centímetros.', 'ladybug'),
  ],
  ejemplo: [
    show('ruler', { cm: 3, object: '📎' }, 'Un clip mide unos 3 centímetros. Como empieza en el 0, basta con mirar dónde acaba.'),
    show('ruler', { cm: 9, object: '🖍️' }, 'Este lápiz de colores acaba en el 9: mide 9 centímetros.'),
    show('ruler', { cm: 7, from: 2, object: '🖍️' }, 'Este lápiz empieza en el 2 y acaba en el 7. No empieza en el 0: para saber cuánto mide, resta 7 − 2 = 5. Mide 5 centímetros.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'dónde empieza · dónde acaba' }, '¡Te toca! Mira dónde empieza y dónde acaba el objeto. Si empieza en el 0, basta con leer el número donde acaba.', { skills: ['measure:ruler'] }),
    tryIt('big-text', { text: 'acaba − empieza' }, '¡Otra! Mira dónde empieza y dónde acaba: si el objeto no empieza en el 0, al número donde acaba le quitas el número donde empieza.', { skills: ['measure:ruler'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'empieza · acaba' }, '¡Tu turno! Mira dónde empieza y dónde acaba el objeto, y cuenta cuántos centímetros mide.', { skills: ['measure:ruler'] }),
    tryIt('big-text', { text: 'dónde empieza · dónde acaba' }, '¡Tu turno! Mira dónde empieza y dónde acaba el objeto: no siempre empieza en el 0.', { skills: ['measure:ruler'] }),
    tryIt('big-text', { text: 'acaba − empieza' }, '¡Tu turno! Mira dónde empieza y dónde acaba: quita el número donde empieza al número donde acaba, y eso son los centímetros.', { skills: ['measure:ruler'] }),
    tryIt('big-text', { text: 'mide con la regla' }, '¡Tu turno! Mira dónde empieza y dónde acaba el objeto, y mide con calma.', { skills: ['measure:ruler'] }),
  ],
  cierre: show('ruler', { cm: 6, object: '✏️' }, 'La regla: mira dónde empieza y dónde acaba el objeto. Si empieza en el 0, ese número es la medida; si no, resta el número donde empieza.'),
})

/* Masa y capacidad: el kilo tiene 1 000 gramos y el litro, 1 000 mililitros. Se usan las mismas dos reglas que en la longitud. */
const unidadesMasaCapacidad = clase({
  id: 'c3-medida-unidades-masa-capacidad',
  topicId: 'unidades-masa-capacidad',
  title: 'Masa y capacidad: g, kg, ml y l',
  para: [
    show('units', { kind: 'mass' }, 'Para pesar cosas ligeras usamos gramos. Para cosas más pesadas, como un paquete de harina, usamos kilos.', 'frog'),
    show('units', { kind: 'capacity' }, 'Para cantidades pequeñas de líquido usamos mililitros. Para botellas y cubos, litros.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '1 kg = 1 000 g' }, 'Un kilo tiene 1 000 gramos. Medio kilo son 500 gramos.'),
    show('big-text', { text: '1 l = 1 000 ml' }, 'Un litro tiene 1 000 mililitros. Un vaso de agua tiene unos 200 mililitros: menos de un litro.'),
    show('big-text', { text: '2 000 ml = 2 l' }, 'Al revés: 2 000 mililitros son 2 litros, porque 1 000 mililitros hacen un litro: 2 000 ÷ 1 000 = 2.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'g · kg' }, '¡Te toca! Piensa en el peso real de lo que te preguntan, no en el número.', { skills: ['measure:unit:mass'] }),
    tryIt('big-text', { text: 'g · kg' }, '¡Otra! Mira si te piden la cantidad en la unidad grande o en la pequeña, y cuántas pequeñas caben en una grande.', { skills: ['measure:convert:mass'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'ml · l' }, '¡Tu turno! Piensa en cuánto líquido cabe en el recipiente real, no en el número que ves.', { skills: ['measure:unit:capacity'] }),
    tryIt('big-text', { text: 'medio · un cuarto' }, '¡Tu turno! Si te dan medio litro o un cuarto de kilo, mira en cuántas partes iguales se divide la unidad grande.', { skills: ['measure:convert:mass', 'measure:convert:capacity'] }),
    tryIt('big-text', { text: 'g · kg · ml · l' }, '¡Tu turno! Mira si la cantidad que te dan es de la unidad grande o de la pequeña, y pásala.', { skills: ['measure:convert:mass', 'measure:convert:capacity'] }),
    tryIt('big-text', { text: 'se pesa o se llena' }, '¡Tu turno! Mira si lo que te preguntan se pesa o se llena: el peso va en g o kg; la capacidad, en ml o l.', { skills: ['measure:unit:mass', 'measure:unit:capacity'] }),
  ],
  cierre: show('big-text', { text: '1 kg = 1 000 g', sub: '1 l = 1 000 ml' }, 'La regla: un kilo tiene 1 000 gramos y un litro, 1 000 mililitros. Para la unidad pequeña se multiplica por mil; para la grande, se divide entre mil.'),
})

/* Sumar y estimar: para sumar, las dos medidas van primero en la misma unidad; para estimar, se compara con el tamaño real. */
const medirProblemas = clase({
  id: 'c3-medida-medir-problemas',
  topicId: 'medir-problemas',
  title: 'Sumar medidas y estimar',
  para: [
    show('big-text', { text: 'Las dos medidas, en la misma unidad' }, 'Para sumar dos medidas, primero tienen que estar en la misma unidad.', 'frog'),
    show('big-text', { text: '¿Es razonable?' }, 'Para saber si una medida es razonable, piensa en el tamaño real de lo que se mide.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '2 kg = 2 000 g' }, 'Una caja pesa 2 kilos y un libro pesa 300 gramos. Pasa los kilos a gramos: 2 kg = 2 000 g.'),
    show('big-text', { text: '2 000 g + 300 g = 2 300 g' }, 'Ahora suma: 2 000 + 300 = 2 300. Los dos juntos pesan 2 300 gramos.'),
    show('big-text', { text: 'Un lápiz mide 15 cm: sí es razonable' }, 'Un lápiz mide unos 15 centímetros. Decir que mide 15 metros no es razonable: sería más alto que un edificio de cinco pisos.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'la misma unidad · sumar' }, '¡Te toca! Antes de sumar, pon las dos medidas en la misma unidad: la unidad pequeña.', { skills: ['measure:add'] }),
    tryIt('big-text', { text: 'sí · no' }, '¡Otra! Piensa en el tamaño real de lo que se mide y compara con el número que dice la frase.', { skills: ['measure:estimate'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'la misma unidad · sumar' }, '¡Tu turno! Pasa la medida grande a la unidad pequeña y después suma.', { skills: ['measure:add'] }),
    tryIt('big-text', { text: 'sí · no' }, '¡Tu turno! ¿Se parece el número al tamaño real de lo que se mide? Si no se parece, no es razonable.', { skills: ['measure:estimate'] }),
    tryIt('big-text', { text: 'la historia' }, '¡Tu turno! Lee la historia con calma: qué dos medidas hay y en qué unidad piden el total.', { skills: ['measure:add'] }),
    tryIt('big-text', { text: 'total · razonable' }, '¡Tu turno! Mira qué te piden: el total de dos medidas, o si una medida es razonable.', { skills: ['measure:add', 'measure:estimate'] }),
  ],
  cierre: show('big-text', { text: 'Misma unidad, y después sumar', sub: 'Compara con el tamaño real' }, 'La regla: para sumar medidas, ponlas primero en la misma unidad. Si un número no se parece al tamaño real, no es razonable.'),
})

/** The measure classes (3.º): one per measure topic of the temario. */
export const MEDIDA_CLASSES: ClassDef[] = [unidadesLongitud, regla, unidadesMasaCapacidad, medirProblemas]
