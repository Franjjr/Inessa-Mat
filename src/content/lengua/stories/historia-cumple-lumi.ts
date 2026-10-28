/* Original story, written for Repasitos: a birthday party saved by an idea about sugar. Not a retelling of any existing story. */
import type { ReadingDef } from '@/types'

export const historiaCumpleLumi: ReadingDef = {
  id: 'historia-cumple-lumi',
  title: 'El cumpleaños de Lumi',
  text: [
    'Lumi cumplía años. Según sus cuentas, tenía siete. Según los libros del reino, tenía setecientos. —Depende de cómo se cuente —dijo, guiñando un ojo.',
    'Lumi había invitado a todo el bosque, pero se le había olvidado un detalle: la tarta.',
    '{pet} olió el aire. —Huele a galletas —dijo—. Viene de la cocina de la señora Oca.',
    'La señora Oca quería preparar una tarta, pero se había quedado sin azúcar, y no sabía qué hacer.',
    '{child} tuvo una idea: —¿Y si usamos miel? Es más dulce que el azúcar, y la fabrican las abejas, que viven aquí mismo.',
    'Dicho y hecho: {child} fue al panal, habló con las abejas y volvió con un tarro de miel. La tarta quedó perfecta, aunque un poco pegajosa.',
    'Cuando llegaron los invitados, la tarta era tan alta que no cabía por la puerta. Tuvieron que entrar por la ventana, con cuidado de no tocar la crema.',
    'Lumi sopló las velas y pidió un deseo: —Que el año que viene nadie se olvide de la tarta.',
    'Todos aplaudieron. Y {pet}, que había comido dos trozos, dijo que aquel había sido el mejor cumpleaños del reino.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿Cuál es la idea principal del texto?',
      options: [
        'Lumi cumple años, y la tarta se hace con miel en lugar de azúcar.',
        'Lumi cumple años y se queda sin invitados.',
        'La señora Oca gana un concurso de tartas, y después se lleva la receta de Lumi a casa.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué ingrediente le faltaba a la señora Oca?',
      options: [
        'Huevos.',
        'Azúcar.',
        'Harina.',
      ],
      answer: 1,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Lumi se da cuenta de que se ha olvidado de la tarta.',
        'Alguien propone usar miel en lugar de azúcar.',
        'La tarta es tan alta que los invitados entran por la ventana.',
        'Todos aplauden cuando Lumi sopla las velas.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué dulce se usa en lugar del azúcar?',
      answer: 'miel',
      rule: 'ignore-case',
    },
  ],
}
