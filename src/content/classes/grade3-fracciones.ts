/* Clases de fracciones de 3.º de Primaria: una por tema del temario (src/content/syllabus/grade3.ts). Mismo formato que las
   demás: para qué sirve, un ejemplo resuelto, dos prácticas con pistas, tres o cuatro sin pistas y una frase que resume la
   regla. Las prácticas usan solo habilidades de su propio tema, y su texto sirve para todas las variantes del generador. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Mitades, tercios y cuartos: la figura partida en partes iguales, el número de abajo y el de arriba. */
const mitadCuarto = clase({
  id: 'c3-fracciones-mitad-cuarto',
  topicId: 'fracciones-mitad-cuarto',
  title: 'Mitades, tercios y cuartos',
  para: [
    show('fraction-shape', { parts: 2, shaded: 1, shape: 'circle' }, 'Una pizza que se parte en partes iguales se puede repartir. Cada parte es una fracción de la pizza.', 'frog'),
    show('fraction-shape', { parts: 4, shaded: 3, shape: 'bar' }, 'Una fracción se escribe con dos números, uno encima de otro.', 'ladybug'),
  ],
  ejemplo: [
    show('fraction-shape', { parts: 2, shaded: 1, shape: 'circle' }, 'Partimos la pizza en 2 partes iguales. Cada parte es un medio: se escribe 1/2.'),
    show('fraction-shape', { parts: 3, shaded: 1, shape: 'bar' }, 'Partida en 3 partes iguales, cada parte es un tercio: se escribe 1/3.'),
    show('fraction-shape', { parts: 4, shaded: 1, shape: 'circle' }, 'Partida en 4 partes iguales, cada parte es un cuarto: se escribe 1/4.'),
    show('fraction-shape', { parts: 4, shaded: 3, shape: 'circle' }, 'Si se colorean 3 de las 4 partes, son tres cuartos: se escribe 3/4. Arriba van las de color, y abajo, todas.'),
  ],
  guiada: [
    tryIt('fraction-shape', { parts: 3, shaded: 2, shape: 'bar' }, '¡Te toca! Cuenta todas las partes iguales de la figura: ese número va abajo.', { skills: ['frac:read:2', 'frac:read:3', 'frac:read:4'] }),
    tryIt('fraction-shape', { parts: 4, shaded: 1, shape: 'circle' }, '¡Otra! Mira qué parte está de color y di cómo se llama.', { skills: ['frac:name:2', 'frac:name:3', 'frac:name:4'] }),
  ],
  sola: [
    tryIt('fraction-shape', { parts: 2, shaded: 1, shape: 'circle' }, '¡Tu turno! Colorea la fracción que te pidan.', { skills: ['frac:shade:2', 'frac:shade:3', 'frac:shade:4'] }),
    tryIt('fraction-shape', { parts: 4, shaded: 3, shape: 'bar' }, '¡Tu turno! Escribe arriba las partes de color y abajo todas las partes.', { skills: ['frac:read:3', 'frac:read:4'] }),
    tryIt('fraction-shape', { parts: 3, shaded: 1, shape: 'circle' }, '¡Tu turno! Mira cuántas partes iguales hay: ese número dice cómo se llama la parte.', { skills: ['frac:name:3', 'frac:name:4'] }),
    tryIt('fraction-shape', { parts: 4, shaded: 2, shape: 'circle' }, '¡Tu turno! Toca las figuras que no están partidas en partes iguales.', { skills: ['frac:equal'] }),
  ],
  cierre: show('fraction-shape', { parts: 4, shaded: 3, shape: 'circle' }, 'La regla: arriba van las partes de color y abajo todas las partes iguales; por eso un cuarto es una de cuatro partes.'),
})

