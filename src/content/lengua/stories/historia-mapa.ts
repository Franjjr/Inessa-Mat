/* Original story, written for Repasitos: a map held upside down, so the right side became the left, and a companion who is sure of every road. */
import type { ReadingDef } from '@/types'

export const historiaMapa: ReadingDef = {
  id: 'historia-mapa',
  title: 'El mapa del revés',
  text: [
    '{pet} estaba {pg:segura|seguro} de que sabía llegar al lago de las ranas. —Yo llevo el mapa —dijo, muy {pg:seria|serio}—. Siempre acierto con los caminos.',
    'Lumi lo había dibujado para la excursión. En el mapa, el lago estaba a la derecha del puente.',
    'Al cruzar el puente, {pet} giró a la derecha, como decía el mapa. Caminaron media hora y llegaron a un prado. Allí dormía una vaca.',
    '—Esto no es el lago —dijo {child}—. Mira el mapa: la palabra LAGO está escrita boca abajo. Lo llevamos al revés.',
    '{pet} miró el papel y se quedó {pg:quieta|quieto}. —¡Tienes razón! Si el mapa está al revés, la derecha es la izquierda.',
    'Volvieron sobre sus pasos y tomaron el camino de la izquierda. Al poco, ya se veía el lago, con sus nenúfares.',
    'Llegaron justo a tiempo para comer. Las ranas los saludaron con un «croac» muy educado.',
    '{pet} dijo que lo había sabido desde el principio. Nadie le creyó, pero todos se rieron.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata la historia?',
      options: [
        'De un grupo que se pierde por un mapa boca abajo, y de cómo lo descubren.',
        'De un grupo que se pierde porque no encuentra el puente, aunque busca por todo el bosque.',
        'De un grupo que quiere cruzar un río sin puente.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Por qué se perdieron al principio?',
      options: [
        'Porque el mapa estaba boca abajo, y la derecha quedó a la izquierda.',
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
        'Lumi dibuja un mapa con el lago a la derecha del puente.',
        'El grupo gira a la derecha y llega a un prado con una vaca dormida.',
        'Alguien ve que la palabra LAGO está escrita boca abajo.',
        'Vuelven por el camino de la izquierda y encuentran el lago.',
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
