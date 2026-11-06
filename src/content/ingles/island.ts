/* La Isla de las Palabras: the island of Inglés de 3.º, a world of its own on the map (progress.worlds['isla-ingles']).
   Eight stop groups, one per stage of INGLES3_STAGES, in teaching order: an arrival story, one lesson stop per topic of the
   stage (the topic's class, the same five phases as «Hoy»), an activity on the stage's topics, a mid story and a guardian.
   The island never touches the maths path: it is always open, its stops follow one another, and its guardians do not
   light the maths crystals (progression.ts). The activities and guardians use no listening kind (ISLAND_KINDS): a child
   may have the sound off. The ops topic has no stop here: its exercises are all listening ones, so it is taught by its
   class and the English session with the sound on. Pure data. */
import { activityNode, guardianNode, lessonNode, storyNode, world, type NodeSpec } from '../worlds/dsl'
import { englishSkill } from '@/engine/skills'
import type { ExerciseKind, SkillKey, WorldDef } from '@/types'

export const ISLAND_ID = 'isla-ingles'

/** The kinds of the island's activities and guardians: every English kind except the listening ones. */
export const ISLAND_KINDS: ExerciseKind[] = ['eng-write-word', 'eng-match', 'eng-scramble', 'eng-complete', 'eng-num-write']

/** The kinds each family of skills is drawn with (the first one of each is the one the kind list allows). */
export const WORD_KINDS: ExerciseKind[] = ['eng-write-word', 'eng-match', 'eng-scramble']
export const PHRASE_KINDS: ExerciseKind[] = ['eng-complete']
export const NUMBER_KINDS: ExerciseKind[] = ['eng-num-write']

/** One stage: its stop group (the lesson stops, the skills of the activity and the guardian by family of skills). */
export interface IslandStage {
  n: number
  name: string
  guardian: 'frog' | 'ladybug' | 'owl' | 'polarbear' | 'octopus' | 'fairy' | 'dragon' | 'queen'
  /** The class lessons of the stage, in teaching order (the lesson ids of src/content/classes/ingles3.ts). */
  lessons: { id: string; title: string }[]
  words: SkillKey[]
  phrases: SkillKey[]
  numbers: SkillKey[]
  arrival: string
  mid: string
  guardianTitle: string
}

const voc = (theme: string): SkillKey => englishSkill('voc', theme)
const frase = (id: string, level?: string): SkillKey => englishSkill('frase', id, level)
const num = (item: string): SkillKey => englishSkill('num', item)
const lesson = (id: string, title: string) => ({ id, title })

/** The eight stages of the island, one per stage of INGLES3_STAGES (etapa-1 … etapa-8). */
export const ISLAND_STAGES: IslandStage[] = [
  {
    n: 1, name: 'El Puerto de los Saludos', guardian: 'frog',
    lessons: [lesson('eng3-saludos', 'Saludos y yo'), lesson('eng3-num-0-20', 'Números del 0 al 20'), lesson('eng3-colores', 'Colores y formas')],
    words: [voc('saludos'), voc('colores')], phrases: [frase('saludos')], numbers: [num('0-20')],
    arrival: 'Bienvenidos al puerto', mid: 'Borrón revuelve los saludos', guardianTitle: 'El desafío de la Rana Saltarina',
  },
  {
    n: 2, name: 'El Jardín de los Animales', guardian: 'ladybug',
    lessons: [lesson('eng3-num-decenas', 'Decenas: 30 a 100'), lesson('eng3-animales', 'Animales'), lesson('eng3-familia', 'La familia')],
    words: [voc('animales'), voc('familia')], phrases: [frase('its-a'), frase('this-is-my')], numbers: [num('decenas')],
    arrival: 'Los animales del jardín', mid: 'Borrón esconde a los animales', guardianTitle: 'El desafío de la Reina Mariquita',
  },
  {
    n: 3, name: 'La Torre de las Cuentas', guardian: 'owl',
    lessons: [lesson('eng3-num-21-100', 'Números del 21 al 100')],
    words: [], phrases: [], numbers: [num('21-100')],
    arrival: 'Las cuentas de la torre', mid: 'Borrón se lleva los números', guardianTitle: 'El desafío del Búho Sabio',
  },
  {
    n: 4, name: 'El Mercado del Oso Polar', guardian: 'polarbear',
    lessons: [lesson('eng3-comida', 'Comida')],
    words: [voc('comida')], phrases: [frase('i-like'), frase('can-i-have')], numbers: [],
    arrival: 'Compras en el mercado', mid: 'Borrón cambia los precios', guardianTitle: 'El desafío de la osa Nieve',
  },
  {
    n: 5, name: 'El Armario del Pulpo', guardian: 'octopus',
    lessons: [lesson('eng3-ropa', 'La ropa'), lesson('eng3-cole', 'El cole')],
    words: [voc('ropa'), voc('cole')], phrases: [frase('im-wearing'), frase('classroom')], numbers: [],
    arrival: 'Un armario muy desordenado', mid: 'Borrón esconde la ropa', guardianTitle: 'El desafío de Octavio',
  },
  {
    n: 6, name: 'La Casa del Escondite', guardian: 'fairy',
    lessons: [lesson('eng3-casa', 'La casa: in, on, under')],
    words: [voc('casa')], phrases: [frase('where-is', 'in'), frase('where-is', 'on'), frase('where-is', 'under')], numbers: [],
    arrival: 'Juegos de escondite', mid: 'Borrón mueve los muebles', guardianTitle: 'El desafío del Hada Iris',
  },
  {
    n: 7, name: 'El Monte del Cuerpo y del Tiempo', guardian: 'dragon',
    lessons: [lesson('eng3-cuerpo', 'El cuerpo'), lesson('eng3-tiempo', 'El tiempo y las estaciones')],
    words: [voc('cuerpo'), voc('tiempo')], phrases: [frase('ive-got'), frase('weather')], numbers: [],
    arrival: 'Cuerpo y tiempo', mid: 'Borrón cambia el tiempo', guardianTitle: 'El desafío de Chispa',
  },
  {
    n: 8, name: 'El Castillo de los Días', guardian: 'queen',
    lessons: [lesson('eng3-dias', 'Días y meses')],
    words: [voc('dias')], phrases: [frase('what-day')], numbers: [],
    arrival: 'El castillo de los días', mid: 'Borrón rompe el calendario', guardianTitle: 'El desafío de la Reina Aurora',
  },
]

