/* Clases de Inglés de 3.º: una por tema del temario (src/content/syllabus/ingles3.ts). Cada clase, en cinco fases: Lumi lo
   explica en español (para), ejemplos que cambian una cosa cada vez (ejemplo), dos prácticas guiadas con pistas (guiada,
   la de la primera destreza del tema), tres prácticas sin pistas (sola) y una frase que resume la regla (cierre).
   Las palabras en inglés van entre asteriscos, «*cat*»: la voz inglesa las dice (src/audio/sayMixed.ts), y el texto de
   pantalla las muestra sin asteriscos. Ninguna palabra inglesa va sin asterisco en el texto en español (lo comprueba
   ingles3.test.ts). Las prácticas de inglés se generan con sus destrezas; las de oír solo sirven con sonido (ops). */
import { show, tryIt } from '@/content/lessons/dsl'
import { englishSkill } from '@/engine/skills'
import type { ExerciseKind, SkillKey } from '@/types'
import { clase, type ClassDef } from './dsl'

type Params = Record<string, number | string>

/** Parámetros de una palabra (eng-word): dibujo opcional, la palabra en inglés y su significado en español. */
const word = (emoji: string, en: string, es: string): Params => ({ emoji, en, es })
/** Parámetros de un número (eng-number): la cifra y su palabra en inglés. */
const num = (n: number, en: string): Params => ({ n, en })
/** Parámetros de una frase o una regla en grande (big-text), con su traducción debajo. */
const big = (text: string, sub?: string): Params => ({ text, ...(sub ? { sub } : {}) })

const voc = (theme: string): SkillKey => englishSkill('voc', theme)
const frase = (id: string, level?: string): SkillKey => englishSkill('frase', id, level)
const numSkill = (item: string, level?: string): SkillKey => englishSkill('num', item, level)

/** Una práctica de la fase guiada o de la sola: el enunciado y la destreza con sus tipos de ejercicio. */
const practica = (text: string, skills: SkillKey[], kinds?: ExerciseKind[]) =>
  tryIt('big-text', undefined, text, kinds ? { skills, kinds } : { skills })

/* ------------------------------------------------------------------ saludos y números */

