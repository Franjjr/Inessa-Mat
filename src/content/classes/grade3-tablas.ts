/* Clases de las tablas de 3.º de Primaria: una por tabla del temario (src/content/syllabus/grade3.ts). Mismo formato que
   las de números: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres sin pistas y una frase que resume
   la regla. Las tablas 6, 7, 8 y 9 reutilizan como ejemplo su lección del mapa; las de 2, 5 y 10 usan los pasos de la
   lección de las tablas fáciles. Las prácticas guiadas salen de la mitad fácil de la tabla (factor 1 a 5) y las solas de
   la mitad difícil (factor 6 a 10). */
import { show, tryIt } from '@/content/lessons/dsl'
import { w1Easy } from '@/content/lessons/w1'
import { w3Five } from '@/content/lessons/w3'
import { w5Pattern } from '@/content/lessons/w5'
import { w6Nine, w6Seven } from '@/content/lessons/w6'
import { mulSkill } from '@/engine/skills'
import type { SkillSelector } from '@/types'
import { clase, type ClassDef } from './dsl'

/** Las multiplicaciones de la tabla `t` con el factor de `from` a `to`. */
const facts = (t: number, from: number, to: number): SkillSelector => {
  const skills = []
  for (let n = from; n <= to; n++) skills.push(mulSkill(t, n))
  return { kinds: ['fact-mul'], skills }
}

/** La tabla del 2: el doble, y contar de 2 en 2. */
const tabla2 = clase({
  id: 'c3-tabla-2',
  topicId: 'tabla-2',
  title: 'La tabla del 2',
  para: [
    show('groups', { groups: 4, perGroup: 2, emoji: '🍪' }, 'Dani pone las galletas en bandejas de 2 en 2. Hoy aprendemos la tabla del 2.', 'frog'),
  ],
  ejemplo: [
    w1Easy.steps[2],
    show('double-chain', { start: 4, steps: 1 }, 'Multiplicar por 2 es doblar: el doble de 4 es 8. Así que 2 × 4 = 8.'),
    show('big-text', { text: '2 · 4 · 6 · 8 · 10', sub: 'de 2 en 2' }, 'Si cuentas de 2 en 2, sales en la tabla del 2: 2, 4, 6, 8, 10…'),
  ],
  guiada: [
    tryIt('easy-tables', undefined, '¡Te toca! Piensa en el doble.', facts(2, 1, 5)),
    tryIt('easy-tables', undefined, '¡Otra! Cuenta de 2 en 2 si te ayuda.', facts(2, 1, 5)),
  ],
  sola: [
    tryIt('easy-tables', undefined, '¡Tu turno! Ahora con números más grandes: el doble.', facts(2, 6, 8)),
    tryIt('easy-tables', undefined, '¡Tu turno! Cuenta de 2 en 2 hasta el final.', facts(2, 6, 10)),
    tryIt('easy-tables', undefined, '¡Tu turno! Sin pistas: el doble, o de 2 en 2.', facts(2, 8, 10)),
  ],
  cierre: show('big-text', { text: '2 × 7 = 14', sub: 'el doble de 7' }, 'La regla: la tabla del 2 es el doble. Si cuentas de 2 en 2, ya la sabes.'),
})

