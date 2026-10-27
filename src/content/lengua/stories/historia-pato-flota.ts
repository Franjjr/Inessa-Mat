/* Original story, written for Repasitos: an animal who brags about swimming and has to learn to float first. */
import type { ReadingDef } from '@/types'

export const historiaPatoFlota: ReadingDef = {
  id: 'historia-pato-flota',
  title: 'Nadar mejor que un pato',
  text: [
    'Un día de verano, {pet} se asomó al lago del parque y dijo, muy {pg:orgullosa|orgulloso}: —¡Yo nado mejor que un pato!',
    'El pato Ramón levantó la cabeza. —Eso lo veremos —graznó—. Hoy hay carrera de nado.',
    '{pet} se puso un gorro de baño. Le quedaba enorme, y le tapaba hasta las orejas.',
    '—Antes de competir hay que aprender a flotar —dijo {child}—. Con calma, que no pasa nada.',
    '{child} le prestó un flotador con forma de rosquilla. {pet} se metió en el agua con mucho cuidado: primero un dedo, luego un pie y, por fin, todo el cuerpo.',
    '¡Plaf! Se quedó flotando como un corcho. Pero en cuanto movió los brazos, empezó a dar vueltas sin parar, como un trompo.',
    'Ramón se rió tanto que casi se hunde. —¡Pareces una hoja en un remolino! —graznó.',
    '{pet} también se rió. —Vale, nado como un trompo, pero sé flotar. Eso ya es un comienzo.',
    'Ramón le enseñó a mover los brazos despacio, sin prisa. Al final, {child} le regaló un pato de goma para el gorro, y todos volvieron a casa con una sonrisa.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿Cuál es la idea principal del texto?',
      options: [
        'Un animal presume de nadar muy bien y tiene que aprender a flotar.',
        'Un pato gana una carrera de natación.',
        'Un lago se queda sin agua en pleno verano.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué objeto ayudó a flotar?',
      options: [
        'Un flotador con forma de rosquilla.',
        'Una barca de madera.',
        'Unas gafas de buceo.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'El animal dice que nada mejor que un pato.',
        'Ramón propone una carrera de nado.',
        'El animal flota, pero da vueltas como un trompo.',
        'Ramón se ríe y dice que parece una hoja en un remolino.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Cómo se llama el pato?',
      answer: 'Ramón',
      rule: 'ignore-case',
    },
  ],
}
