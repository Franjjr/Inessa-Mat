/* Original story, written for Repasitos: a map that was drawn the wrong way round, and a companion who is sure of every road. */
import type { ReadingDef } from '@/types'

export const historiaMapa: ReadingDef = {
  id: 'historia-mapa',
  title: 'El mapa del revés',
  text: [
    '{pet} estaba seguro de que sabía llegar al lago de las ranas. —Siempre acierto con los caminos —dijo, muy serio—. Por aquí.',
    'Lumi había dibujado un mapa para la excursión, con el lago arriba del todo. Pero lo había dibujado sin pensar en cómo se ponía el papel.',
    '{child} miró el mapa. —Según esto, el lago está arriba, y el camino sube hacia la derecha —dijo—. Pero nosotros hemos bajado. Algo no encaja.',
    '{pet} se rió. —El mapa está torcido. Yo sé el camino: a la derecha, siempre a la derecha.',
    'Caminaron a la derecha durante media hora. Cruzaron un puente, subieron una cuesta y llegaron a un prado. Allí dormía una vaca.',
    '—¿Ves? —dijo {pet}—. Esto no es el lago. Es un prado muy bonito, pero no es el lago.',
    '{child} giró el mapa hasta que el puente del dibujo quedó donde estaba el puente de verdad. —Mira —dijo—: el lago está a la izquierda, por el camino que sube.',
    '{pet} suspiró. —Está bien. Tenía razón en que había un camino. Pero no en cuál.',
    'Llegaron al lago justo a tiempo para comer. Las ranas los saludaron con un «croac» muy educado, y {pet} dijo que lo había sabido desde el principio.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata la historia?',
      options: [
        'De un grupo que se pierde porque el mapa está mal girado, y de cómo lo arreglan.',
        'De un grupo de ranas que viaja a un desierto.',
        'De un animal que dibuja el mapa más bonito del bosque.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Por qué se perdieron al principio?',
      options: [
        'Porque el mapa estaba girado y no coincidía con el camino.',
        'Porque llovía tanto que no veían nada.',
        'Porque el puente estaba roto.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Lumi dibuja un mapa para la excursión.',
        'El grupo sigue el camino de la derecha, sin mirar el mapa.',
        'Llegan a un prado donde duerme una vaca.',
        'Giran el mapa hasta que el puente coincide, y encuentran el lago.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué animal dormía en el prado?',
      answer: 'vaca',
      rule: 'ignore-case',
    },
  ],
}