/** La tabla del 5: acaba en 0 o en 5. */
const tabla5 = clase({
  id: 'c3-tabla-5',
  topicId: 'tabla-5',
  title: 'La tabla del 5',
  para: [
    show('groups', { groups: 3, perGroup: 5, emoji: '🔴' }, 'Dani tiene 3 bolsas con 5 canicas en cada una. Hoy aprendemos la tabla del 5.', 'frog'),
  ],
  ejemplo: [
    w1Easy.steps[3],
    show('big-text', { text: '5 × 4 = 20', sub: 'cuatro por cinco, veinte' }, 'Una mano tiene 5 dedos. Cuatro manos tienen 20 dedos: 5 × 4 = 20.'),
    show('big-text', { text: '5 · 10 · 15 · 20 · 25', sub: 'de 5 en 5' }, 'Por eso la tabla del 5 cuenta de 5 en 5 y acaba siempre en 0 o en 5.'),
  ],
  guiada: [
    tryIt('easy-tables', undefined, '¡Te toca! Mira si acaba en 0 o en 5.', facts(5, 1, 5)),
    tryIt('easy-tables', undefined, '¡Otra! Piensa en las manos: 5 dedos cada una.', facts(5, 1, 5)),
  ],
  sola: [
    tryIt('easy-tables', undefined, '¡Tu turno! Ahora con números más grandes.', facts(5, 6, 8)),
    tryIt('easy-tables', undefined, '¡Tu turno! Cuenta de 5 en 5 hasta el final.', facts(5, 6, 10)),
    tryIt('easy-tables', undefined, '¡Tu turno! Sin pistas: de 5 en 5.', facts(5, 8, 10)),
  ],
  cierre: show('big-text', { text: '5 × 7 = 35', sub: 'cinco por siete, treinta y cinco' }, 'La regla: la tabla del 5 acaba en 0 o en 5, y se cuenta de 5 en 5.'),
})

/** La tabla del 10: se pone un 0 detrás. */
const tabla10 = clase({
  id: 'c3-tabla-10',
  topicId: 'tabla-10',
  title: 'La tabla del 10',
  para: [
    show('big-text', { text: '3 × 10 = 30', sub: 'tres bolsas de 10 canicas' }, 'Dani tiene 3 bolsas con 10 canicas cada una. Hoy aprendemos la tabla del 10.', 'frog'),
  ],
  ejemplo: [
    w1Easy.steps[4],
    show('big-text', { text: '10 × 3 = 30', sub: 'diez por tres, treinta' }, 'El 3 y un 0 detrás: 10 × 3 = 30.'),
    show('big-text', { text: '10 · 20 · 30 · 40 · 50', sub: 'de 10 en 10' }, 'Si cuentas de 10 en 10, la tabla del 10 sale sola.'),
  ],
  guiada: [
    tryIt('easy-tables', undefined, '¡Te toca! Pon un 0 detrás.', facts(10, 1, 5)),
    tryIt('easy-tables', undefined, '¡Otra! Cuenta de 10 en 10.', facts(10, 1, 5)),
  ],
  sola: [
    tryIt('easy-tables', undefined, '¡Tu turno! Ahora con números más grandes.', facts(10, 6, 8)),
    tryIt('easy-tables', undefined, '¡Tu turno! Cuenta de 10 en 10 o pon un 0.', facts(10, 6, 10)),
    tryIt('easy-tables', undefined, '¡Tu turno! Sin pistas: un 0 detrás.', facts(10, 8, 10)),
  ],
  cierre: show('big-text', { text: '10 × 9 = 90', sub: 'diez por nueve, noventa' }, 'La regla: en la tabla del 10 se pone un 0 detrás del número.'),
})

