/* Original story, written for Repasitos: a cake that runs away and is stopped by a good idea. Not a retelling of any existing book or film. */
import type { ReadingDef } from '@/types'

export const historiaTarta: ReadingDef = {
  id: 'historia-tarta',
  title: 'La tarta que quería ir a la playa',
  text: [
    'Era la víspera de la fiesta de Lumi. En la cocina reposaba una tarta de fresas, con crema rosa, tres velas y una cereza encima.',
    '{pet} la miró con cara de hambre. —Solo quiero probar un poquito —susurró—. Un poquito, nada más.',
    'Pero, en cuanto {pet} se acercó, la tarta dio un salto. ¡Plof! Bajó de la mesa, rodó por el suelo y salió por la puerta del jardín.',
    '—¡Me voy a la playa! —gritó la tarta, con una vocecita de merengue—. ¡Soy demasiado guapa para quedarme en casa!',
    '{child} y {pet} salieron corriendo detrás de ella. La tarta rodaba más deprisa que una pelota, y cada vez estaba más lejos.',
    'Al llegar al camino del río, la tarta se paró de golpe. Se acababa de acordar de un problema: —¡En la playa hay arena, y la arena se pega a la crema!',
    '{child} se acercó despacio. —Tienes razón —dijo—. Y con el sol, la crema se derrite. Mejor quédate aquí, a la sombra.',
    'La tarta se quedó quieta, un poco asustada. {pet} soltó un suspiro de alivio y se sentó a su lado, junto a la cereza.',
    'Al final, Lumi llegó con una pala de pastel y repartió la tarta entre todos. {pet} se llevó la cereza, que era lo que más le gustaba del mundo.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata la historia?',
      options: [
        'Una tarta se escapa de la cocina y acaba repartida entre todos.',
        'Una fiesta se suspende porque no hay pastel.',
        'Un concurso de cocina reparte premios de pastel.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Por qué la tarta se paró en el camino del río?',
      options: [
        'Porque estaba cansada de rodar.',
        'Porque se acordó de que la arena se pega a la crema.',
        'Porque vio a Lumi.',
      ],
      answer: 1,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'La tarta salta de la mesa y sale por la puerta.',
        'La tarta dice que se va a la playa.',
        'La tarta se para y decide quedarse a la sombra.',
        'Lumi reparte la tarta entre todos.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿De qué fruta es la tarta?',
      answer: 'fresas',
      rule: 'ignore-case',
    },
  ],
}
