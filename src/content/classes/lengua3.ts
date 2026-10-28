/* Clases de Lengua de 3.º: una por tema de gramática, ortografía y vocabulario (src/content/syllabus/lengua3.ts). Lectura,
   literatura y escritura no tienen clase: se practican con sus historias. Cada clase: una historia corta de Lumi y su
   compañero, ejemplos que cambian una cosa cada vez, dos prácticas con pistas (la más fácil del tema), tres o cuatro sin
   pistas (igual o más difíciles) y una frase que resume la regla. Las prácticas de guiada y sola no escriben la respuesta:
   sus tarjetas enseñan la regla, no la palabra. */
import { show, tryIt } from '@/content/lessons/dsl'
import { lenguaSkill } from '@/engine/skills'
import { clase, type ClassDef } from './dsl'

type Mark = 'noun' | 'adj' | 'verb' | 'art'
type Params = Record<string, string>

/** Parámetros de la tarjeta de una frase (lng-sentence): el texto y, si hace falta, la parte marcada. */
const sen = (text: string, highlight?: string, mark?: Mark): Params => ({
  text, ...(highlight ? { highlight } : {}), ...(mark ? { mark } : {}),
})
/** Parámetros de una palabra (lng-word): la palabra, sus trozos («ma-ri-po-sa», «abre+latas») y la parte marcada. */
const wd = (word: string, parts?: string, mark?: string): Params => ({
  word, ...(parts ? { parts } : {}), ...(mark ? { mark } : {}),
})
/** La tarjeta de regla que acompaña a las prácticas: enseña la regla, nunca la palabra pedida. */
const rule = (text: string): Params => ({ text })

/* ------------------------------------------------------------------ gramática */

