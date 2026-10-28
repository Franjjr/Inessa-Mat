/* Clases de gráficos y probabilidad de 3.º de Primaria: una por tema del bloque «Gráficos y probabilidad» del temario
   (src/content/syllabus/grade3.ts). Mismo formato que las demás: para qué sirve, un ejemplo resuelto, dos prácticas con
   pistas, tres o cuatro sin pistas y una frase que resume la regla. Las prácticas usan solo habilidades de su propio tema
   (src/engine/data.ts), y su texto sirve para todas las variantes del generador: cada dibujo vale 2, 5 o 10 en el pictograma,
   las barras van de 1 a 10, las tablas tienen 2 o 3 grupos y 3 o 4 opciones, y la bolsa puede tener una o varias colores.
   Por eso las prácticas no nombran ningún número. Las figuras de la explicación son los de src/activities/lesson/visuals/data.tsx,
   que dibujan con los mismos componentes que los ejercicios. */
import { show, tryIt } from '@/content/lessons/dsl'
import { clase, type ClassDef } from './dsl'

/* Pictogramas y gráficas de barras: cada dibujo vale una cantidad (la leyenda), y la barra llega hasta su número en la escala. */
const graficos = clase({
  id: 'c3-datos-graficos',
  topicId: 'graficos',
  title: 'Pictogramas y gráficas de barras',
  para: [
    show('pictogram', { rows: 'Gatos:3,Perros:5' }, 'Un pictograma cuenta con dibujos. Cada fila es una cosa, y cada dibujo cuenta una unidad.', 'frog'),
    show('bar-chart', { rows: 'Gatos:3,Perros:5' }, 'Una gráfica de barras cuenta con barras. La barra de cada fila llega hasta su número en la escala de la izquierda.', 'ladybug'),
  ],
  ejemplo: [
    show('pictogram', { rows: 'Gatos:3:🐱,Perros:5:🐶' }, 'Aquí cada dibujo vale 1. Los gatos son 3 dibujos, y los perros, 5.'),
    show('pictogram', { rows: 'Gatos:6:🐱,Perros:10:🐶', unit: 2 }, 'Ahora cada dibujo vale 2: cuenta de 2 en 2. Los gatos son 6, que son 3 dibujos. Los perros son 10, que son 5 dibujos.'),
    show('pictogram', { rows: 'Peces:15:🐟', unit: 5 }, 'Si cada dibujo vale 5, cuenta de 5 en 5. Los peces son 15: 3 dibujos de 5.'),
    show('bar-chart', { rows: 'Gatos:4,Perros:7,Peces:2' }, 'En la gráfica, mira hasta dónde llega cada barra en la escala. Los perros llegan hasta el 7: es la barra más alta.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'dibujos · barras' }, '¡Te toca! Mira primero cuánto vale cada dibujo, o qué números marca la escala de la izquierda. Después cuenta.', { skills: ['chart:pict:x'] }),
    tryIt('big-text', { text: 'cuántos · cuántos más · en total' }, '¡Otra! Lee la pregunta antes de mirar: ¿te piden cuántos hay, cuántos más, cuántos en total o cuál tiene más?', { skills: ['chart:pict:x', 'chart:bars'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'dibujos · barras' }, '¡Tu turno! Mira cuánto vale cada dibujo o qué marca la escala, y cuenta con calma.', { skills: ['chart:pict:x'] }),
    tryIt('big-text', { text: 'escala · barras' }, '¡Tu turno! Sigue con el dedo la parte de arriba de cada barra hasta el número de la izquierda.', { skills: ['chart:bars'] }),
    tryIt('big-text', { text: 'cuántos más · en total' }, '¡Tu turno! Si te piden cuántos más, resta. Si te piden en total, suma. Lee bien la pregunta antes.', { skills: ['chart:pict:x', 'chart:bars'] }),
    tryIt('big-text', { text: 'cada fila o barra' }, '¡Tu turno! Lee la pregunta, mira todo el dibujo y no te saltes ninguna fila ni ninguna barra.', { skills: ['chart:pict:x', 'chart:bars'] }),
  ],
  cierre: show('bar-chart', { rows: 'Gatos:4,Perros:7,Peces:2' }, 'La regla: en un pictograma, cada dibujo vale lo que dice la leyenda. En una gráfica de barras, la barra llega hasta su número en la escala.'),
})

/* Tablas de datos: las filas son los grupos, las columnas son las opciones, y cada cruce tiene un número. */
const tablas = clase({
  id: 'c3-datos-tablas',
  topicId: 'graficos-tablas',
  title: 'Tablas de datos',
  para: [
    show('big-text', { text: 'Una tabla ordena los datos', sub: 'Filas: los grupos · Columnas: las opciones' }, 'Una tabla de datos anota cuántos hay de cada cosa. Cada fila es un grupo, y cada columna es una opción.', 'frog'),
    show('big-text', { text: 'El número va donde se cruzan', sub: 'Fila del grupo + columna de la opción' }, 'Para leer un dato, busca la fila del grupo y la columna de la opción. El número donde se cruzan es el dato que buscas.', 'ladybug'),
  ],
  ejemplo: [
    show('big-text', { text: '3.º A · manzana: 5', sub: 'Fila 3.º A, columna de la manzana' }, 'En la fila de 3.º A y la columna de la manzana hay un 5: son 5 niños de 3.º A que prefieren la manzana.'),
    show('big-text', { text: '3.º A · pera: 2', sub: 'Fila 3.º A, columna de la pera' }, 'En la misma fila, la columna de la pera tiene un 2: son 2 niños de 3.º A que prefieren la pera.'),
    show('big-text', { text: '5 − 2 = 3', sub: '3 niños más prefieren la manzana' }, 'Para saber cuántos más, resta: 5 menos 2 son 3. Hay 3 niños más que prefieren la manzana.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'fila · columna · número' }, '¡Te toca! Busca primero la fila del grupo que te preguntan, y después la columna de la opción.', { skills: ['chart:table'] }),
    tryIt('big-text', { text: 'donde se cruzan' }, '¡Otra! Baja con el dedo por la columna y para en la fila: el número que lees ahí es la respuesta.', { skills: ['chart:table'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'grupo · opción · cruce' }, '¡Tu turno! Lee la pregunta: ¿de qué grupo es y qué opción te piden? Después busca el cruce.', { skills: ['chart:table'] }),
    tryIt('big-text', { text: 'filas y columnas' }, '¡Tu turno! Los grupos están en filas, a la izquierda. Las opciones están en columnas, arriba. Busca el cruce.', { skills: ['chart:table'] }),
    tryIt('big-text', { text: 'el cruce' }, '¡Tu turno! Cuenta con el dedo: una fila y una columna, y el número donde se juntan.', { skills: ['chart:table'] }),
    tryIt('big-text', { text: 'no te confundas de fila' }, '¡Tu turno! Fíjate bien en el grupo y en la opción: la fila de un grupo no es la de otro.', { skills: ['chart:table'] }),
  ],
  cierre: show('big-text', { text: 'Fila: el grupo · Columna: la opción', sub: 'El número donde se cruzan es el dato' }, 'La regla: para leer una tabla, busca la fila del grupo y la columna de la opción. El número donde se cruzan es lo que te piden.'),
})

/* Seguro, posible o imposible: seguro si todas las bolas son de ese color; posible si hay algunas; imposible si no hay ninguna. */
const probabilidad = clase({
  id: 'c3-datos-probabilidad',
  topicId: 'probabilidad',
  title: 'Seguro, posible o imposible',
  para: [
    show('chance-bag', { balls: 'red:4' }, 'Imagina una bolsa con bolas de colores. Sacas una bola sin mirar.', 'frog'),
    show('chance-bag', { balls: 'red:3,blue:2' }, 'Lo que puede salir depende de las bolas que hay en la bolsa.', 'ladybug'),
  ],
  ejemplo: [
    show('chance-bag', { balls: 'red:4' }, 'Todas las bolas son rojas: sacar una roja es seguro. Pase lo que pase, sale roja.'),
    show('chance-bag', { balls: 'red:3,blue:2' }, 'Hay rojas y hay azules: sacar una roja es posible, porque puede salir o no. Lo mismo con una azul.'),
    show('chance-bag', { balls: 'red:3' }, 'En esta bolsa no hay ninguna bola azul: sacar una azul es imposible. Nunca puede salir.'),
    show('big-text', { text: 'Seguro: todas · Posible: algunas · Imposible: ninguna' }, 'Para decidir, mira las bolas de la bolsa. Si todas son de ese color, es seguro. Si hay algunas, es posible. Si no hay ninguna, es imposible.'),
  ],
  guiada: [
    tryIt('big-text', { text: 'seguro · posible · imposible' }, '¡Te toca! Mira todas las bolas de la bolsa: ¿son todas del color que preguntan, hay algunas o no hay ninguna?', { skills: ['prob:chance'] }),
    tryIt('big-text', { text: 'seguro · posible · imposible' }, '¡Otra! Antes de contestar, cuenta cuántas bolas hay de ese color.', { skills: ['prob:chance'] }),
  ],
  sola: [
    tryIt('big-text', { text: 'seguro · posible · imposible' }, '¡Tu turno! Mira si hay bolas de otro color en la bolsa: eso cambia lo que puede pasar.', { skills: ['prob:chance'] }),
    tryIt('big-text', { text: 'seguro · posible · imposible' }, '¡Tu turno! Mira cuántas bolas hay de ese color: ninguna, algunas o todas.', { skills: ['prob:chance'] }),
    tryIt('big-text', { text: 'el color que preguntan' }, '¡Tu turno! Lee bien el color que te preguntan, y compáralo con los colores que hay en la bolsa.', { skills: ['prob:chance'] }),
    tryIt('big-text', { text: 'seguro · posible · imposible' }, '¡Tu turno! Decide con calma: seguro si todas son de ese color, posible si algunas, imposible si ninguna.', { skills: ['prob:chance'] }),
  ],
  cierre: show('chance-bag', { balls: 'red:3,blue:2' }, 'La regla: es seguro si todas las bolas son de ese color. Es posible si hay algunas de ese color y de otros. Es imposible si no hay ninguna.'),
})

/** The graphs and probability classes (3.º): one per topic of the «Gráficos y probabilidad» block of the temario. */
export const DATOS_CLASSES: ClassDef[] = [graficos, tablas, probabilidad]