/* Fracción de una cantidad: se reparte entre el número de abajo y se cogen los grupos que dice el de arriba. */
const fraccionCantidad = clase({
  id: 'c3-fraccion-cantidad',
  topicId: 'fraccion-cantidad',
  title: 'Fracción de una cantidad',
  para: [
    show('fraction-groups', { total: 20, parts: 4, take: 0 }, 'Pepa tiene 20 caramelos y los reparte en 4 bolsas iguales, con el mismo número en cada bolsa.', 'frog'),
    show('fraction-groups', { total: 20, parts: 4, take: 1 }, 'Una bolsa es un cuarto de los caramelos. ¿Cuántos caramelos hay en una bolsa?', 'ladybug'),
  ],
  ejemplo: [
    show('fraction-groups', { total: 20, parts: 4, take: 0 }, 'Repartimos: 20 caramelos en 4 grupos iguales. En cada grupo hay 5, porque 20 ÷ 4 = 5.'),
    show('fraction-groups', { total: 20, parts: 4, take: 1 }, 'Un cuarto de 20 son los caramelos de un grupo: 20 ÷ 4 = 5.'),
    show('fraction-groups', { total: 20, parts: 4, take: 3 }, 'Tres cuartos son tres grupos: 3 × 5 = 15. Tres cuartos de 20 son 15.'),
    show('fraction-groups', { total: 12, parts: 4, take: 3 }, 'Con 12 caramelos en 4 grupos, cada grupo tiene 3. Tres cuartos son 3 grupos: 3 × 3 = 9. Tres cuartos de 12 son 9.'),
  ],
  guiada: [
    tryIt('fraction-groups', { total: 12, parts: 3, take: 1 }, '¡Te toca! Mira en cuántas partes iguales está repartido el total: ese número va abajo.', { skills: ['frac:of:2', 'frac:of:3', 'frac:of:4'] }),
    tryIt('fraction-groups', { total: 20, parts: 4, take: 3 }, '¡Otra! Mira cuántas partes te piden (el número de arriba) y piensa cuántos son esas partes.', { skills: ['frac:of:2', 'frac:of:3', 'frac:of:4'] }),
  ],
  sola: [
    tryIt('fraction-groups', { total: 12, parts: 2, take: 1 }, '¡Tu turno! Antes de contar, mira en cuántas partes iguales está repartido el total.', { skills: ['frac:of:2', 'frac:of:3'] }),
    tryIt('fraction-groups', { total: 12, parts: 4, take: 3 }, '¡Tu turno! Con más partes, las partes son más pequeñas: cuenta cuántas te piden.', { skills: ['frac:of:3', 'frac:of:4'] }),
    tryIt('fraction-groups', { total: 20, parts: 4, take: 3 }, '¡Tu turno! Primero mira en cuántas partes iguales está repartido el total; después, cuántas te piden.', { skills: ['frac:of:4'] }),
    tryIt('fraction-groups', { total: 12, parts: 3, take: 2 }, '¡Tu turno! Lee bien el número de abajo y el de arriba.', { skills: ['frac:of:2', 'frac:of:3', 'frac:of:4'] }),
  ],
  cierre: show('fraction-groups', { total: 20, parts: 4, take: 1 }, 'La regla: para hallar una fracción de una cantidad, primero se reparte entre el número de abajo y después se cuentan las partes que dice el número de arriba.'),
})

/* Comparar fracciones con dibujos: con el mismo número de abajo gana la que tiene más partes de color; si no, se mira
   cuánto ocupa una parte. */
const compararFracciones = clase({
  id: 'c3-fracciones-comparar',
  topicId: 'fracciones-comparar',
  title: 'Comparar fracciones',
  para: [
    show('fraction-shape', { parts: 2, shaded: 1, shape: 'bar' }, 'Dani y Pepa tienen una barra de chocolate igual cada una. Dani se come una parte de la suya, partida en 2 partes iguales.', 'frog'),
    show('fraction-shape', { parts: 4, shaded: 1, shape: 'bar' }, 'La barra de Pepa está partida en 4 partes iguales. Pepa se come una parte. ¿Quién ha comido más?', 'ladybug'),
  ],
  ejemplo: [
    show('fraction-shape', { parts: 2, shaded: 1, shape: 'bar' }, 'Un medio: la barra partida en 2 partes, con 1 parte de color.'),
    show('fraction-shape', { parts: 4, shaded: 1, shape: 'bar' }, 'Un cuarto: la barra partida en 4 partes, con 1 parte de color. Cada parte es más pequeña que la de la mitad.'),
    show('fraction-shape', { parts: 4, shaded: 2, shape: 'bar' }, 'Dos cuartos de la misma barra ocupan lo mismo que un medio: 2/4 es igual a 1/2, así que las dos fracciones son iguales.'),
    show('fraction-shape', { parts: 4, shaded: 3, shape: 'bar' }, 'Si el número de abajo es el mismo, gana la que tiene más partes de color: tres cuartos es más que un cuarto.'),
  ],
  guiada: [
    tryIt('fraction-shape', { parts: 3, shaded: 1, shape: 'bar' }, '¡Te toca! Mira cuánto ocupa una sola parte en cada barra.', { skills: ['frac:compare'] }),
    tryIt('fraction-shape', { parts: 4, shaded: 3, shape: 'bar' }, '¡Otra! Mira primero si el número de abajo es el mismo en las dos.', { skills: ['frac:compare'] }),
  ],
  sola: [
    tryIt('fraction-shape', { parts: 2, shaded: 1, shape: 'bar' }, '¡Tu turno! Compara las dos fracciones: ¿cuál ocupa más, o si ocupan lo mismo?', { skills: ['frac:compare'] }),
    tryIt('fraction-shape', { parts: 6, shaded: 4, shape: 'bar' }, '¡Tu turno! Si las barras están partidas en partes distintas, compara cuánto ocupa una parte.', { skills: ['frac:compare'] }),
    tryIt('fraction-shape', { parts: 8, shaded: 4, shape: 'bar' }, '¡Tu turno! Mira con calma las dos barras y compara lo que ocupa cada una.', { skills: ['frac:compare'] }),
  ],
  cierre: show('fraction-shape', { parts: 4, shaded: 2, shape: 'bar' }, 'La regla: si los números de abajo son iguales, gana la que tiene más partes de color; si no, mira cuánto ocupa una parte, y si ocupan lo mismo, son iguales.'),
})

