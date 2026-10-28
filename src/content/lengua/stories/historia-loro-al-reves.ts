/* Original story, written for Repasitos: a parrot who says every word backwards, and the children who decode him. */
import type { ReadingDef } from '@/types'

export const historiaLoroAlReves: ReadingDef = {
  id: 'historia-loro-al-reves',
  title: 'El loro que hablaba al revés',
  text: [
    'Pipo era un loro muy listo, pero desde que se comió una semilla mágica, todas sus palabras salían al revés.',
    '—¡Nap! ¡Nap! —gritaba cada mañana, mirando la cesta de Lumi—. ¡Nap, nap!',
    '—¿Nap? —preguntó Lumi, con la cabeza llena de dudas—. Eso no quiere decir nada.',
    '{child} se rió y dijo: —Espera, Lumi. Nap al revés es pan. Pipo tiene hambre.',
    'Pipo dio saltos de alegría. Luego señaló un árbol y gritó: —¡Ajab, ajab! Al darle la vuelta, {child} entendió: «baja».',
    '{pet} miró hacia arriba. Allí, enganchado en una rama, estaba el globo rojo de la fiesta, que llevaba todo el día perdido.',
    '{child} trepó con cuidado, desató el globo y lo bajó sin romperlo. Pipo aplaudió con las alas.',
    'Lumi le dio al loro un trozo de pan, y Pipo, con la boca llena, dijo por fin: —¡Pan! ¡Pan! Todos se rieron.',
    'Desde entonces, cada vez que Pipo habla al revés, {child} y {pet} corren a descifrarlo. Es el mejor juego del bosque.',
  ],
  skills: ['lng:lect:idea-principal', 'lng:lect:preguntas', 'lng:lect:ordenar'],
  questions: [
    {
      kind: 'choice',
      skill: 'lng:lect:idea-principal',
      prompt: '¿De qué trata el texto?',
      options: [
        'De un loro que dice las palabras al revés, y de cómo sus amigos las descifran.',
        'De una semilla que hace crecer árboles muy altos, y de cómo los pájaros la cuidan.',
        'De un globo que se pierde y nadie vuelve a buscar.',
      ],
      answer: 0,
    },
    {
      kind: 'choice',
      skill: 'lng:lect:preguntas',
      prompt: '¿Qué quería decir Pipo con «ajab», cuando señaló el árbol?',
      options: [
        'Que bajaran el globo.',
        'Que se fueran a dormir a la cueva.',
        'Que cantaran una canción.',
      ],
      answer: 0,
    },
    {
      kind: 'order',
      skill: 'lng:lect:ordenar',
      prompt: 'Pon en orden lo que pasó.',
      events: [
        'Pipo grita «nap» pidiendo algo de comer.',
        'Alguien descubre que «nap» es pan al revés.',
        'Pipo señala el árbol y dice «ajab».',
        'Bajan el globo rojo de la rama.',
      ],
    },
    {
      kind: 'text',
      skill: 'lng:lect:preguntas',
      prompt: '¿De qué color es el globo?',
      answer: 'rojo',
      rule: 'ignore-case',
    },
  ],
}