const silabas = clase({
  id: 'lng3-silabas',
  topicId: 'lng-silabas',
  title: 'Sílabas y palabras',
  para: [
    show('lng-word', wd('mariposa'), 'Hoy {pet} quiere escribir «mariposa» en la pizarra. ¡Las letras se pisan unas a otras!'),
    show('lng-word', wd('mariposa', 'ma-ri-po-sa'), 'Lumi tiene un truco: partir la palabra en trozos que se dicen de un golpe. Son las sílabas.'),
  ],
  ejemplo: [
    show('lng-word', wd('mariposa', 'ma-ri-po-sa'), 'Di la palabra despacio: ma-ri-po-sa. Cada golpe de voz es una sílaba.'),
    show('lng-word', wd('mariposa', 'ma-ri-po-sa'), 'Cuenta los golpes: ma, ri, po, sa. Son cuatro sílabas.'),
    show('lng-word', wd('sol', 'sol'), 'Ahora una palabra corta: sol. Solo tiene un golpe de voz, así que tiene una sílaba.'),
    show('lng-word', wd('casa', 'ca-sa'), 'Casa tiene dos golpes: ca-sa. Da una palmada por cada sílaba y sabrás cuántas tiene.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Una palmada por cada golpe de voz'), '¡Te toca! Di la palabra despacio y cuenta los golpes.', { skills: [lenguaSkill('gram', 'silabas')] }),
    tryIt('lng-sentence', rule('Una palmada por cada golpe de voz'), '¡Otra! Da una palmada por cada sílaba.', { skills: [lenguaSkill('gram', 'silabas')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Una palmada por cada golpe de voz'), '¡Tu turno! Ahora sin ayuda: cuenta los golpes de voz.', { skills: [lenguaSkill('gram', 'silabas')] }),
    tryIt('lng-sentence', rule('Una palmada por cada golpe de voz'), '¡Tu turno! Di la palabra despacio y da una palmada por sílaba.', { skills: [lenguaSkill('gram', 'silabas')] }),
    tryIt('lng-sentence', rule('Una palmada por cada golpe de voz'), '¡Tu turno! Las palabras largas también se cuentan por golpes.', { skills: [lenguaSkill('gram', 'silabas')] }),
  ],
  cierre: show('lng-word', wd('mariposa', 'ma-ri-po-sa'), 'La regla: cada golpe de voz es una sílaba, y para contarlas puedes dar palmadas.'),
})

const sustantivo = clase({
  id: 'lng3-sustantivo',
  topicId: 'lng-sustantivo',
  title: 'Sustantivos: nombres, género y número',
  para: [
    show('lng-sentence', sen('Mi globo se llama Pepa.'), 'Hoy {pet} ha comprado un globo en la feria y lo ha llamado Pepa. El globo no contesta.'),
    show('lng-sentence', sen('¿Pepa es un nombre de cosa o de persona?'), 'Lumi pregunta: ¿Pepa es el nombre de una cosa o de una persona? Para saberlo, hay que mirar.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('El perro come pan en el parque.', 'perro', 'noun'), 'Los sustantivos nombran cosas, animales, personas y lugares. «Perro» sirve para todos los perros.'),
    show('lng-sentence', sen('El perro come pan en el parque.', 'pan', 'noun'), 'Pan también es un sustantivo común, porque nombra algo que se puede comer.'),
    show('lng-sentence', sen('Lucía vive en Madrid.', 'Lucía', 'noun'), 'Lucía es un nombre propio: nombra a una sola persona y empieza con mayúscula.'),
    show('lng-sentence', sen('La gata duerme en la cama.', 'gata', 'noun'), 'Gata es femenino: va con la. Gato es masculino: va con el.'),
    show('lng-sentence', sen('Las gatas duermen juntas.', 'gatas', 'noun'), 'Gatas está en plural, porque hay más de una. Gata está en singular.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('¿Común o propio? ¿Él o ella? ¿Uno o muchos?'), '¡Te toca! ¿El nombre es de una persona concreta, o sirve para muchas cosas?', { skills: [lenguaSkill('gram', 'sustantivo', 'clase')] }),
    tryIt('lng-sentence', rule('¿Común o propio? ¿Él o ella? ¿Uno o muchos?'), '¡Otra! Piensa si el nombre es de una sola persona, lugar o cosa concreta.', { skills: [lenguaSkill('gram', 'sustantivo', 'clase')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('¿Común o propio? ¿Él o ella? ¿Uno o muchos?'), '¡Tu turno! Fíjate si el nombre va con el o con la.', { skills: [lenguaSkill('gram', 'sustantivo', 'genero')] }),
    tryIt('lng-sentence', rule('¿Común o propio? ¿Él o ella? ¿Uno o muchos?'), '¡Tu turno! Escribe el nombre como te pida la pregunta.', { skills: [lenguaSkill('gram', 'sustantivo', 'genero')], kinds: ['lng-transform'] }),
    tryIt('lng-sentence', rule('¿Común o propio? ¿Él o ella? ¿Uno o muchos?'), '¡Tu turno! ¿Hay uno o hay varios?', { skills: [lenguaSkill('gram', 'sustantivo', 'numero')] }),
  ],
  cierre: show('lng-sentence', sen('Lucía compra pan para el perro.', 'Lucía', 'noun'), 'Los sustantivos nombran cosas y personas; los propios llevan mayúscula, y todos tienen género y número.'),
})

const articulo = clase({
  id: 'lng3-articulo',
  topicId: 'lng-articulo',
  title: 'El artículo: el, la, los, las, un, una',
  para: [
    show('lng-sentence', sen('Compra una manzana y dos peras.'), 'Hoy {pet} escribe la lista de la compra, pero se hace un lío: ¿es la manzana o el manzana?'),
    show('lng-sentence', sen('La manzana es roja.', 'La', 'art'), 'Lumi le explica que hay unas palabras pequeñas que van delante de los nombres. Se llaman artículos.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('La manzana está madura.', 'La', 'art'), 'El artículo va delante del nombre. La acompaña a manzana: es femenina y está en singular.'),
    show('lng-sentence', sen('El perro duerme en el sofá.', 'El', 'art'), 'El también va delante de un nombre, pero perro es masculino: va con el.'),
    show('lng-sentence', sen('Las peras son dulces.', 'Las', 'art'), 'Las dice dos cosas: femenino y plural, porque hay muchas peras.'),
    show('lng-sentence', sen('Un gato y una gata.', 'una', 'art'), 'Un y una también son artículos: hablan de uno cualquiera. Una va con gata, que es femenina.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('el · la · los · las · un · una'), '¡Te toca! Toca los artículos de la frase.', { skills: [lenguaSkill('gram', 'articulo')] }),
    tryIt('lng-sentence', rule('el · la · los · las · un · una'), '¡Otra! Busca los artículos, también los que van con un plural.', { skills: [lenguaSkill('gram', 'articulo')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('el · la · los · las · un · una'), '¡Tu turno! Toca los artículos de la frase.', { skills: [lenguaSkill('gram', 'articulo')] }),
    tryIt('lng-sentence', rule('el · la · los · las · un · una'), '¡Tu turno! Cuidado: los artículos también pueden ser muy cortos.', { skills: [lenguaSkill('gram', 'articulo')] }),
    tryIt('lng-sentence', rule('el · la · los · las · un · una'), '¡Tu turno! Sin pistas: todos los artículos, sean los que sean.', { skills: [lenguaSkill('gram', 'articulo')] }),
  ],
  cierre: show('lng-sentence', sen('Las gallinas ponen huevos.', 'Las', 'art'), 'El artículo va delante del nombre y dice su género y su número: el, la, los, las, un, una.'),
})

const adjetivo = clase({
  id: 'lng3-adjetivo',
  topicId: 'lng-adjetivo',
  title: 'El adjetivo: cómo es',
  para: [
    show('lng-sentence', sen('Mi globo es bonito.'), '{pet} describe a todos los invitados con una sola palabra: «bonito». ¡Hasta el cubo de la basura!'),
    show('lng-sentence', sen('El globo es rojo, redondo y ligero.', 'rojo', 'adj'), 'Lumi le enseña otras palabras para describir. Los adjetivos dicen cómo es un nombre.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('El globo es rojo.', 'rojo', 'adj'), 'El adjetivo dice cómo es el nombre. Rojo nos cuenta el color del globo.'),
    show('lng-sentence', sen('La gata es blanca.', 'blanca', 'adj'), 'El adjetivo cambia con el nombre: gata es femenina, y blanca también acaba en -a.'),
    show('lng-sentence', sen('Las casas son grandes.', 'grandes', 'adj'), 'Si hay muchas casas, el adjetivo va en plural: grandes.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('¿Qué palabra dice cómo es algo?'), '¡Te toca! Toca las palabras que dicen cómo es algo.', { skills: [lenguaSkill('gram', 'adjetivo')] }),
    tryIt('lng-sentence', rule('¿Qué palabra dice cómo es algo?'), '¡Otra! Busca las palabras que describen, como el color o el tamaño.', { skills: [lenguaSkill('gram', 'adjetivo')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Dice cómo es: color, tamaño, forma'), '¡Tu turno! Toca los adjetivos.', { skills: [lenguaSkill('gram', 'adjetivo')] }),
    tryIt('lng-sentence', rule('Dice cómo es: color, tamaño, forma'), '¡Tu turno! Escribe la palabra cambiada como te pida la pregunta.', { skills: [lenguaSkill('gram', 'adjetivo')], kinds: ['lng-transform'] }),
    tryIt('lng-sentence', rule('Dice cómo es: color, tamaño, forma'), '¡Tu turno! Fíjate si el nombre es de uno o de varios.', { skills: [lenguaSkill('gram', 'adjetivo')], kinds: ['lng-transform'] }),
  ],
  cierre: show('lng-sentence', sen('Las casas son grandes y blancas.', 'grandes', 'adj'), 'El adjetivo dice cómo es el nombre, y concuerda con él en género y en número.'),
})

const verbo = clase({
  id: 'lng3-verbo',
  topicId: 'lng-verbo',
  title: 'El verbo: presente, pasado y futuro',
  para: [
    show('lng-sentence', sen('Quiere saltar la valla.'), 'Hoy {pet} quiere saltar la valla, pero una mariposa lo distrae y el salto se queda a medias.'),
    show('lng-sentence', sen('Hoy salta, ayer saltó, mañana saltará.'), 'Lumi dice que el verbo cambia de forma para contar cuándo pasa la acción: ahora, antes o después.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('El perro salta la valla.', 'salta', 'verb'), 'El verbo dice lo que se hace: salta es lo que hace el perro. Está en presente, porque pasa ahora.'),
    show('lng-sentence', sen('El perro saltó la valla ayer.', 'saltó', 'verb'), 'Saltó está en pasado: la acción ya pasó. Ayer nos lo dice.'),
    show('lng-sentence', sen('El perro saltará la valla mañana.', 'saltará', 'verb'), 'Saltará está en futuro: la acción pasará mañana.'),
    show('lng-sentence', sen('canta · cantó · cantará'), 'Mismo verbo, tres tiempos: canta, cantó, cantará. Solo cambia la terminación.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Ahora, antes o después: ¿cuándo pasa?'), '¡Te toca! Toca los verbos: lo que se hace.', { skills: [lenguaSkill('gram', 'verbo', 'presente')] }),
    tryIt('lng-sentence', rule('Ahora, antes o después: ¿cuándo pasa?'), '¡Otra! Mira cuándo pasa la acción.', { skills: [lenguaSkill('gram', 'verbo', 'presente')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Ahora, antes o después: ¿cuándo pasa?'), '¡Tu turno! Toca los verbos y fíjate en cuándo pasa la acción.', { skills: [lenguaSkill('gram', 'verbo', 'pasado')] }),
    tryIt('lng-sentence', rule('Ahora, antes o después: ¿cuándo pasa?'), '¡Tu turno! Ojo al tiempo: ¿pasa antes, ahora o después?', { skills: [lenguaSkill('gram', 'verbo', 'futuro')] }),
    tryIt('lng-sentence', rule('Ahora, antes o después: ¿cuándo pasa?'), '¡Tu turno! Sin pistas: cambia el verbo al tiempo que te pida la frase.', { skills: [lenguaSkill('gram', 'verbo', 'futuro')], kinds: ['lng-transform'] }),
  ],
  cierre: show('lng-sentence', sen('Ayer nadé, hoy nado y mañana nadaré.'), 'El verbo cambia de forma para decir cuándo pasa la acción: presente, pasado o futuro.'),
})

const oracion = clase({
  id: 'lng3-oracion',
  topicId: 'lng-oracion',
  title: 'La oración: sujeto y predicado',
  para: [
    show('lng-sentence', sen('Lucía come pan con miel.'), 'Hoy {pet} ha escrito: «Lucía come pan con miel». Lumi dice que la frase se puede partir en dos.'),
    show('lng-sentence', sen('Lucía come pan con miel.'), 'Una frase tiene dos partes: el sujeto, que dice quién hace la acción, y el predicado, que dice qué hace.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('Lucía come pan con miel.', 'Lucía'), 'Lo subrayado es el sujeto: dice quién hace la acción. Aquí, Lucía.'),
    show('lng-sentence', sen('Lucía come pan con miel.', 'come pan con miel'), 'Lo que queda es el predicado: dice qué hace Lucía. Aquí, come pan con miel.'),
    show('lng-sentence', sen('Mi perro duerme en el sofá.', 'Mi perro'), 'El sujeto puede tener varias palabras: mi perro es un solo sujeto.'),
    show('lng-sentence', sen('Mi perro duerme en el sofá.', 'duerme en el sofá'), 'El predicado es todo lo demás: duerme en el sofá.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('¿Quién hace la acción? ¿Qué hace?'), '¡Te toca! Toca quién hace la acción.', { skills: [lenguaSkill('gram', 'oracion', 'sujeto')] }),
    tryIt('lng-sentence', rule('¿Quién hace la acción? ¿Qué hace?'), '¡Otra! Busca el grupo de palabras que hace la acción.', { skills: [lenguaSkill('gram', 'oracion', 'sujeto')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('¿Quién hace la acción? ¿Qué hace?'), '¡Tu turno! Toca quién hace la acción.', { skills: [lenguaSkill('gram', 'oracion', 'sujeto')] }),
    tryIt('lng-sentence', rule('¿Quién hace la acción? ¿Qué hace?'), '¡Tu turno! Toca lo que hace el sujeto.', { skills: [lenguaSkill('gram', 'oracion', 'predicado')] }),
    tryIt('lng-sentence', rule('¿Quién hace la acción? ¿Qué hace?'), '¡Tu turno! Sin pistas: el predicado es todo lo que queda.', { skills: [lenguaSkill('gram', 'oracion', 'predicado')] }),
  ],
  cierre: show('lng-sentence', sen('Lucía come pan con miel.'), 'Cada frase tiene dos partes: el sujeto dice quién hace la acción, y el predicado dice qué hace.'),
})

/* ------------------------------------------------------------------ ortografía */

const mayusculas = clase({
  id: 'lng3-mayusculas',
  topicId: 'lng-mayusculas',
  title: 'Mayúsculas',
  para: [
    show('lng-sentence', sen('hola lumi, ¿vienes al parque?'), 'Hoy {pet} escribe una carta a Lumi sin ninguna mayúscula. ¡Parece que la carta se esconde!'),
    show('lng-sentence', sen('Hola Lumi, ¿vienes al parque?', 'Hola Lumi'), 'Lumi la corrige con paciencia. Las mayúsculas van al empezar la frase y en los nombres propios.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('Hoy llueve en el parque.', 'Hoy'), 'La primera letra de una frase va en mayúscula: aquí, la H de Hoy.'),
    show('lng-sentence', sen('Lumi vive en Madrid.', 'Lumi'), 'Los nombres de personas también llevan mayúscula: Lumi.'),
    show('lng-sentence', sen('Lumi vive en Madrid.', 'Madrid'), 'Y los nombres de lugares también: Madrid, con M.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('¿Empieza la frase o es un nombre propio?'), '¡Te toca! Elige la letra con la que empieza la palabra.', { skills: [lenguaSkill('orto', 'mayusculas')] }),
    tryIt('lng-sentence', rule('¿Empieza la frase o es un nombre propio?'), '¡Otra! Piensa si la palabra es un nombre de persona o de ciudad.', { skills: [lenguaSkill('orto', 'mayusculas')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('¿Empieza la frase o es un nombre propio?'), '¡Tu turno! Recuerda: frase o nombre propio.', { skills: [lenguaSkill('orto', 'mayusculas')] }),
    tryIt('lng-sentence', rule('¿Empieza la frase o es un nombre propio?'), '¡Tu turno! Fíjate en la primera letra de la palabra.', { skills: [lenguaSkill('orto', 'mayusculas')] }),
    tryIt('lng-sentence', rule('¿Empieza la frase o es un nombre propio?'), '¡Tu turno! Sin pistas: ¿qué letra va en mayúscula?', { skills: [lenguaSkill('orto', 'mayusculas')] }),
  ],
  cierre: show('lng-sentence', sen('Lumi vive en Madrid.', 'Madrid'), 'Las frases empiezan con mayúscula, y los nombres propios de personas y lugares también.'),
})

const cqu = clase({
  id: 'lng3-c-qu',
  topicId: 'lng-c-qu',
  title: 'c y qu',
  para: [
    show('lng-word', wd('queso', 'que-so', 'que'), 'Hoy {pet} escribe la lista de la compra. La c y la qu se pelean por la e, ¡y nadie gana!'),
    show('lng-sentence', sen('ca · co · cu  ·  que · qui'), 'Lumi pone paz: la c suena «k» delante de a, o y u; la qu suena igual delante de e e i.'),
  ],
  ejemplo: [
    show('lng-word', wd('casa', 'ca-sa', 'ca'), 'Delante de a, o y u, el sonido «k» se escribe con c: ca-sa.'),
    show('lng-word', wd('queso', 'que-so', 'que'), 'Delante de e o de i, el mismo sonido se escribe con qu: que-so.'),
    show('lng-word', wd('máquina', 'má-qui-na', 'qui'), 'En máquina, la u de qui no suena: solo sirve para que la q suene como k.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la letra que falta.'), '¡Te toca! Completa la palabra con la letra que falta.', { skills: [lenguaSkill('orto', 'c-qu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la letra que falta.'), '¡Otra! Mira la vocal que viene después.', { skills: [lenguaSkill('orto', 'c-qu')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la letra que falta.'), '¡Tu turno! Completa la palabra: ¿qué letra va?', { skills: [lenguaSkill('orto', 'c-qu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la letra que falta.'), '¡Tu turno! Cuidado con la u de que y qui: es muda.', { skills: [lenguaSkill('orto', 'c-qu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la letra que falta.'), '¡Tu turno! Sin pistas: mira la vocal que viene después.', { skills: [lenguaSkill('orto', 'c-qu')] }),
  ],
  cierre: show('lng-word', wd('queso', 'que-so', 'que'), 'Delante de a, o y u se escribe c, y delante de e e i se escribe qu.'),
})

const gGu = clase({
  id: 'lng3-g-gu',
  topicId: 'lng-g-gu',
  title: 'g, gu y gü',
  para: [
    show('lng-word', wd('pingüino', 'pin-güi-no', 'güi'), 'Hoy {pet} quiere que su pingüino luzca dos puntitos encima de la u. ¡Eso tiene nombre!'),
    show('lng-sentence', sen('ga · go · gu · gue · gui · güe · güi'), 'Esos dos puntitos se llaman diéresis, y se usan cuando la u tiene que sonar.'),
  ],
  ejemplo: [
    show('lng-word', wd('gato', 'ga-to', 'ga'), 'Delante de a, o y u, la g suena fuerte: ga-to.'),
    show('lng-word', wd('guitarra', 'gui-ta-rra', 'gui'), 'Con e o i, la g suena como una j; para que la g siga sonando fuerte se escribe una u muda: gui-ta-rra.'),
    show('lng-word', wd('pingüino', 'pin-güi-no', 'güi'), 'Y cuando la u sí suena, lleva dos puntitos: pin-güi-no.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la g.'), '¡Te toca! Completa las letras que faltan.', { skills: [lenguaSkill('orto', 'g-gu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la g.'), '¡Otra! Si la u se oye, lleva dos puntitos encima.', { skills: [lenguaSkill('orto', 'g-gu')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la g.'), '¡Tu turno! ¿La u se oye o es muda?', { skills: [lenguaSkill('orto', 'g-gu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la g.'), '¡Tu turno! Recuerda: en gue y gui la u no suena.', { skills: [lenguaSkill('orto', 'g-gu')] }),
    tryIt('lng-sentence', rule('Mira la vocal que viene después de la g.'), '¡Tu turno! Sin pistas: ¿qué letras faltan?', { skills: [lenguaSkill('orto', 'g-gu')] }),
  ],
  cierre: show('lng-word', wd('pingüino', 'pin-güi-no', 'güi'), 'Con a, o y u la g suena fuerte; con e o i necesita una u muda, y la diéresis avisa de que la u sí se oye.'),
})

const rRr = clase({
  id: 'lng3-r-rr',
  topicId: 'lng-r-rr',
  title: 'r y rr',
  para: [
    show('lng-word', wd('perro', 'pe-rro', 'rro'), 'Hoy {pet} ha pedido «un pero» en lugar de «un perro». ¡Un pero es una pega!'),
    show('lng-sentence', sen('pero (una pega) · perro (un animal)'), 'Lumi dice que la diferencia está en la r: en pero suena suave, y en perro suena fuerte.'),
  ],
  ejemplo: [
    show('lng-word', wd('pero', 'pe-ro', 'ro'), 'Entre vocales, una sola r suena suave: pe-ro.'),
    show('lng-word', wd('perro', 'pe-rro', 'rro'), 'Entre vocales, rr suena fuerte: pe-rro.'),
    show('lng-word', wd('rosa', 'ro-sa', 'ro'), 'Al principio de la palabra, la r suena fuerte, pero se escribe con una sola r: rosa.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Mira qué hay antes y después de la letra.'), '¡Te toca! Mira qué hay antes y después.', { skills: [lenguaSkill('orto', 'r-rr')] }),
    tryIt('lng-sentence', rule('Mira qué hay antes y después de la letra.'), '¡Otra! Al principio de la palabra, ¿qué letra va?', { skills: [lenguaSkill('orto', 'r-rr')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Mira qué hay antes y después de la letra.'), '¡Tu turno! Mira qué hay antes y después.', { skills: [lenguaSkill('orto', 'r-rr')] }),
    tryIt('lng-sentence', rule('Mira qué hay antes y después de la letra.'), '¡Tu turno! Entre vocales, ¿suena suave o fuerte?', { skills: [lenguaSkill('orto', 'r-rr')] }),
    tryIt('lng-sentence', rule('Mira qué hay antes y después de la letra.'), '¡Tu turno! Sin pistas: ¿qué letra falta?', { skills: [lenguaSkill('orto', 'r-rr')] }),
  ],
  cierre: show('lng-word', wd('correr', 'co-rrer', 'rrer'), 'Entre vocales, la r suena suave y la rr suena fuerte; al principio de la palabra va una sola r.'),
})

const mpMb = clase({
  id: 'lng3-mp-mb',
  topicId: 'lng-mp-mb',
  title: 'mp y mb',
  para: [
    show('lng-word', wd('sombrero', 'som-bre-ro', 'som'), 'Hoy {pet} escribe las invitaciones y pone «sonbrero» y «tanbor». Lumi ve que una n se ha colado.'),
    show('lng-sentence', sen('Delante de p y de b, siempre m.'), 'Lumi explica: delante de p y de b, la letra que va antes es m, nunca n. Así se escribe mp y mb.'),
  ],
  ejemplo: [
    show('lng-word', wd('campana', 'cam-pa-na', 'cam'), 'Delante de la p se escribe m, nunca n: cam-pa-na.'),
    show('lng-word', wd('tambor', 'tam-bor', 'tam'), 'Delante de la b también se escribe m: tam-bor.'),
    show('lng-word', wd('lámpara', 'lám-pa-ra', 'lám'), 'La lámpara también lleva m delante de la p: lám-pa-ra.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Mira la letra que viene después.'), '¡Te toca! Elige la letra que va antes de la p o de la b.', { skills: [lenguaSkill('orto', 'mp-mb')] }),
    tryIt('lng-sentence', rule('Mira la letra que viene después.'), '¡Otra! Mira bien la letra que va antes de la p.', { skills: [lenguaSkill('orto', 'mp-mb')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Mira la letra que viene después.'), '¡Tu turno! Mira qué letra viene después.', { skills: [lenguaSkill('orto', 'mp-mb')] }),
    tryIt('lng-sentence', rule('Mira la letra que viene después.'), '¡Tu turno! Recuerda la regla de la p y de la b.', { skills: [lenguaSkill('orto', 'mp-mb')] }),
    tryIt('lng-sentence', rule('Mira la letra que viene después.'), '¡Tu turno! Sin pistas: ¿qué letra va antes de la p?', { skills: [lenguaSkill('orto', 'mp-mb')] }),
  ],
  cierre: show('lng-word', wd('lámpara', 'lám-pa-ra', 'lám'), 'Delante de p y de b siempre se escribe m: campana, tambor, lámpara y sombrero.'),
})

const tonica = clase({
  id: 'lng3-tonica-atona',
  topicId: 'lng-tonica-atona',
  title: 'Sílaba tónica y sílaba átona',
  para: [
    show('lng-word', wd('mañana', 'ma-ña-na', 'ña'), 'Hoy {pet} canta «mañana» a todo volumen. Lumi le pide que suba la voz en una sola sílaba.'),
    show('lng-word', wd('casa', 'ca-sa', 'ca'), 'Cada palabra tiene una sílaba que se dice con más fuerza: es la sílaba tónica. Las demás son átonas.'),
  ],
  ejemplo: [
    show('lng-word', wd('mañana', 'ma-ña-na', 'ña'), 'En mañana, la sílaba que se dice con más fuerza es ña.'),
    show('lng-word', wd('tomate', 'to-ma-te', 'ma'), 'En tomate, la fuerza va en ma.'),
    show('lng-word', wd('camión', 'ca-mión', 'mión'), 'En camión, la fuerza va en la última sílaba: ca-mión.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Di la palabra despacio y fíjate dónde sube la voz.'), '¡Te toca! Toca la sílaba que suena más fuerte.', { skills: [lenguaSkill('orto', 'tonica')] }),
    tryIt('lng-sentence', rule('Di la palabra despacio y fíjate dónde sube la voz.'), '¡Otra! Dila en voz alta: ¿dónde está la fuerza?', { skills: [lenguaSkill('orto', 'tonica')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Di la palabra despacio y fíjate dónde sube la voz.'), '¡Tu turno! Busca la sílaba fuerte.', { skills: [lenguaSkill('orto', 'tonica')] }),
    tryIt('lng-sentence', rule('Di la palabra despacio y fíjate dónde sube la voz.'), '¡Tu turno! Sin pistas: di la palabra despacio.', { skills: [lenguaSkill('orto', 'tonica')] }),
    tryIt('lng-sentence', rule('Di la palabra despacio y fíjate dónde sube la voz.'), '¡Tu turno! Sin pistas: ¿dónde suena más alta la voz?', { skills: [lenguaSkill('orto', 'tonica')] }),
  ],
  cierre: show('lng-word', wd('camión', 'ca-mión', 'mión'), 'Cada palabra tiene una sílaba que suena más fuerte, y puede estar al principio, en medio o al final.'),
})

const signos = clase({
  id: 'lng3-signos',
  topicId: 'lng-signos',
  title: 'Punto, coma, ¿? y ¡!',
  para: [
    show('lng-sentence', sen('hoy hace sol vamos al parque'), 'Hoy {pet} manda a Lumi un mensaje sin signos: «hoy hace sol vamos al parque». ¿Invitación o grito?'),
    show('lng-sentence', sen('Hoy hace sol. ¿Vamos al parque?'), 'Lumi le ayuda a ponerlos. Los signos cambian cómo se lee la frase, como una voz que para o pregunta.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('Hoy hace sol.', '.'), 'El punto (.) va al final de una frase y la voz para.'),
    show('lng-sentence', sen('Hoy hace sol, vamos al parque.', ','), 'La coma (,) hace una pausa corta dentro de la frase.'),
    show('lng-sentence', sen('¿Vienes al parque?'), 'Las preguntas empiezan con ¿ y acaban con ?, y la voz sube al final.'),
    show('lng-sentence', sen('¡Qué sorpresa!'), 'Las exclamaciones empiezan con ¡ y acaban con !, y la voz se nota más.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Lee la frase con voz: ¿para, pregunta o se alegra?'), '¡Te toca! Escribe la frase con sus signos.', { skills: [lenguaSkill('orto', 'signos', 'punto')] }),
    tryIt('lng-sentence', rule('Lee la frase con voz: ¿para, pregunta o se alegra?'), '¡Otra! Las pausas también llevan signo: piensa dónde para la voz.', { skills: [lenguaSkill('orto', 'signos', 'punto')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Lee la frase con voz: ¿para, pregunta o se alegra?'), '¡Tu turno! Escucha la frase en tu cabeza y pon sus signos.', { skills: [lenguaSkill('orto', 'signos', 'coma')] }),
    tryIt('lng-sentence', rule('Lee la frase con voz: ¿para, pregunta o se alegra?'), '¡Tu turno! Recuerda: las preguntas se abren con ¿.', { skills: [lenguaSkill('orto', 'signos', 'pregunta')] }),
    tryIt('lng-sentence', rule('Lee la frase con voz: ¿para, pregunta o se alegra?'), '¡Tu turno! Sin pistas: pon todos los signos.', { skills: [lenguaSkill('orto', 'signos', 'exclamacion')] }),
  ],
  cierre: show('lng-sentence', sen('¡Qué bien, Lumi! ¿Vienes al parque?'), 'El punto para, la coma pausa, y ¿? y ¡! marcan pregunta y exclamación (sorpresa, alegría, enfado).'),
})

/* ------------------------------------------------------------------ vocabulario */

const abecedario = clase({
  id: 'lng3-abecedario',
  topicId: 'lng-abecedario',
  title: 'Abecedario y diccionario',
  para: [
    show('lng-sentence', sen('gato · abeja · casa · dado'), 'Hoy {pet} tiró el diccionario del cole al charco. Las palabras están en desorden.'),
    show('lng-sentence', sen('a · b · c · d · e · f · g'), 'Lumi le explica que el diccionario ordena las palabras con el abecedario, de la a a la z.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('a · b · c · d · e · f · g'), 'El abecedario va en orden fijo: primero la a, luego la b, y así hasta la z.'),
    show('lng-sentence', sen('casa · cuna · dado'), 'Se ordenan por la primera letra: casa y cuna empiezan por c, y dado por d.'),
    show('lng-sentence', sen('casa · cuna'), 'Si empiezan igual, miramos la segunda letra: la a va antes que la u.'),
    show('lng-sentence', sen('nado · ñandú · oso'), 'La ñ va después de la n y antes de la o: nado, ñandú, oso.'),
    show('lng-sentence', sen('ola · oso · oveja'), 'Ola, oso y oveja empiezan igual: la l va antes que la s, y la s antes que la v.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('a · b · c · d · e'), '¡Te toca! Ordena las palabras por la primera letra.', { skills: [lenguaSkill('voc', 'abecedario')] }),
    tryIt('lng-sentence', rule('a · b · c · d · e'), '¡Otra! Si empiezan igual, mira la segunda letra.', { skills: [lenguaSkill('voc', 'abecedario')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('a · b · c · d · e'), '¡Tu turno! Ordena las palabras como en un diccionario.', { skills: [lenguaSkill('voc', 'abecedario')] }),
    tryIt('lng-sentence', rule('a · b · c · d · e'), '¡Tu turno! Sin pistas: primero la primera letra.', { skills: [lenguaSkill('voc', 'abecedario')] }),
    tryIt('lng-sentence', rule('a · b · c · d · e'), '¡Tu turno! Sin pistas: ¿y si empiezan igual?', { skills: [lenguaSkill('voc', 'abecedario')] }),
  ],
  cierre: show('lng-sentence', sen('ola · oso · oveja'), 'En el diccionario las palabras van por la primera letra, y si empiezan igual, por la segunda.'),
})

const sinonimosAntonimos = clase({
  id: 'lng3-sinonimos-antonimos',
  topicId: 'lng-sinonimos-antonimos',
  title: 'Sinónimos y antónimos',
  para: [
    show('lng-sentence', sen('Mi casa es grande. Tu casa es enorme.'), 'Hoy {pet} y Lumi juegan a decir palabras que significan lo mismo, o lo contrario.'),
    show('lng-sentence', sen('triste = alegre'), 'Pero luego {pet} dice que «triste» y «alegre» significan lo mismo. Lumi suspira: eso no cuadra.'),
  ],
  ejemplo: [
    show('lng-sentence', sen('gordo = grueso'), 'Los sinónimos son palabras distintas que significan lo mismo.'),
    show('lng-sentence', sen('bueno ≠ malo'), 'Los antónimos son palabras que significan lo contrario.'),
    show('lng-sentence', sen('El gato está gordo. El gato está grueso.'), 'Si cambiamos una palabra por su sinónimo, la frase dice lo mismo.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('= lo mismo · ≠ lo contrario'), '¡Te toca! ¿Significa lo mismo o lo contrario?', { skills: [lenguaSkill('voc', 'sinonimos')] }),
    tryIt('lng-sentence', rule('= lo mismo · ≠ lo contrario'), '¡Otra! Busca la palabra que significa lo mismo.', { skills: [lenguaSkill('voc', 'sinonimos')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('= lo mismo · ≠ lo contrario'), '¡Tu turno! Fíjate: ¿lo mismo o lo contrario?', { skills: [lenguaSkill('voc', 'sinonimos')] }),
    tryIt('lng-sentence', rule('= lo mismo · ≠ lo contrario'), '¡Tu turno! Busca la palabra que significa lo contrario.', { skills: [lenguaSkill('voc', 'antonimos')] }),
    tryIt('lng-sentence', rule('= lo mismo · ≠ lo contrario'), '¡Tu turno! Sin pistas: ¿lo contrario?', { skills: [lenguaSkill('voc', 'antonimos')] }),
  ],
  cierre: show('lng-sentence', sen('gordo = grueso · bueno ≠ malo'), 'Los sinónimos significan lo mismo, como gordo y grueso, y los antónimos lo contrario, como bueno y malo.'),
})

const familias = clase({
  id: 'lng3-familias',
  topicId: 'lng-familias',
  title: 'Familias de palabras',
  para: [
    show('lng-sentence', sen('pan · pato'), 'Hoy {pet} dice que «pato» es de la familia de «pan», porque empieza igual. ¡Los patos no hacen pan!'),
    show('lng-sentence', sen('pan · panadería · panadero'), 'Lumi le explica que una familia de palabras comparte una raíz: la parte que se repite en todas.'),
  ],
  ejemplo: [
    show('lng-word', wd('panadería', 'pan+adería', 'pan'), 'La raíz de panadería es pan: la parte que no cambia.'),
    show('lng-word', wd('panadero', 'pan+adero', 'pan'), 'Panadero también tiene la raíz pan: es de la misma familia.'),
    show('lng-word', wd('pato', 'pa-to'), 'Pato empieza igual, pero no tiene la raíz pan: no es de la familia.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('¿Tiene la misma raíz?'), '¡Te toca! Busca la palabra con la misma raíz.', { skills: [lenguaSkill('voc', 'familias')] }),
    tryIt('lng-sentence', rule('¿Tiene la misma raíz?'), '¡Otra! Que empiece igual no basta: mira la raíz.', { skills: [lenguaSkill('voc', 'familias')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('¿Tiene la misma raíz?'), '¡Tu turno! Busca la raíz que se repite.', { skills: [lenguaSkill('voc', 'familias')] }),
    tryIt('lng-sentence', rule('¿Tiene la misma raíz?'), '¡Tu turno! Sin pistas: ¿es de la misma familia?', { skills: [lenguaSkill('voc', 'familias')] }),
    tryIt('lng-sentence', rule('¿Tiene la misma raíz?'), '¡Tu turno! Cuidado con las palabras que solo empiezan igual.', { skills: [lenguaSkill('voc', 'familias')] }),
  ],
  cierre: show('lng-word', wd('panadería', 'pan+adería', 'pan'), 'Las palabras de una familia comparten la raíz, la parte que no cambia.'),
})

const aumentativosDiminutivos = clase({
  id: 'lng3-aumentativos-diminutivos',
  topicId: 'lng-aumentativos-diminutivos',
  title: 'Diminutivos y aumentativos',
  para: [
    show('lng-sentence', sen('Quiero un perro… ¿grande o pequeño?'), 'Para el cumpleaños de Lumi, {pet} quiere un perro. No sabe si de tamaño armario o de tamaño calcetín.'),
    show('lng-sentence', sen('casa · casita · casona'), 'Lumi dice que la última vocal cambia el tamaño: unas palabras son pequeñas y otras, grandes.'),
  ],
  ejemplo: [
    show('lng-word', wd('casita', 'cas+ita', 'ita'), 'Casita: la última vocal de casa cambia por -ita. Es una casa pequeña y cariñosa.'),
    show('lng-word', wd('casona', 'cas+ona', 'ona'), 'Casona: la última vocal de casa cambia por -ona. Es una casa grande.'),
    show('lng-word', wd('gatito', 'gat+ito', 'ito'), 'Con gato, la última vocal cambia por -ito: gatito, pequeño y cariñoso.'),
    show('lng-sentence', sen('gato → gatazo · mano → manota · libro → librote'), 'Para lo grande, la última vocal cambia por -azo, -ota u -ote.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Pequeño: -ito, -ita · Grande: -ona, -ote, -ota, -azo'), '¡Te toca! Escribe el diminutivo: la forma pequeña y cariñosa.', { skills: [lenguaSkill('voc', 'diminutivos')] }),
    tryIt('lng-sentence', rule('Pequeño: -ito, -ita · Grande: -ona, -ote, -ota, -azo'), '¡Otra! Cambia la última vocal por -ito o -ita.', { skills: [lenguaSkill('voc', 'diminutivos')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Pequeño: -ito, -ita · Grande: -ona, -ote, -ota, -azo'), '¡Tu turno! Escribe el diminutivo sin pistas.', { skills: [lenguaSkill('voc', 'diminutivos')] }),
    tryIt('lng-sentence', rule('Pequeño: -ito, -ita · Grande: -ona, -ote, -ota, -azo'), '¡Tu turno! Fíjate en si la palabra quiere decir grande o pequeña.', { skills: [lenguaSkill('voc', 'aumentativos')] }),
    tryIt('lng-sentence', rule('Pequeño: -ito, -ita · Grande: -ona, -ote, -ota, -azo'), '¡Tu turno! Sin pistas: ¿qué terminación da una forma grande?', { skills: [lenguaSkill('voc', 'aumentativos')] }),
  ],
  cierre: show('lng-sentence', sen('casa · casita · casona'), 'Cambia la última vocal: -ito o -ita para lo pequeño; -ona, -ote, -ota o -azo para lo grande.'),
})

const compuestas = clase({
  id: 'lng3-compuestas',
  topicId: 'lng-compuestas',
  title: 'Palabras compuestas',
  para: [
    show('lng-sentence', sen('abre + latas = abrelatas'), 'Hoy {pet} ha inventado una máquina que abre latas. Le pone un nombre sencillo: junta dos palabras.'),
    show('lng-sentence', sen('cumple + años = cumpleaños'), 'Lumi explica: al unir dos palabras para formar una nueva, la palabra es compuesta. ¡Hasta cumpleaños!'),
  ],
  ejemplo: [
    show('lng-word', wd('abrelatas', 'abre+latas'), 'Abrelatas se forma con dos palabras: abre y latas.'),
    show('lng-word', wd('sacacorchos', 'saca+corchos'), 'Sacacorchos: saca + corchos. La palabra nueva dice para qué sirve.'),
    show('lng-word', wd('lavaplatos', 'lava+platos'), 'Lavaplatos: lava + platos, lo que lava los platos. Las dos piezas juntas dan una palabra nueva.'),
  ],
  guiada: [
    tryIt('lng-sentence', rule('Dos palabras juntas forman una nueva'), '¡Te toca! Piensa qué hacen las dos piezas juntas.', { skills: [lenguaSkill('voc', 'compuestas')] }),
    tryIt('lng-sentence', rule('Dos palabras juntas forman una nueva'), '¡Otra! Busca la palabra que se forma al unir las dos.', { skills: [lenguaSkill('voc', 'compuestas')] }),
  ],
  sola: [
    tryIt('lng-sentence', rule('Dos palabras juntas forman una nueva'), '¡Tu turno! Une las dos piezas en tu cabeza.', { skills: [lenguaSkill('voc', 'compuestas')] }),
    tryIt('lng-sentence', rule('Dos palabras juntas forman una nueva'), '¡Tu turno! Sin pistas: ¿qué palabra se forma?', { skills: [lenguaSkill('voc', 'compuestas')] }),
    tryIt('lng-sentence', rule('Dos palabras juntas forman una nueva'), '¡Tu turno! Sin pistas: piensa para qué sirve.', { skills: [lenguaSkill('voc', 'compuestas')] }),
  ],
  cierre: show('lng-word', wd('rompecabezas', 'rompe+cabezas'), 'Una palabra compuesta se forma uniendo dos palabras, como rompe + cabezas.'),
})

/** One class for every grammar, spelling and vocabulary topic of the Lengua syllabus (reading and writing have none). */
export const LENGUA_CLASSES: ClassDef[] = [
  silabas, sustantivo, articulo, adjetivo, verbo, oracion,
  mayusculas, cqu, gGu, rRr, mpMb, tonica, signos,
  abecedario, sinonimosAntonimos, familias, aumentativosDiminutivos, compuestas,
]
