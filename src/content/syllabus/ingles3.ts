/* Temario de Inglés de 3.º de Primaria como datos (docs/superpowers/specs/2026-11-06-ingles-3-design.md, tabla de bloques).
   Doce bloques para el informe del adulto; el orden de enseñanza son ocho etapas en tres trimestres, sin mundo de la aventura.
   Cada tema es una destreza `eng:<área>:<tema>[:<nivel>]` (src/engine/skills.ts): `voc:<tema>` son las palabras de un tema de
   src/engine/ingles/words.ts, `frase:<id>` las frases, `num:` los números y sus operaciones. Los temas con niveles van en orden
   de menos a más. En los niveles de «rungs», `numeros` es la palabra escrita, sin dibujo ni objeto. */
import { englishSkill } from '@/engine/skills'
import type { EnglishTheme } from '@/engine/ingles/words'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusBlock, SyllabusStage, SyllabusTopic } from './model'
import { withStageTerms } from './helpers'

const voc = (theme: EnglishTheme): SkillKey => englishSkill('voc', theme)
const frase = (id: string, level?: string): SkillKey => englishSkill('frase', id, level)
const num = (item: string, level?: string): SkillKey => englishSkill('num', item, level)

const topic = (id: string, name: string, skills: SkillKey[], rungs: SyllabusTopic['rungs'], ordered = false): SyllabusTopic => ({
  id: `eng-${id}`,
  name,
  skills,
  status: 'disponible',
  rungs,
  ...(ordered ? { ordered: true as const } : {}),
})

