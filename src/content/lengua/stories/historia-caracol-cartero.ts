/* Original story, written for Repasitos: a very slow snail postman and a leaf that carries the letter faster. */
import type { ReadingDef } from '@/types'

export const historiaCaracolCartero: ReadingDef = {
  id: 'historia-caracol-cartero',
  title: 'El caracol cartero',
  text: [
    'El caracol Bernardo era el cartero del bosque. Era muy puntual, a su manera: llegaba cuando llegaba.',
    'Un día, Lumi le dio una carta urgente para la abuela del erizo. —Tiene que llegar hoy —le dijo—. ¿Me has entendido? ¡Hoy!',
    '—Hoy, hoy —repitió Bernardo, que tardó casi una hora en dar la vuelta a una piedra.',
    '{pet} lo miró preocupado. —Si seguimos así, la abuela del erizo cumplirá cien años antes de leer la carta.',
    '{child} se rascó la cabeza y miró el río. Vio una hoja grande, verde y tranquila, que flotaba sin prisa.',
    '—¡Ya lo tengo! —dijo {child}—. La carta irá en barco. El río va mucho más deprisa que Bernardo.',
    'Metieron la carta en un sobre de hoja, lo ataron con una ramita y lo dejaron en el agua. La corriente la llevó hasta la orilla de la abuela, como un tren de hojas.',
    'Bernardo, que venía detrás, se quedó quieto. —Pues vaya —dijo—. Me ha ganado un papel.',
    'Pero llegó a la orilla al final, y se sintió orgulloso: —Bien pensado. Yo me encargo de traer la respuesta.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿Cuál es el problema que hay que resolver?',
      options: [
        'La carta tiene que llegar pronto, y el caracol va muy despacio.',
        'El río se ha secado y no hay agua.',
        'Lumi ha perdido su cuerno.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿En qué viajó la carta?',
      options: [
        'En una hoja que flotaba en el río.',
        'En el lomo de un pájaro.',
        'En la concha de Bernardo.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Lumi da una carta urgente al caracol.',
        'Bernardo tarda casi una hora en dar la vuelta a una piedra.',
        'Alguien ve una hoja grande que flota en el río.',
        'La carta llega a la orilla por la corriente.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿Cómo se llama el caracol?',
      answer: 'Bernardo',
      rule: 'ignore-case',
    },
  ],
}
