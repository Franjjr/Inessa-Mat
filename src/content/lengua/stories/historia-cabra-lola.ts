/* Original story, written for Repasitos: a goat who tells tall tales until her friends ask for proof. */
import type { ReadingDef } from '@/types'

export const historiaCabraLola: ReadingDef = {
  id: 'historia-cabra-lola',
  title: 'La cabra que contaba mentiras',
  text: [
    'La cabra Lola tenía fama en el bosque: era la que contaba las historias más grandes del mundo.',
    '—Ayer conté las estrellas en un solo salto —dijo—. Eran un millón, y todas me dieron las gracias. Y el viernes me comí una montaña de helado.',
    '{pet} abrió mucho los ojos. —¿De verdad? —preguntó. —¡De verdad! —dijo Lola—. Pero no se lo digáis a nadie.',
    '{child} se cruzó de brazos. —Eso no puede ser. Una cabra no puede contar un millón de estrellas en un salto.',
    'Lola se puso nerviosa y empezó a dar pasos hacia atrás. —Bueno, quizá fueron mil.',
    '—¿Y el helado? ¿Dónde está el envoltorio? —preguntó {child}. Lola miró a un lado y a otro, pero no había nada.',
    '—Un refrán dice que las mentiras tienen las patas cortas —dijo {pet}—. Y las tuyas no llegan ni al árbol de al lado.',
    'Lola bajó la cabeza. —Es verdad. Me lo inventaba para que me admirarais. —Pues admírate tú cuando digas la verdad —dijo {child}, sonriendo.',
    'Desde entonces, Lola cuenta solo historias de verdad. Son menos sorprendentes, pero todo el bosque le cree.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿Cuál es la idea principal del texto?',
      options: [
        'Una cabra cuenta mentiras para parecer admirable, hasta que la descubren.',
        'Una cabra aprende a contar estrellas.',
        'Una cabra se va a vivir a la montaña.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué dijo Lola que se había comido?',
      options: [
        'Un helado.',
        'Una manzana.',
        'Un pastel de nubes.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Lola dice que ha contado un millón de estrellas.',
        'Alguien dice que una cabra no puede contar tantas estrellas.',
        'Lola dice que quizá fueron mil.',
        'Lola reconoce que se lo inventaba.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué animal es Lola?',
      answer: 'cabra',
      rule: 'ignore-case',
    },
  ],
}