/** The skill families of a stage with the kinds they are drawn with (a family with no skill is left out). */
export function familiesOf(stage: IslandStage): { skills: SkillKey[]; kinds: ExerciseKind[] }[] {
  return [
    { skills: stage.words, kinds: WORD_KINDS },
    { skills: stage.phrases, kinds: PHRASE_KINDS },
    { skills: stage.numbers, kinds: NUMBER_KINDS },
  ].filter((f) => f.skills.length > 0)
}

/** The stop group of one stage: arrival, a lesson per topic, the activity, the mid story and the guardian. */
export function stageStops(stage: IslandStage): NodeSpec[] {
  const p = `s${stage.n}`
  const skills = [...stage.words, ...stage.phrases, ...stage.numbers]
  return [
    storyNode(`${p}-llegada`, stage.arrival, `isla-${stage.n}-llegada`),
    ...stage.lessons.map((l) => lessonNode(`${p}-${l.id.replace('eng3-', '')}`, l.title, l.id)),
    activityNode(`${p}-practica`, {
      kind: 'exercises',
      title: `Practica en ${stage.name.toLowerCase()}`,
      instructions: 'Lee la palabra o la frase en inglés y escribe o elige la respuesta. ¡Sin prisa!',
      selector: { skills, kinds: ISLAND_KINDS },
      count: 5,
    }),
    storyNode(`${p}-mitad`, stage.mid, `isla-${stage.n}-mitad`),
    { ...guardianNode(stage.guardianTitle, `isla-${stage.n}-guardian`), id: `${p}-guardian` },
  ]
}

/** Control points of the map path: a zig-zag from the top of the island to the bottom (WorldMapScreen spreads the stops). */
const ISLAND_PATH: [number, number][] = Array.from({ length: 16 }, (_, i) => [i % 2 === 0 ? 0.3 : 0.7, 0.04 + (i * 0.92) / 15])

/** Height of one stop of the island on the map, in px: the stage is as tall as its stops need (WorldMapScreen). */
export const ISLAND_STOP_PX = 120

export const islandWorld: WorldDef = world({
  id: ISLAND_ID,
  seasonId: 'ingles',
  index: 1,
  name: 'La Isla de las Palabras',
  shortName: 'Isla',
  background: 'sky',
  guardian: 'lumi',
  crystalName: 'celeste',
  predicament: 'fog',
  hook: '¡{pet} se ha quedado en la niebla de Borrón! Las palabras inglesas se han escondido en la isla.',
  skillsSummary: 'Inglés de 3.º: saludos, números, colores, animales, familia, comida, ropa, el cole, la casa, el cuerpo, el tiempo y los días',
  path: ISLAND_PATH,
  nodes: ISLAND_STAGES.flatMap(stageStops),
})
