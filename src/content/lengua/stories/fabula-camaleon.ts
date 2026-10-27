/* Original fable, written for Repasitos in the form of Aesop's fables (an animal, a plot, a moral in one sentence). Not a
   retelling of any existing fable: the animals, the game and the moral are new. */
import type { ReadingDef } from '@/types'

export const fabulaCamaleon: ReadingDef = {
  id: 'fabula-camaleon',
  title: 'El camaleón que quería parecer otro',
  text: [
    'Lumi quiere contar una fábula a {child} y a {pet}. Esta vez el protagonista es Rufino, un camaleón que cambia de color con mucha facilidad.',
    'Un día, Rufino vio una mariposa rosa y pensó: «Quiero ser rosa como ella, así todos me admirarán». Se puso rosa y se sentó en una flor.',
    'Pero enseguida se aburrió de ser rosa. Se subió a una piedra y se volvió gris. Luego se posó en un tronco y se volvió marrón.',
    'Aquel día, sus amigos jugaron al escondite. La lechuza contó hasta diez y empezó a buscar. Pía, la cotorra, miró por todas partes.',
    'Nadie encontró a Rufino. Estaba tan bien escondido que parecía una piedra, una flor y un tronco a la vez. Cuando todos se rindieron, Rufino salió, triste y con hambre.',
    '—¿Quién eres? —preguntó Pía—. Eres tan parecido a todo que ya no pareces nadie. Rufino se quedó callado un buen rato.',
    'Entonces Rufino se dio cuenta de que lo más bonito era su propio color, verde y tranquilo. Volvió a ser verde, y sus amigos lo reconocieron enseguida.',
    'Moraleja: no cambies quién eres para gustar a los demás, porque tus amigos te quieren tal como eres.',
  ],
  skills: ['lng:lit:fabula', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lit:fabula',
      prompt: '¿Cuál es la moraleja de la fábula?',
      options: [
        'Hay que tener muchos colores para ser admirado.',
        'Lo mejor es ser tal como uno es, sin cambiarse para gustar a los demás.',
        'Los camaleones nunca se aburren de jugar.',
      ],
      answer: 1,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Por qué nadie encontró a Rufino en el escondite?',
      options: [
        'Porque se había escondido debajo de la cama.',
        'Porque estaba tan parecido al sitio donde se escondió que nadie lo veía.',
        'Porque se fue a casa antes de empezar el juego.',
      ],
      answer: 1,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó en la fábula.',
      events: [
        'Rufino se pone rosa para parecerse a una mariposa.',
        'Sus amigos juegan al escondite y no lo encuentran.',
        'Pía pregunta quién es, porque no lo reconoce.',
        'Rufino vuelve a ser verde, como era al principio.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Cómo se llama el camaleón?',
      answer: 'Rufino',
      rule: 'ignore-case',
    },
  ],
}