/* Fracciones de 5, 6, 8, 10 y 12 partes: la misma regla de siempre, con más partes y otros nombres. */
const masPartes = clase({
  id: 'c3-fracciones-mas-partes',
  topicId: 'fracciones-mas-partes',
  title: 'Fracciones de más partes',
  para: [
    show('fraction-shape', { parts: 5, shaded: 2, shape: 'circle' }, 'Algunas figuras se parten en más partes iguales: 5, 6, 8, 10 o 12. Cuantas más partes, más pequeña es cada una.', 'frog'),
    show('fraction-shape', { parts: 8, shaded: 3, shape: 'bar' }, 'Se leen igual que antes: arriba van las partes de color y abajo, todas las partes. Aquí son 3 de 8.', 'ladybug'),
  ],
  ejemplo: [
    show('fraction-shape', { parts: 5, shaded: 2, shape: 'circle' }, 'Partida en 5 partes iguales, cada parte es un quinto. Dos de color son dos quintos: 2/5.'),
    show('fraction-shape', { parts: 6, shaded: 1, shape: 'bar' }, 'Partida en 6 partes iguales, cada parte es un sexto: 1/6.'),
    show('fraction-shape', { parts: 8, shaded: 5, shape: 'circle' }, 'Con 8 partes, cada una es un octavo. Cinco de color son cinco octavos: 5/8.'),
    show('fraction-shape', { parts: 10, shaded: 7, shape: 'bar' }, 'Con 10 partes, cada una es un décimo. Siete de color son siete décimos: 7/10.'),
    show('fraction-shape', { parts: 12, shaded: 9, shape: 'circle' }, 'Con 12 partes, cada una es un doceavo. Nueve de color son nueve doceavos: 9/12.'),
  ],
  guiada: [
    tryIt('fraction-shape', { parts: 6, shaded: 4, shape: 'circle' }, '¡Te toca! Cuenta las partes iguales de la figura: ese número va abajo.', { skills: ['frac:read:5', 'frac:read:6', 'frac:read:8', 'frac:read:10', 'frac:read:12'] }),
    tryIt('fraction-shape', { parts: 8, shaded: 3, shape: 'bar' }, '¡Otra! Mira la figura y di cómo se llama la parte de color.', { skills: ['frac:name:5', 'frac:name:6', 'frac:name:8', 'frac:name:10', 'frac:name:12'] }),
  ],
  sola: [
    tryIt('fraction-shape', { parts: 5, shaded: 3, shape: 'bar' }, '¡Tu turno! Colorea la fracción que te pidan: fíjate en cuántas partes iguales hay.', { skills: ['frac:shade:5', 'frac:shade:6', 'frac:shade:8'] }),
    tryIt('fraction-shape', { parts: 10, shaded: 7, shape: 'circle' }, '¡Tu turno! Escribe arriba las partes de color y abajo todas las partes.', { skills: ['frac:read:10', 'frac:read:12'] }),
    tryIt('fraction-shape', { parts: 12, shaded: 9, shape: 'circle' }, '¡Tu turno! ¿Cómo se llama cada parte de color?', { skills: ['frac:name:8', 'frac:name:10', 'frac:name:12'] }),
    tryIt('fraction-shape', { parts: 10, shaded: 4, shape: 'bar' }, '¡Tu turno! Con más partes, cada una es más pequeña: colorea con cuidado.', { skills: ['frac:shade:10', 'frac:shade:12'] }),
  ],
  cierre: show('fraction-shape', { parts: 8, shaded: 5, shape: 'bar' }, 'La regla no cambia: arriba van las partes de color y abajo todas las partes iguales, aunque sean 5, 6, 8, 10 o 12.'),
})

/** The maths classes of the fraction topics (3.º). */
export const FRACCIONES_CLASSES: ClassDef[] = [mitadCuarto, fraccionCantidad, compararFracciones, masPartes]
