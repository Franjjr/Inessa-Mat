/* Temario de Lengua de 3.º de Primaria como datos (docs/curriculum/TEMARIO_PERPLEXITY_3-4.md, y docs/superpowers/specs/
   2026-10-27-lengua-3-design.md). Seis bloques para el informe del adulto; el orden de enseñanza son ocho etapas en tres
   trimestres, sin mundo de la aventura (la de Matemáticas no es suya). Cada tema es una destreza `lng:<área>:<tema>[:<nivel>]`
   (src/engine/skills.ts). Los temas con niveles van en orden de menos a más. En los niveles de «rungs», `numeros` es la
   palabra escrita, sin dibujo ni objeto. */
import { lenguaSkill } from '@/engine/skills'
import type { SkillKey } from '@/types'
import type { Syllabus, SyllabusBlock, SyllabusStage, SyllabusTopic } from './model'
import { withStageTerms } from './helpers'

const topic = (id: string, name: string, skills: SkillKey[], rungs: SyllabusTopic['rungs'], ordered = false): SyllabusTopic => ({
  id: `lng-${id}`,
  name,
  skills,
  status: 'disponible',
  rungs,
  ...(ordered ? { ordered: true as const } : {}),
})

const BLOCKS: SyllabusBlock[] = [
  {
    id: 'gramatica',
    name: 'Gramática',
    topics: [
      topic('silabas', 'Letras, sílabas y palabras', [lenguaSkill('gram', 'silabas')], {
        concreto: 'Fichas de letras que se juntan en sílabas', dibujo: 'Palabras partidas en cajas de sílabas', numeros: 'La palabra escrita con guiones: ca-sa', uso: 'Contar las sílabas de las palabras de una frase',
      }),
      topic('sustantivo', 'Sustantivo: común y propio, género y número', [
        lenguaSkill('gram', 'sustantivo', 'clase'), lenguaSkill('gram', 'sustantivo', 'genero'), lenguaSkill('gram', 'sustantivo', 'numero'),
      ], {
        concreto: 'Objetos de la clase y nombres propios de personas', dibujo: 'Dos cajas: nombres de cosas y nombres propios', numeros: 'El niño y la niña, el gato y los gatos', uso: 'Los sustantivos de una historia',
      }, true),
      topic('articulo', 'Artículo: el, la, los, las, un, una', [lenguaSkill('gram', 'articulo')], {
        concreto: 'Objetos con su artículo delante', dibujo: 'Tarjetas de artículo con el sustantivo', numeros: 'El artículo que cambia con el género y el número', uso: 'Artículo y sustantivo en una frase',
      }),
      topic('adjetivo', 'Adjetivo: cómo es', [lenguaSkill('gram', 'adjetivo')], {
        concreto: 'Objetos que se describen: grande, rojo', dibujo: 'Dibujos con una cualidad escrita al lado', numeros: 'El adjetivo que concuerda con el sustantivo', uso: 'Describir a un personaje de la historia',
      }),
      topic('verbo', 'Verbo: presente, pasado y futuro', [
        lenguaSkill('gram', 'verbo', 'presente'), lenguaSkill('gram', 'verbo', 'pasado'), lenguaSkill('gram', 'verbo', 'futuro'),
      ], {
        concreto: 'Acciones con mímica: salta, saltó, saltará', dibujo: 'Una línea del tiempo con tres casillas', numeros: 'Cambiar el tiempo de una frase', uso: 'Contar lo que pasó y lo que pasará',
      }, true),
      topic('oracion', 'Oración: sujeto y predicado', [lenguaSkill('gram', 'oracion', 'sujeto'), lenguaSkill('gram', 'oracion', 'predicado')], {
        concreto: 'Tarjetas de quién hace la acción y qué hace', dibujo: 'La frase partida en dos colores', numeros: 'Encontrar quién hace la acción', uso: 'Frases de una historia, partidas en sujeto y predicado',
      }, true),
    ],
  },
  {
    id: 'ortografia',
    name: 'Ortografía',
    topics: [
      topic('mayusculas', 'Mayúsculas: al empezar y en los nombres propios', [lenguaSkill('orto', 'mayusculas')], {
        concreto: 'Letras grandes y pequeñas en fichas', dibujo: 'Frases con el primer hueco marcado', numeros: 'La frase escrita: ¿qué letra va en mayúscula?', uso: 'Nombres propios de una historia',
      }),
      topic('c-qu', 'c y qu: ca, co, cu, que, qui', [lenguaSkill('orto', 'c-qu')], {
        concreto: 'Sonidos «ca» y «que» con fichas', dibujo: 'Dibujos con la palabra escrita debajo', numeros: 'La letra que falta: _asa', uso: 'Palabras con c y qu en un texto',
      }),
      topic('g-gu', 'g, gu y gü: ga, gue, gui, güe', [lenguaSkill('orto', 'g-gu')], {
        concreto: 'Sonidos «ga» y «gue» con fichas', dibujo: 'Dibujos con la palabra escrita debajo', numeros: 'La letra que falta: gu_tarra, ci_üeña', uso: 'Palabras con g, gu y gü en un texto',
      }),
      topic('r-rr', 'r y rr: entre vocales y al principio', [lenguaSkill('orto', 'r-rr')], {
        concreto: 'La r suave y la rr fuerte con fichas', dibujo: 'Dibujos de palabras con r y rr', numeros: 'Escribir r o rr: ho_a (del reloj), to_e (edificio alto)', uso: 'Palabras con r y rr en una historia',
      }),
      topic('mp-mb', 'mp y mb', [lenguaSkill('orto', 'mp-mb')], {
        concreto: 'Fichas de m con p o con b', dibujo: 'Dibujos con la palabra escrita debajo', numeros: 'Escribir mp o mb: ca_ana', uso: 'Palabras con mp y mb en un texto',
      }),
      topic('tonica-atona', 'Sílaba tónica y sílaba átona', [lenguaSkill('orto', 'tonica')], {
        concreto: 'Palmadas: una sílaba se dice más fuerte', dibujo: 'Palabras con la sílaba fuerte marcada', numeros: 'Separar las sílabas y marcar la fuerte', uso: 'Leer en voz alta con la sílaba fuerte',
      }),
      topic('signos', 'Punto, coma, ¿? y ¡!', [
        lenguaSkill('orto', 'signos', 'punto'), lenguaSkill('orto', 'signos', 'coma'), lenguaSkill('orto', 'signos', 'pregunta'), lenguaSkill('orto', 'signos', 'exclamacion'),
      ], {
        concreto: 'Tarjetas de signos que se leen con la voz', dibujo: 'Una frase con las pausas marcadas', numeros: 'Poner ¿? o ¡! al principio y al final', uso: 'Leer un diálogo con sus signos',
      }, true),
    ],
  },
  {
    id: 'vocabulario',
    name: 'Vocabulario',
    topics: [
      topic('abecedario', 'Abecedario y diccionario', [lenguaSkill('voc', 'abecedario')], {
        concreto: 'Tarjetas de letras para ordenar', dibujo: 'Una fila de letras del abecedario', numeros: 'Ordenar palabras por la primera letra', uso: 'Buscar una palabra en un mini diccionario',
      }),
      topic('sinonimos-antonimos', 'Sinónimos y antónimos', [lenguaSkill('voc', 'sinonimos'), lenguaSkill('voc', 'antonimos')], {
        concreto: 'Pares de objetos iguales y contrarios', dibujo: 'Dos columnas con las palabras emparejadas', numeros: 'La palabra que significa lo mismo: grande, enorme', uso: 'Cambiar palabras de una frase por otras',
      }, true),
      topic('familias', 'Familias de palabras', [lenguaSkill('voc', 'familias')], {
        concreto: 'Un árbol con la raíz en el tronco', dibujo: 'Palabras de la misma familia en una rama', numeros: 'Palabras que empiezan igual: pan, panadero', uso: 'Encontrar la familia de una palabra de un texto',
      }),
      topic('aumentativos-diminutivos', 'Diminutivos y aumentativos', [lenguaSkill('voc', 'diminutivos'), lenguaSkill('voc', 'aumentativos')], {
        concreto: 'Un objeto grande y otro pequeño', dibujo: 'Dibujos de tamaños distintos con su palabra', numeros: 'Casa, casita, casona', uso: 'Diminutivos y aumentativos en una historia',
      }, true),
      topic('compuestas', 'Palabras compuestas', [lenguaSkill('voc', 'compuestas')], {
        concreto: 'Dos piezas que se unen: sacapuntas', dibujo: 'Dos dibujos que forman una palabra nueva', numeros: 'Unir dos palabras: lava + platos', uso: 'Palabras compuestas en una frase',
      }),
    ],
  },
  {
    id: 'lectura',
    name: 'Lectura',
    topics: [
      topic('idea-principal', 'Idea principal del texto', [lenguaSkill('lect', 'idea-principal')], {
        concreto: 'Un texto corto con una imagen', dibujo: 'El párrafo con su frase clave subrayada', numeros: 'Elegir la frase que resume el texto', uso: 'Contar de qué trata una historia',
      }),
      topic('preguntas', 'Preguntas sobre el texto', [lenguaSkill('lect', 'preguntas')], {
        concreto: 'Un texto leído en voz alta', dibujo: 'La respuesta buscada en el texto', numeros: 'Contestar con una palabra del texto', uso: 'Preguntas de comprensión de una historia',
      }),
      topic('ordenar-sucesos', 'Ordenar lo que pasó', [lenguaSkill('lect', 'ordenar')], {
        concreto: 'Viñetas de un cuento para colocar', dibujo: 'Tres dibujos en orden: antes, después, al final', numeros: 'Numerar las frases en el orden del texto', uso: 'Contar un cuento con sus sucesos en orden',
      }),
    ],
  },
  {
    id: 'literatura',
    name: 'Literatura',
    topics: [
      topic('rima', 'Rima: palabras que suenan igual al final', [lenguaSkill('lit', 'rima')], {
        concreto: 'Palabras que acaban igual: sol, col', dibujo: 'Dos versos con las palabras que riman marcadas', numeros: 'Completar el verso con la palabra que rima', uso: 'Leer un poema corto',
      }),
      topic('adivinanzas-trabalenguas', 'Adivinanzas y trabalenguas', [lenguaSkill('lit', 'adivinanzas'), lenguaSkill('lit', 'trabalenguas')], {
        concreto: 'Objetos escondidos en una bolsa', dibujo: 'Una adivinanza con su dibujo de respuesta', numeros: 'Decir el trabalenguas despacio y luego deprisa', uso: 'Adivinanzas y trabalenguas de la clase',
      }, true),
      topic('fabula', 'Fábula: la historia y su moraleja', [lenguaSkill('lit', 'fabula')], {
        concreto: 'Figuras de animales que actúan', dibujo: 'Los personajes y lo que hacen, en orden', numeros: 'La moraleja escrita con una frase', uso: 'Contar una fábula con sus personajes',
      }),
    ],
  },
  {
    id: 'escritura',
    name: 'Escritura',
    topics: [
      topic('copia', 'Copia de frases', [lenguaSkill('escr', 'copia')], {
        concreto: 'Una frase en una tarjeta para copiar', dibujo: 'La frase copiada palabra a palabra', numeros: 'Escribir la frase entera mirando el modelo solo al principio', uso: 'Copiar una frase de una historia',
      }),
      topic('dictado', 'Dictado', [lenguaSkill('escr', 'dictado')], {
        concreto: 'Escuchar una palabra y tocar sus letras', dibujo: 'La palabra con sus huecos', numeros: 'Escribir la palabra que se oye', uso: 'Dictado de una frase de la historia',
      }),
      topic('escritura-guiada', 'Escritura guiada corta: invitación, nota, carta y descripción', [lenguaSkill('escr', 'guiada')], {
        concreto: 'Una invitación con huecos para completar', dibujo: 'Modelos de nota y de carta con sus partes', numeros: 'Completar la nota o la carta con la fecha y el mensaje', uso: 'Escribir una invitación o describir un objeto en pocas frases',
      }),
    ],
  },
]