/** La tabla del 3: grupos de 3 y contar de 3 en 3. */
const tabla3 = clase({
  id: 'c3-tabla-3',
  topicId: 'tabla-3',
  title: 'La tabla del 3',
  para: [
    show('groups', { groups: 3, perGroup: 4, emoji: '🌻' }, 'En el huerto, Pepa planta 3 filas de 4 girasoles. Hoy aprendemos la tabla del 3.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '3 + 3 + 3 + 3 = 12' }, 'Sumar grupos iguales es multiplicar. Sumar 3 cuatro veces da 12: es 4 × 3 = 12, y también 3 × 4.'),
    show('array-rotate', { rows: 3, cols: 6, emoji: '🌻' }, 'Pepa planta 3 filas de 6 flores: 3 × 6 = 18. Si giras el huerto, son 6 filas de 3: también 18.'),
    show('big-text', { text: '3 · 6 · 9 · 12 · 15', sub: 'de 3 en 3' }, 'En la tabla del 3 contamos de 3 en 3: 3, 6, 9, 12, 15…'),
  ],
  guiada: [
    tryIt('big-text', { text: 'Tabla del 3' }, '¡Te toca! Cuenta de 3 en 3 si te ayuda.', facts(3, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 3' }, '¡Otra! Piensa en grupos de 3.', facts(3, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 3' }, '¡Tu turno! Ahora con números más grandes.', facts(3, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 3' }, '¡Tu turno! Cuenta de 3 en 3 o suma el 3 varias veces.', facts(3, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 3' }, '¡Tu turno! Sin pistas: de 3 en 3.', facts(3, 8, 10)),
  ],
  cierre: show('big-text', { text: '3 × 5 = 15', sub: 'tres por cinco, quince' }, 'La regla: la tabla del 3 se cuenta de 3 en 3, y el orden de los factores no cambia el resultado.'),
})

/** La tabla del 4: doble del doble. */
const tabla4 = clase({
  id: 'c3-tabla-4',
  topicId: 'tabla-4',
  title: 'La tabla del 4',
  para: [
    show('big-text', { text: '4 × 3', sub: 'cuatro por tres' }, 'Hoy aprendemos la tabla del 4. Hay un truco: dobla dos veces.', 'owl'),
  ],
  ejemplo: [
    show('double-chain', { start: 3, steps: 2 }, '4 × 3: 3 → 6 → 12. El doble de 3 es 6, y el doble de 6 es 12.'),
    show('double-chain', { start: 5, steps: 2 }, '4 × 5: 5 → 10 → 20. Otra vez, doble y doble.'),
    show('double-chain', { start: 6, steps: 2 }, '4 × 6: 6 → 12 → 24. ¡Doble y doble!'),
    show('big-text', { text: '4 · 8 · 12 · 16 · 20', sub: 'de 4 en 4' }, 'Contar de 4 en 4 también sirve: 4, 8, 12, 16, 20…'),
  ],
  guiada: [
    tryIt('big-text', { text: 'Tabla del 4' }, '¡Te toca! Dobla dos veces.', facts(4, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 4' }, '¡Otra! Si te ayuda, cuenta de 4 en 4.', facts(4, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 4' }, '¡Tu turno! Dobla dos veces, con números más grandes.', facts(4, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 4' }, '¡Tu turno! Doble y doble otra vez.', facts(4, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 4' }, '¡Tu turno! Sin pistas: de 4 en 4.', facts(4, 8, 10)),
  ],
  cierre: show('double-chain', { start: 7, steps: 2 }, 'La regla: para multiplicar por 4, dobla dos veces. 4 × 7: 7 → 14 → 28.'),
})

/** La tabla del 6: el 5 y uno más (lección del mapa «Truco 1»). */
const tabla6 = clase({
  id: 'c3-tabla-6',
  topicId: 'tabla-6',
  mapLessonId: 'w3-five',
  title: 'La tabla del 6',
  para: [
    show('known-facts', { table: 6 }, 'Hoy aprendemos la tabla del 6. ¡Ya sabes varias!', 'frog'),
  ],
  ejemplo: w3Five.steps.slice(0, 5),
  guiada: [
    tryIt('big-text', { text: 'Tabla del 6' }, '¡Te toca! Piensa en el 5 y suma uno más.', facts(6, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 6' }, '¡Otra! Si te ayuda, usa el 5 y uno más.', facts(6, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 6' }, '¡Tu turno! Ahora con números más grandes.', facts(6, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 6' }, '¡Tu turno! Piensa en el 5 y suma uno más, o cuenta de 6 en 6.', facts(6, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 6' }, '¡Tu turno! Sin pistas.', facts(6, 8, 10)),
  ],
  cierre: show('five-plus-one', { b: 8 }, 'La regla: 6 × un número es 5 veces ese número, y una vez más. 6 × 8 = 40 + 8 = 48.'),
})

/** La tabla del 8: el patrón de las unidades (lección del mapa «Los secretos del 8»). */
const tabla8 = clase({
  id: 'c3-tabla-8',
  topicId: 'tabla-8',
  mapLessonId: 'w5-pattern',
  title: 'La tabla del 8',
  para: [
    show('known-facts', { table: 8 }, 'Hoy aprendemos la tabla del 8. ¡Tiene un secreto!', 'octopus'),
  ],
  ejemplo: w5Pattern.steps.slice(0, 4),
  guiada: [
    tryIt('big-text', { text: 'Tabla del 8' }, '¡Te toca! Dobla tres veces.', facts(8, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 8' }, '¡Otra! Mira las unidades: 8, 6, 4, 2, 0.', facts(8, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 8' }, '¡Tu turno! Ahora con números más grandes.', facts(8, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 8' }, '¡Tu turno! El secreto: mira las unidades.', facts(8, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 8' }, '¡Tu turno! Sin pistas: busca el patrón de las unidades.', facts(8, 8, 10)),
  ],
  cierre: show('pattern-units', { table: 8 }, 'La regla: en la tabla del 8, las unidades bajan de 2 en 2: 8, 6, 4, 2, 0.'),
})

/** La tabla del 7: casi toda ya se sabe (lección del mapa «La tabla del 7»). */
const tabla7 = clase({
  id: 'c3-tabla-7',
  topicId: 'tabla-7',
  mapLessonId: 'w6-seven',
  title: 'La tabla del 7',
  para: [
    show('known-facts', { table: 7 }, 'Hoy aprendemos la tabla del 7. ¿Da miedo? ¡Vamos a verlo!', 'fairy'),
  ],
  ejemplo: w6Seven.steps.slice(0, 5),
  guiada: [
    tryIt('big-text', { text: 'Tabla del 7' }, '¡Te toca! Cuenta de 7 en 7 si te ayuda.', facts(7, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 7' }, '¡Otra! Piensa en las semanas: 7 días cada una.', facts(7, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 7' }, '¡Tu turno! Ahora con números más grandes.', facts(7, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 7' }, '¡Tu turno! Sin pistas: piensa en la rima.', facts(7, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 7' }, '¡Tu turno! Sin pistas: ya conoces casi toda la tabla.', facts(7, 8, 10)),
  ],
  cierre: show('square-rhyme', undefined, 'La regla: la tabla del 7 tiene pocas multiplicaciones nuevas. Si ya sabes 6 × 7, también sabes 7 × 6.'),
})

/** La tabla del 9: uno menos, y las cifras suman 9 (lección del mapa «El truco del 9»). */
const tabla9 = clase({
  id: 'c3-tabla-9',
  topicId: 'tabla-9',
  mapLessonId: 'w6-nine',
  title: 'La tabla del 9',
  para: [
    show('big-text', { text: 'Tabla del 9' }, 'Hoy aprendemos la tabla del 9. ¡Tiene un truco muy bonito!', 'owl'),
  ],
  ejemplo: w6Nine.steps.slice(0, 3),
  guiada: [
    tryIt('big-text', { text: 'Tabla del 9' }, '¡Te toca! Uno menos… y que sumen 9.', facts(9, 1, 5)),
    tryIt('big-text', { text: 'Tabla del 9' }, '¡Otra! Diez veces el número, y quita una vez.', facts(9, 1, 5)),
  ],
  sola: [
    tryIt('big-text', { text: 'Tabla del 9' }, '¡Tu turno! Ahora con números más grandes.', facts(9, 6, 8)),
    tryIt('big-text', { text: 'Tabla del 9' }, '¡Tu turno! Uno menos, y que las dos cifras sumen 9.', facts(9, 6, 10)),
    tryIt('big-text', { text: 'Tabla del 9' }, '¡Tu turno! Sin pistas.', facts(9, 8, 10)),
  ],
  cierre: show('nine-trick', { a: 8 }, 'La regla: en la tabla del 9, el resultado empieza por uno menos que el otro número, y sus cifras suman 9.'),
})

/** The times-table classes (3.º): one per table of the syllabus. */
export const TABLAS_CLASSES: ClassDef[] = [
  tabla2,
  tabla5,
  tabla10,
  tabla3,
  tabla4,
  tabla6,
  tabla8,
  tabla7,
  tabla9,
]