const saludos = clase({
  id: 'eng3-saludos',
  topicId: 'eng-saludos',
  title: 'Saludos y despedidas',
  para: [
    show('eng-word', word('', 'hello', 'hola'), 'Hoy {pet} quiere saludar a Lumi, pero se le traba la lengua. Lumi le sopla la palabra mágica: *hello*. Significa «hola». ¡Hola, hola, hola!'),
    show('eng-word', word('', 'goodbye', 'adiós'), 'Para despedirse se dice *goodbye*: «adiós». Si es hasta luego, también vale *bye*, que es más corto y más rápido.'),
  ],
  ejemplo: [
    show('eng-word', word('', 'good morning', 'buenos días'), 'Hay saludos para cada hora del día. Por la mañana se dice *good morning*: «buenos días».'),
    show('eng-word', word('', 'good afternoon', 'buenas tardes'), 'Después de comer, cuando ya es de tarde, se dice *good afternoon*: «buenas tardes».'),
    show('eng-word', word('', 'good night', 'buenas noches'), 'Y cuando se apaga la luz, *good night*: «buenas noches». La regla: *good* y luego la parte del día.'),
    show('eng-word', word('', 'thank you', 'gracias'), '«Gracias» se dice *thank you*. Y para pedir algo con educación se añade *please*, que significa «por favor».'),
  ],
  guiada: [
    practica('¡Te toca! Une cada palabra en inglés con lo que significa en español.', [voc('saludos')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el saludo o la despedida que sale.', [voc('saludos')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase con la palabra que falta.', [frase('saludos')], ['eng-complete']),
    practica('¡Tu turno! Ordena las letras para formar la palabra.', [voc('saludos')], ['eng-scramble']),
    practica('¡Tu turno! Sin ayuda: escribe el saludo que se dice por la mañana.', [voc('saludos')], ['eng-write-word']),
  ],
  cierre: show('eng-word', word('', 'hello', 'hola'), 'La regla: cada saludo tiene su momento del día. Si dudas, di *hello*: sirve casi siempre.'),
})

const num020 = clase({
  id: 'eng3-num-0-20',
  topicId: 'eng-num-0-20',
  title: 'Números del 0 al 20',
  para: [
    show('eng-number', num(7, 'seven'), '{pet} cuenta las pelotas del parque y se hace un lío con el 7. Lumi le dice que en inglés se cuentan con palabras cortas.'),
    show('eng-number', num(0, 'zero'), 'El cero se dice *zero*. Y ya tienes el primer número: cuenta con los dedos mientras lo dices.'),
  ],
  ejemplo: [
    show('eng-number', num(1, 'one'), 'Del uno al cinco: *one*, *two*, *three*, *four*, *five*. Cada uno tiene su palabra, sin trucos.'),
    show('eng-number', num(10, 'ten'), 'El diez es *ten*. Del uno al diez sabes ya diez palabras. ¡Eso es un buen comienzo!'),
    show('eng-number', num(13, 'thirteen'), 'Del trece al diecinueve, todos acaban en *-teen*: *thirteen*, *fourteen*, *fifteen*. *Teen* suena a *ten*: es como un sombrero de diez.'),
    show('eng-number', num(18, 'eighteen'), 'Fíjate en el *eighteen*: lleva *eight*, que es el ocho, con el final *-teen*. El 18 es el 8 con su sombrero.'),
  ],
  guiada: [
    practica('¡Te toca! Escribe con letras el número que sale.', [numSkill('0-20')], ['eng-num-write']),
    practica('¡Otra! Si el número es del trece al diecinueve, piensa en el final *-teen*.', [numSkill('0-20')], ['eng-num-write']),
  ],
  sola: [
    practica('¡Tu turno! Sin ayuda: escribe el número en inglés.', [numSkill('0-20')], ['eng-num-write']),
    practica('¡Tu turno! Recuerda la regla del *-teen*: ¿es un número del trece al diecinueve?', [numSkill('0-20')], ['eng-num-write']),
    practica('¡Tu turno! Un número más, sin pistas.', [numSkill('0-20')], ['eng-num-write']),
  ],
  cierre: show('eng-number', num(15, 'fifteen'), 'La regla: del cero al veinte, cada número tiene su nombre. Del trece al diecinueve, todos acaban en *-teen*, como *fifteen*.'),
})

const decenas = clase({
  id: 'eng3-num-decenas',
  topicId: 'eng-num-decenas',
  title: 'Decenas: 30, 40… 90',
  para: [
    show('eng-number', num(30, 'thirty'), '{pet} ha ganado caramelos y quiere contarlos de diez en diez. Mira: el 30 se dice *thirty*.'),
    show('eng-number', num(40, 'forty'), 'Las decenas tienen otro final: *-ty*. Es como el cartel que dice «¡Esto son decenas!».'),
  ],
  ejemplo: [
    show('eng-number', num(50, 'fifty'), 'El cincuenta es *fifty*: *five*, el cinco, pierde una parte y se queda en *fifty* con el final *-ty*.'),
    show('eng-number', num(60, 'sixty'), 'Del sesenta al noventa sigue la misma regla: *sixty*, *seventy*, *eighty*, *ninety*. Todos acaban en *-ty*.'),
    show('eng-number', num(30, 'thirty'), 'No te confundas: *thirteen* es el trece, con *-teen*. *Thirty* es el treinta, con *-ty*. Son primos, pero no son iguales.'),
    show('eng-number', num(80, 'eighty'), '¿Te acuerdas de *eight*, el ocho? El ochenta es *eighty*: ocho con la terminación de las decenas.'),
  ],
  guiada: [
    practica('¡Te toca! Escribe con letras la decena que sale.', [numSkill('decenas')], ['eng-num-write']),
    practica('¡Otra! Si el número acaba en *-ty*, es una decena. Escríbela en inglés.', [numSkill('decenas')], ['eng-num-write']),
  ],
  sola: [
    practica('¡Tu turno! Sin ayuda: escribe la decena en inglés.', [numSkill('decenas')], ['eng-num-write']),
    practica('¡Tu turno! Cuidado con el *-teen* y el *-ty*: no son lo mismo.', [numSkill('decenas')], ['eng-num-write']),
    practica('¡Tu turno! Otra decena, sin pistas.', [numSkill('decenas')], ['eng-num-write']),
  ],
  cierre: show('eng-number', num(70, 'seventy'), 'La regla: las decenas acaban en *-ty*. El *-teen* es de los números del trece al diecinueve.'),
})

const num21100 = clase({
  id: 'eng3-num-21-100',
  topicId: 'eng-num-21-100',
  title: 'Números del 21 al 100',
  para: [
    show('eng-number', num(21, 'twenty-one'), 'En la tienda de Lumi hay un peluche de 21 euros. Se dice *twenty-one*: primero la decena, luego un guion y la unidad.'),
    show('eng-number', num(65, 'sixty-five'), 'Lo mismo con el 65: *sixty-five*. La decena va primero, después el guion y el cinco. Así de fácil.'),
  ],
  ejemplo: [
    show('eng-number', num(35, 'thirty-five'), 'Decena primero, unidad después: *thirty-five* es treinta y cinco.'),
    show('eng-number', num(48, 'forty-eight'), 'El cuarenta y ocho es *forty-eight*. Fíjate en el guion: une la decena con la unidad.'),
    show('eng-number', num(10, 'ten'), 'Ojo con el 10 y el 20: son *ten* y *twenty*. Si no tienen unidad, no llevan guion.'),
    show('eng-number', num(99, 'ninety-nine'), 'El 99 es *ninety-nine*: el mayor de los números que se forman con decena y unidad. Y el 100 es *one hundred*.'),
  ],
  guiada: [
    practica('¡Te toca! Escribe con letras el número que sale.', [numSkill('21-100')], ['eng-num-write']),
    practica('¡Otra! Primero la decena, luego un guion y la unidad.', [numSkill('21-100')], ['eng-num-write']),
  ],
  sola: [
    practica('¡Tu turno! Sin ayuda: escribe el número en inglés.', [numSkill('21-100')], ['eng-num-write']),
    practica('¡Tu turno! Si no hay unidad, no hay guion.', [numSkill('21-100')], ['eng-num-write']),
    practica('¡Tu turno! Otro número, sin pistas.', [numSkill('21-100')], ['eng-num-write']),
  ],
  cierre: show('eng-number', num(54, 'fifty-four'), 'La regla: decena, guion y unidad: *fifty-four*. Y si no hay unidad, no hay guion: *twenty*.'),
})

const ops = clase({
  id: 'eng3-ops',
  topicId: 'eng-ops',
  title: 'Más, menos y por: plus, minus, times',
  para: [
    show('big-text', big('two + three = five', 'dos más tres son cinco'), '¡Hoy hacemos cuentas! Lumi empieza con una suma, pero en inglés se dice de otra forma.'),
    show('big-text', big('plus · minus · times', 'y el signo igual se dice «equals»'), '{pet} quiere repartir pegatinas y necesita hacer cuentas en inglés. Lumi le enseña tres palabras: *plus*, *minus* y *times*. Y el signo igual es *equals*.'),
  ],
  ejemplo: [
    show('big-text', big('two plus three equals five', '2 + 3 = 5'), '*Plus* es «más». *Two plus three equals five* es «dos más tres son cinco».'),
    show('big-text', big('five minus two equals three', '5 − 2 = 3'), '*Minus* es «menos». *Five minus two equals three* es «cinco menos dos son tres»: quitas dos a cinco.'),
    show('big-text', big('two times three equals six', '2 × 3 = 6'), '*Times* es «por». *Two times three equals six*: dos grupos de tres, o tres grupos de dos. ¡Seis!'),
    show('big-text', big('three plus four equals seven', '3 + 4 = 7'), 'El resultado va siempre después de *equals*. Así lo lees de corrido, como una frase: «tres más cuatro igual a siete».'),
  ],
  guiada: [
    practica('¡Te toca! Escucha la cuenta en inglés y dime el resultado.', [numSkill('ops', 'plus')]),
    practica('¡Otra! Escucha con atención la palabra del signo: *plus*, *minus* o *times*.', [numSkill('ops', 'plus')]),
  ],
  sola: [
    practica('¡Tu turno! Sin pistas: escucha la resta y resuélvela.', [numSkill('ops', 'minus')]),
    practica('¡Tu turno! Ahora una multiplicación: escucha y piensa en grupos.', [numSkill('ops', 'times')]),
    practica('¡Tu turno! Mezclados: suma, resta o multiplica.', [numSkill('ops', 'plus'), numSkill('ops', 'minus'), numSkill('ops', 'times')]),
  ],
  cierre: show('big-text', big('two plus three equals five', 'plus suma · minus resta · times multiplica · equals es el igual'), 'La regla: *plus* suma, *minus* resta y *times* multiplica. Y *equals* va antes del resultado.'),
})

/* ------------------------------------------------------------------ vocabulario */

const colores = clase({
  id: 'eng3-colores',
  topicId: 'eng-colores',
  title: 'Colores y formas',
  para: [
    show('eng-word', word('🔴', 'red', 'rojo'), '{pet} ha pintado el cielo de rojo, y el pintor de Lumi dice que eso se llama *red*. ¡Qué cielo tan raro!'),
    show('eng-word', word('🔵', 'blue', 'azul'), 'Lumi reparte pinceles: *blue* es azul. Y en la caja también hay *green*, verde, y *yellow*, amarillo.'),
  ],
  ejemplo: [
    show('eng-word', word('🟢', 'green', 'verde'), 'El verde es *green*, como la hierba del parque. Tiene dos *e* seguidas: *gr-ee-n*.'),
    show('eng-word', word('🟡', 'yellow', 'amarillo'), 'El amarillo es *yellow*, como el sol de los dibujos. Es una palabra larga para un color tan alegre.'),
    show('eng-word', word('🔺', 'triangle', 'triángulo'), 'Las formas también tienen nombre: un triángulo es *triangle*, con tres lados y tres esquinas.'),
    show('eng-word', word('⚫', 'black', 'negro'), 'Y para acabar: *black* es negro, y *white* es blanco. ¡El pintor se queda sin pintura!'),
  ],
  guiada: [
    practica('¡Te toca! Une cada color con su palabra en inglés.', [voc('colores')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el color que sale.', [voc('colores')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Busca las parejas: el dibujo y su palabra.', [voc('colores')], ['eng-memory']),
    practica('¡Tu turno! Ordena las letras del color o de la forma.', [voc('colores')], ['eng-scramble']),
    practica('¡Tu turno! Sin pistas: escribe la palabra de la forma o del color.', [voc('colores')], ['eng-write-word']),
  ],
  cierre: show('eng-word', word('⭕', 'circle', 'círculo'), 'La regla: los colores y las formas tienen su palabra en inglés, como *red* o *circle*.'),
})

const animales = clase({
  id: 'eng3-animales',
  topicId: 'eng-animales',
  title: 'Animales',
  para: [
    show('eng-word', word('🐱', 'cat', 'gato'), 'En el zoo de Lumi hay un gato que quiere ser famoso. Se llama *cat*, y no para de maullar en inglés.'),
    show('eng-word', word('🐶', 'dog', 'perro'), 'El perro es *dog*, y ladra en inglés: *woof*. Lumi dice que los animales hablan todos los idiomas, pero el perro es el más ruidoso.'),
  ],
  ejemplo: [
    show('eng-word', word('🐘', 'elephant', 'elefante'), 'El elefante es *elephant*. Es largo de decir, pero es el animal más grande del zoo: *It\'s big*.'),
    show('eng-word', word('🐭', 'mouse', 'ratón'), 'El ratón es *mouse*, y es muy pequeño: *It\'s small*. ¡Ni se ve!'),
    show('eng-word', word('🐦', 'bird', 'pájaro'), 'El pájaro es *bird*. Para decir qué animal es: *It\'s a bird*. Ojo: el *a* va delante del nombre.'),
    show('eng-word', word('🐟', 'fish', 'pez'), 'Un pez es *fish*. Para contar lo que hace: *It\'s a fish. It can swim.* ¡Nada, nada!'),
  ],
  guiada: [
    practica('¡Te toca! Une cada animal con su nombre en inglés.', [voc('animales')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el nombre del animal que sale.', [voc('animales')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase sobre el animal.', [frase('its-a')], ['eng-complete']),
    practica('¡Tu turno! Busca las parejas de los animales.', [voc('animales')], ['eng-memory']),
    practica('¡Tu turno! Sin pistas: qué hace el animal o cómo es.', [frase('its-a')], ['eng-complete']),
  ],
  cierre: show('big-text', big('It\'s a cat. It\'s big.', 'Es un gato. Es grande.'), 'La regla: para decir qué animal es, usa *It\'s a* y el nombre. Y luego, cómo es.'),
})

const familia = clase({
  id: 'eng3-familia',
  topicId: 'eng-familia',
  title: 'La familia',
  para: [
    show('eng-word', word('👩', 'mum', 'mamá'), '{pet} tiene una familia enorme y quiere presentarla a todos. La mamá se dice *mum*, en inglés británico.'),
    show('eng-word', word('👨', 'dad', 'papá'), 'El papá es *dad*. Y la familia de {pet} tiene más miembros: ¡sigue leyendo!'),
  ],
  ejemplo: [
    show('eng-word', word('👵', 'grandma', 'abuela'), 'La abuela es *grandma*, y el abuelo es *grandpa*. Son palabras de cariño, como las de casa.'),
    show('eng-word', word('👶', 'baby', 'bebé'), 'El bebé es *baby*, y es el más pequeño de la familia. ¡Siempre quiere ser el centro de todo!'),
    show('eng-word', word('👦', 'brother', 'hermano'), 'El hermano es *brother* y la hermana es *sister*. Para presentar a alguien, Lumi usa la frase *This is my*.'),
    show('big-text', big('This is my brother.', 'Este es mi hermano.'), 'Para presentar a alguien: *This is my* y después la palabra de la familia. Así de sencillo.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada miembro de la familia con su nombre en inglés.', [voc('familia')], ['eng-match']),
    practica('¡Otra! Escribe en inglés quién es la persona que sale.', [voc('familia')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la presentación.', [frase('this-is-my')], ['eng-complete']),
    practica('¡Tu turno! Busca las parejas de la familia.', [voc('familia')], ['eng-memory']),
    practica('¡Tu turno! Ordena las letras del miembro de la familia.', [voc('familia')], ['eng-scramble']),
  ],
  cierre: show('big-text', big('This is my mum.', 'Esta es mi mamá.'), 'La regla: *This is my* para presentar, y la palabra de la familia después.'),
})

const comida = clase({
  id: 'eng3-comida',
  topicId: 'eng-comida',
  title: 'Comida',
  para: [
    show('eng-word', word('🍎', 'apple', 'manzana'), 'Hoy {pet} tiene hambre, y lo primero que pide en inglés es una *apple*: una manzana.'),
    show('eng-word', word('🍞', 'bread', 'pan'), 'En la cantina de Lumi se pide con educación. Hay palabras de comida como *bread*, el pan, y *milk*, la leche.'),
  ],
  ejemplo: [
    show('eng-word', word('🍌', 'banana', 'plátano'), 'Un plátano es *banana*. Y una manzana, *apple*. Son palabras cortas y muy útiles.'),
    show('eng-word', word('🥛', 'milk', 'leche'), '*Milk* es leche. Para decir lo que te gusta, usa *I like*: *I like milk*.'),
    show('big-text', big('I like apples.', 'Me gustan las manzanas.'), 'Con *I like* dices lo que te gusta. Si hablas de *he* o *she*, la palabra cambia: *She likes* y *He likes*, con una *s*.'),
    show('big-text', big('Can I have some milk, please?', '¿Me das un poco de leche, por favor?'), 'Para pedir algo, di *Can I have* y lo que quieres, y añade *please* al final.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada comida con su nombre en inglés.', [voc('comida')], ['eng-match']),
    practica('¡Otra! Escribe en inglés la comida que sale.', [voc('comida')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase de los gustos.', [frase('i-like')], ['eng-complete']),
    practica('¡Tu turno! Completa la frase para pedir algo.', [frase('can-i-have')], ['eng-complete']),
    practica('¡Tu turno! Ordena las letras de la comida.', [voc('comida')], ['eng-scramble']),
  ],
  cierre: show('eng-word', word('🍰', 'cake', 'tarta'), 'La regla: nombra la comida con su palabra, di lo que te gusta con *I like* y pide con *Can I have…, please?*'),
})

const ropa = clase({
  id: 'eng3-ropa',
  topicId: 'eng-ropa',
  title: 'La ropa',
  para: [
    show('eng-word', word('👕', 'shirt', 'camiseta'), '{pet} ha salido a la calle en pijama. Lumi le enseña la palabra de la camiseta: *shirt*.'),
    show('eng-word', word('👟', 'shoes', 'zapatos'), 'Los zapatos son *shoes*, y van siempre en plural, con la *s*. ¿Ves la *s* al final?'),
  ],
  ejemplo: [
    show('eng-word', word('👖', 'trousers', 'pantalones'), 'Los pantalones son *trousers*. También van en plural: un par de pantalones, dos piernas, una palabra con *s*.'),
    show('eng-word', word('👗', 'dress', 'vestido'), 'El vestido es *dress*. Y el sombrero es *hat*, aunque la bufanda, *scarf*, se usa en invierno.'),
    show('eng-word', word('🧥', 'jacket', 'chaqueta'), 'La chaqueta es *jacket*. Para decir lo que llevas puesto: *I\'m wearing*.'),
    show('big-text', big('I\'m wearing red shoes.', 'Llevo zapatos rojos.'), 'Con *I\'m wearing* dices lo que llevas. Si lo dice otra persona: *She\'s wearing a dress*.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada prenda con su nombre en inglés.', [voc('ropa')], ['eng-match']),
    practica('¡Otra! Escribe en inglés la prenda que sale.', [voc('ropa')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase de lo que llevas puesto.', [frase('im-wearing')], ['eng-complete']),
    practica('¡Tu turno! Busca las parejas de la ropa.', [voc('ropa')], ['eng-memory']),
    practica('¡Tu turno! Ordena las letras de la prenda.', [voc('ropa')], ['eng-scramble']),
  ],
  cierre: show('big-text', big('I\'m wearing a jacket.', 'Llevo una chaqueta.'), 'La regla: *I\'m wearing* para lo que llevas puesto, y la prenda después.'),
})

const cole = clase({
  id: 'eng3-cole',
  topicId: 'eng-cole',
  title: 'El cole',
  para: [
    show('eng-word', word('✏️', 'pencil', 'lápiz'), '{pet} ha llegado al cole sin lápiz. Lumi le enseña la palabra: *pencil*. ¡Qué lío de estuche!'),
    show('eng-word', word('🎒', 'schoolbag', 'mochila'), 'La mochila se dice *schoolbag*: literalmente, bolsa del cole. Muy lógico, ¿verdad?'),
  ],
  ejemplo: [
    show('eng-word', word('📖', 'book', 'libro'), 'El libro es *book*. Es una de las palabras más útiles del cole.'),
    show('eng-word', word('📏', 'ruler', 'regla'), 'La regla es *ruler*: sirve para medir. Y para que la profe se ponga seria, también sirve de regla.'),
    show('eng-word', word('✂️', 'scissors', 'tijeras'), 'Las tijeras son *scissors*, y van siempre en plural, como los pantalones.'),
    show('big-text', big('Sit down, please.', 'Siéntate, por favor.'), 'Las órdenes de clase empiezan por el verbo: *Sit down*, *Open your book*. No hace falta decir quién lo hace.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada objeto del cole con su nombre en inglés.', [voc('cole')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el objeto del estuche que sale.', [voc('cole')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la orden de clase.', [frase('classroom')], ['eng-complete']),
    practica('¡Tu turno! Ordena las letras del objeto.', [voc('cole')], ['eng-scramble']),
    practica('¡Tu turno! Busca las parejas del cole.', [voc('cole')], ['eng-memory']),
  ],
  cierre: show('big-text', big('Open your book, please.', 'Abre tu libro, por favor.'), 'La regla: las órdenes empiezan por el verbo. *Open* es abrir, y *please* hace que suene amable.'),
})

const casa = clase({
  id: 'eng3-casa',
  topicId: 'eng-casa',
  title: 'La casa: in, on, under',
  para: [
    show('eng-word', word('🏠', 'house', 'casa'), '{pet} se ha escondido en casa para jugar al escondite. ¿Dónde está? Eso es lo que vamos a aprender hoy.'),
    show('eng-word', word('🛏️', 'bed', 'cama'), 'Una *bed* es una cama. Y la pregunta para buscar algo es *Where is…?*: ¿dónde está…?'),
  ],
  ejemplo: [
    show('eng-word', word('🚪', 'door', 'puerta'), 'La puerta es *door*. Y la casa, *house*, tiene muchas cosas para esconder.'),
    show('big-text', big('The cat is in the house.', 'El gato está dentro de la casa.'), '*In* significa dentro: el gato está *in* la casa.'),
    show('big-text', big('The book is on the bed.', 'El libro está encima de la cama.'), '*On* significa encima: el libro está *on* la cama, apoyado.'),
    show('big-text', big('The shoes are under the bed.', 'Los zapatos están debajo de la cama.'), '*Under* significa debajo: los zapatos están *under* la cama. Ojo: *in*, *on* y *under* van justo antes del sitio.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada objeto de la casa con su nombre en inglés.', [voc('casa')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el objeto de la casa que sale.', [voc('casa')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase con *in*, *on* o *under*: fíjate en dónde está el objeto.', [frase('where-is', 'in')], ['eng-complete']),
    practica('¡Tu turno! Completa la frase de lo que está encima.', [frase('where-is', 'on')], ['eng-complete']),
    practica('¡Tu turno! Completa la frase de lo que está debajo.', [frase('where-is', 'under')], ['eng-complete']),
  ],
  cierre: show('big-text', big('Where\'s the cat? It\'s under the bed.', '¿Dónde está el gato? Está debajo de la cama.'), 'La regla: *in* dentro, *on* encima, *under* debajo. Y para preguntar: *Where is…?*'),
})

const cuerpo = clase({
  id: 'eng3-cuerpo',
  topicId: 'eng-cuerpo',
  title: 'El cuerpo',
  para: [
    show('eng-word', word('👁️', 'eye', 'ojo'), 'Lumi dice que el cuerpo también tiene su nombre en inglés. Empieza por el ojo: *eye*. Con él se ve hasta el final del pasillo.'),
    show('eng-word', word('👃', 'nose', 'nariz'), 'La nariz es *nose*, y la boca es *mouth*. ¡Cuidado con estornudar en clase!'),
  ],
  ejemplo: [
    show('eng-word', word('👂', 'ear', 'oreja'), 'La oreja es *ear*. Con dos orejas se escucha mejor, pero también se oye mejor cuando alguien habla bajito.'),
    show('eng-word', word('✋', 'hand', 'mano'), 'La mano es *hand*, y el pie es *foot*. Tenemos dos manos y dos pies.'),
    show('big-text', big('I\'ve got two hands.', 'Tengo dos manos.'), 'Para decir lo que tienes usas *I\'ve got*, que es como decir «tengo».'),
    show('big-text', big('He\'s got a long leg.', 'Él tiene una pierna larga.'), 'Con él o ella, cambia a *He\'s got* y *She\'s got*. Y después, la parte del cuerpo.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada parte del cuerpo con su nombre en inglés.', [voc('cuerpo')], ['eng-match']),
    practica('¡Otra! Escribe en inglés la parte del cuerpo que sale.', [voc('cuerpo')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase de lo que tiene una persona.', [frase('ive-got')], ['eng-complete']),
    practica('¡Tu turno! Busca las parejas del cuerpo.', [voc('cuerpo')], ['eng-memory']),
    practica('¡Tu turno! Ordena las letras de la parte del cuerpo.', [voc('cuerpo')], ['eng-scramble']),
  ],
  cierre: show('big-text', big('He\'s got a long leg.', 'Él tiene una pierna larga.'), 'La regla: *I\'ve got* con yo, *He\'s got* con él y *She\'s got* con ella. Luego, la parte del cuerpo.'),
})

const tiempo = clase({
  id: 'eng3-tiempo',
  topicId: 'eng-tiempo',
  title: 'El tiempo y las estaciones',
  para: [
    show('eng-word', word('☀️', 'sun', 'sol'), '{pet} quiere salir a jugar, pero no sabe qué tiempo hace. Lumi le enseña *sun*: el sol que sale en los días buenos.'),
    show('eng-word', word('🌧️', 'rain', 'lluvia'), 'Cuando llueve, es *rain*. Y para decir cómo está el día usamos palabras como *sunny* o *rainy*.'),
  ],
  ejemplo: [
    show('eng-word', word('🌈', 'rainbow', 'arcoíris'), 'Tras la lluvia, a veces sale un *rainbow*: un arcoíris, con sus colores.'),
    show('eng-word', word('❄️', 'snow', 'nieve'), 'La nieve es *snow*. Y para decir que nieva: *It\'s snowy*.'),
    show('big-text', big('What\'s the weather like?', '¿Qué tiempo hace?'), 'Para preguntar qué tiempo hace: *What\'s the weather like?* Para responder: *It\'s sunny*, *It\'s cold*.'),
    show('big-text', big('It\'s summer.', 'Es verano.'), 'Las estaciones son *spring*, *summer*, *autumn* y *winter*. Con *It\'s* dices en cuál estás.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada dibujo del tiempo con su palabra en inglés.', [voc('tiempo')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el tiempo que sale.', [voc('tiempo')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase del tiempo.', [frase('weather')], ['eng-complete']),
    practica('¡Tu turno! Busca las parejas del tiempo.', [voc('tiempo')], ['eng-memory']),
    practica('¡Tu turno! Ordena las letras de la palabra del tiempo.', [voc('tiempo')], ['eng-scramble']),
  ],
  cierre: show('big-text', big('It\'s rainy today.', 'Hoy llueve.'), 'La regla: *It\'s* y después el tiempo: *It\'s sunny*, *It\'s rainy*. Y para la estación, *It\'s winter*.'),
})

const dias = clase({
  id: 'eng3-dias',
  topicId: 'eng-dias',
  title: 'Días y meses',
  para: [
    show('eng-word', word('', 'Monday', 'lunes'), '{pet} ha perdido la cuenta de los días. Lumi dice que la semana empieza el lunes: *Monday*. ¡Y los días llevan mayúscula!'),
    show('eng-word', word('', 'Sunday', 'domingo'), 'El último día de la semana es *Sunday*, el domingo. Es el día de descanso, y {pet} lo sabe muy bien.'),
  ],
  ejemplo: [
    show('eng-word', word('', 'Tuesday', 'martes'), 'El martes es *Tuesday*. Los días y los meses siempre empiezan con mayúscula.'),
    show('eng-word', word('', 'Wednesday', 'miércoles'), 'El miércoles es *Wednesday*. Tiene tres sílabas, así que ¡cuéntalas al decirlo!'),
    show('eng-word', word('', 'October', 'octubre'), 'Los meses también: *October* es octubre. Y *June* es junio.'),
    show('big-text', big('What day is it today? It\'s Monday.', '¿Qué día es hoy? Es lunes.'), 'Para preguntar el día: *What day is it today?* Y para responder: *It\'s Monday*.'),
  ],
  guiada: [
    practica('¡Te toca! Une cada día o mes con su nombre en español.', [voc('dias')], ['eng-match']),
    practica('¡Otra! Escribe en inglés el día que sale.', [voc('dias')], ['eng-write-word']),
  ],
  sola: [
    practica('¡Tu turno! Completa la frase del calendario.', [frase('what-day')], ['eng-complete']),
    practica('¡Tu turno! Ordena las letras del día o del mes.', [voc('dias')], ['eng-scramble']),
    practica('¡Tu turno! Sin pistas: escribe el día de la semana que sale.', [voc('dias')], ['eng-write-word']),
  ],
  cierre: show('big-text', big('Today is Thursday.', 'Hoy es jueves.'), 'La regla: los días y los meses llevan mayúscula. *Today is…* sirve para decir qué día es hoy.'),
})

/** Every English class, in the order of the syllabus. */
export const INGLES_CLASSES: ClassDef[] = [
  saludos, num020, decenas, num21100, ops,
  colores, animales, familia, comida, ropa, cole, casa, cuerpo, tiempo, dias,
]