/** Teaching order: eight stages over three trimesters (3, 3 and 2 stages), easy to hard, each topic once. */
export const LENGUA3_STAGES: SyllabusStage[] = [
  // 1.er trimestre
  { id: 'etapa-1', term: 1, topics: ['lng-silabas', 'lng-mayusculas', 'lng-abecedario', 'lng-copia'] },
  { id: 'etapa-2', term: 1, topics: ['lng-sustantivo', 'lng-articulo', 'lng-c-qu', 'lng-rima'] },
  { id: 'etapa-3', term: 1, topics: ['lng-adjetivo', 'lng-g-gu', 'lng-r-rr', 'lng-idea-principal'] },
  // 2.º trimestre
  { id: 'etapa-4', term: 2, topics: ['lng-verbo', 'lng-mp-mb', 'lng-tonica-atona', 'lng-sinonimos-antonimos', 'lng-dictado'] },
  { id: 'etapa-5', term: 2, topics: ['lng-oracion', 'lng-signos', 'lng-familias', 'lng-preguntas'] },
  { id: 'etapa-6', term: 2, topics: ['lng-adivinanzas-trabalenguas', 'lng-aumentativos-diminutivos', 'lng-ordenar-sucesos'] },
  // 3.er trimestre
  { id: 'etapa-7', term: 3, topics: ['lng-fabula', 'lng-compuestas'] },
  { id: 'etapa-8', term: 3, topics: ['lng-escritura-guiada'] },
]

export const LENGUA3_SYLLABUS: Syllabus = withStageTerms({
  id: 'lengua-3-primaria',
  course: 3,
  blocks: BLOCKS,
  stages: LENGUA3_STAGES,
})