const BLOCKS: SyllabusBlock[] = [
  {
    id: 'saludos',
    name: 'Saludos y yo',
    topics: [
      topic('saludos', 'Saludos y yo', [voc('saludos'), frase('saludos')], {
        concreto: 'Tarjetas de saludo que se dicen con la mano: hello, goodbye', dibujo: 'Un diálogo con dos dibujos de personajes que se saludan', numeros: 'Las frases escritas: What\'s your name? I\'m…', uso: 'Presentarse y decir la edad: How old are you? I\'m eight',
      }),
    ],
  },
  {
    id: 'numeros',
    name: 'Números',
    topics: [
      topic('num-0-20', 'Números del 0 al 20', [num('0-20')], {
        concreto: 'Dedos y fichas con su número: one, two…', dibujo: 'Una fila de cuadros con el número escrito debajo', numeros: 'La cifra y la palabra juntas: 7, seven', uso: 'Contar objetos de la clase en inglés',
      }),
      topic('num-decenas', 'Decenas: 30 a 100', [num('decenas')], {
        concreto: 'Bolsas de diez fichas: las decenas', dibujo: 'Decenas dibujadas en columnas de diez', numeros: 'La decena escrita: thirty, forty, fifty', uso: 'Decir cuántos caramelos hay en cada bolsa',
      }),
      topic('num-21-100', 'Del 21 al 100', [num('21-100')], {
        concreto: 'Decenas y unidades con fichas: thirty-two', dibujo: 'Una tabla de cien con la palabra escrita debajo', numeros: 'Números compuestos: twenty-one, sixty-five', uso: 'Leer en voz alta el número de un precio',
      }),
      topic('ops', 'Plus, minus y times', [num('ops', 'plus'), num('ops', 'minus'), num('ops', 'times')], {
        concreto: 'Fichas que se juntan (plus), se quitan (minus) o se agrupan (times)', dibujo: 'Dos grupos de dibujos con el signo escrito entre ellos', numeros: 'La operación escrita: two plus three is five', uso: 'Juego de números: resolver retos con plus, minus y times',
      }, true),
    ],
  },
  {
    id: 'colores',
    name: 'Colores y formas',
    topics: [
      topic('colores', 'Colores y formas', [voc('colores')], {
        concreto: 'Objetos de colores: a red ball, a blue cup', dibujo: 'Un gato para colorear con su color escrito al lado', numeros: 'La palabra del color escrita: red, blue, green', uso: 'Colorear siguiendo una orden: colour the cat red',
      }),
    ],
  },
  {
    id: 'animales',
    name: 'Animales',
    topics: [
      topic('animales', 'Animales', [voc('animales'), frase('its-a')], {
        concreto: 'Figuras de animales: a cat, a dog', dibujo: 'Un animal dibujado con su nombre al lado', numeros: 'La frase escrita: It\'s a cat. It\'s big.', uso: 'Describir el animal de una historia: It\'s big / It\'s small',
      }),
    ],
  },
  {
    id: 'familia',
    name: 'Familia',
    topics: [
      topic('familia', 'Familia', [voc('familia'), frase('this-is-my')], {
        concreto: 'Fotos de familia con su nombre: mum, dad', dibujo: 'Un árbol de familia con las palabras escritas', numeros: 'La frase escrita: This is my mum.', uso: 'Presentar a alguien de la familia: This is my brother',
      }),
    ],
  },
  {
    id: 'comida',
    name: 'Comida',
    topics: [
      topic('comida', 'Comida', [voc('comida'), frase('i-like'), frase('can-i-have')], {
        concreto: 'Tarjetas de fruta, verdura y comidas', dibujo: 'Un personaje con lo que le gusta dibujado', numeros: 'La frase escrita: I like apples. Can I have a juice, please?', uso: 'Pedir algo en una tienda o en la cantina',
      }),
    ],
  },
  {
    id: 'ropa',
    name: 'Ropa',
    topics: [
      topic('ropa', 'Ropa', [voc('ropa'), frase('im-wearing')], {
        concreto: 'Prendas para vestir a un muñeco: a T-shirt, shoes', dibujo: 'Un personaje vestido con su ropa escrita al lado', numeros: 'La frase escrita: I\'m wearing red shoes.', uso: 'Vestir al compañero siguiendo una orden',
      }),
    ],
  },
  {
    id: 'cole',
    name: 'El cole',
    topics: [
      topic('cole', 'El cole', [voc('cole'), frase('classroom')], {
        concreto: 'Objetos del estuche: a pencil, a rubber', dibujo: 'La clase dibujada con cada objeto escrito', numeros: 'La orden escrita: Sit down. Open your book.', uso: 'Obedecer las órdenes de la clase',
      }),
    ],
  },
  {
    id: 'casa',
    name: 'La casa',
    topics: [
      topic('casa', 'La casa', [voc('casa'), frase('where-is', 'in'), frase('where-is', 'on'), frase('where-is', 'under')], {
        concreto: 'Un objeto escondido en una caja: in, on, under', dibujo: 'Un plano de la casa con objetos dibujados', numeros: 'La pregunta escrita: Where\'s the cat? It\'s under the bed.', uso: 'Buscar objetos en un dibujo de la casa',
      }, true),
    ],
  },
  {
    id: 'cuerpo',
    name: 'El cuerpo',
    topics: [
      topic('cuerpo', 'El cuerpo', [voc('cuerpo'), frase('ive-got')], {
        concreto: 'Señalar las partes de un muñeco: head, arms, legs', dibujo: 'Una figura con las partes escritas', numeros: 'La frase escrita: I\'ve got two arms.', uso: 'Describir un personaje: I\'ve got a big head',
      }),
    ],
  },
  {
    id: 'tiempo',
    name: 'El tiempo y las estaciones',
    topics: [
      topic('tiempo', 'El tiempo y las estaciones', [voc('tiempo'), frase('weather')], {
        concreto: 'Tarjetas del tiempo: sunny, rainy, cold', dibujo: 'Un cielo dibujado con el tiempo escrito debajo', numeros: 'La pregunta escrita: What\'s the weather like? It\'s sunny.', uso: 'Contar qué tiempo hace hoy',
      }),
    ],
  },
  {
    id: 'dias',
    name: 'Días y meses',
    topics: [
      topic('dias', 'Días y meses', [voc('dias'), frase('what-day')], {
        concreto: 'Tarjetas de los días de la semana, en orden', dibujo: 'Un calendario de la semana con los días escritos', numeros: 'La pregunta escrita: What day is it today? It\'s Monday.', uso: 'Completar el calendario de la semana',
      }),
    ],
  },
]

/** Teaching order: eight stages over three trimesters (3, 3 and 2 stages), easy to hard, each topic once. */
export const INGLES3_STAGES: SyllabusStage[] = [
  // 1.er trimestre
  { id: 'etapa-1', term: 1, topics: ['eng-saludos', 'eng-num-0-20', 'eng-colores'] },
  { id: 'etapa-2', term: 1, topics: ['eng-num-decenas', 'eng-animales', 'eng-familia'] },
  { id: 'etapa-3', term: 1, topics: ['eng-num-21-100', 'eng-ops'] },
  // 2.º trimestre
  { id: 'etapa-4', term: 2, topics: ['eng-comida'] },
  { id: 'etapa-5', term: 2, topics: ['eng-ropa', 'eng-cole'] },
  { id: 'etapa-6', term: 2, topics: ['eng-casa'] },
  // 3.er trimestre
  { id: 'etapa-7', term: 3, topics: ['eng-cuerpo', 'eng-tiempo'] },
  { id: 'etapa-8', term: 3, topics: ['eng-dias'] },
]

export const INGLES3_SYLLABUS: Syllabus = withStageTerms({
  id: 'ingles-3-primaria',
  course: 3,
  blocks: BLOCKS,
  stages: INGLES3_STAGES,
})
