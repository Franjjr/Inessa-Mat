/* World 4 — La Montaña de las Restas: column subtraction of 3 and 4 digits, borrowing, the zero trap and the
   magic check (+ a review of the 6 table). The lesson of the two ways of subtracting at school is an optional stop
   before the guardian: it shows the two ways and asks for one subtraction with the way the grown-ups set; the child may
   skip it (the main lesson of subtracting is «Restar en la montaña») and the guardian does not wait for it. */
import { activityNode, guardianNode, lessonNode, storyNode, world } from './dsl'

export const w4 = world({
  id: 'w4',
  index: 4,
  name: 'La Montaña de las Restas',
  shortName: 'Montaña',
  background: 'mountain',
  guardian: 'polarbear',
  crystalName: 'celeste',
  predicament: 'ice',
  hook: '¡{pet} está {pg:congelada|congelado} en un bloque de hielo!',
  skillsSummary: 'Restas en columna de 3 y 4 cifras: pedir a la vecina, me llevo una, ceros y prueba de la resta; euros y céntimos, pagar y el cambio',
  path: [[0.12, 0.86], [0.42, 0.88], [0.6, 0.84], [0.76, 0.8], [0.86, 0.62], [0.62, 0.54], [0.32, 0.56], [0.15, 0.4], [0.34, 0.26], [0.62, 0.3], [0.56, 0.12]],
  nodes: [
    storyNode('arrival', 'Un bloque de hielo', 'w4-arrival'),
    lessonNode('lesson-borrow', 'Restar en la montaña', 'w4-borrow'),
    lessonNode('lesson-bars', 'Dibujar la historia', 'w4-bars'),
    activityNode('column-3d', {
      kind: 'column',
      title: 'Restas de 3 cifras',
      instructions: 'Resta en columna, empezando por las unidades.',
      selector: { kinds: ['column-sub'], digits: 3, regroup: 'any', zeros: false },
      count: 5,
      params: { guided: true },
    }),
    lessonNode('lesson-zero', 'Aprende: la trampa del cero', 'w4-zero'),
    activityNode('column-zero', {
      kind: 'column',
      title: 'Practica: restas con ceros',
      instructions: 'Resta en columna, empezando por las unidades. Cuidado con los ceros.',
      selector: { kinds: ['column-sub'], digits: 3, zeros: true },
      count: 4,
    }),
    storyNode('mid', '¡Ceros en las puertas!', 'w4-mid'),
    activityNode('column-4d', {
      kind: 'column',
      title: 'Restas de 4 cifras',
      instructions: 'Resta y haz la prueba mágica: el resultado más el de abajo da el de arriba.',
      selector: { kinds: ['column-sub'], digits: 4, regroup: 'any' },
      count: 4,
      params: { proof: true },
    }),
    activityNode('word', {
      kind: 'exercises',
      title: 'El problema de Nieve',
      instructions: 'Lee despacio. Si ayuda, dibuja la barra. ¿Cuántas quedan? Piensa si hay que quitar.',
      selector: { kinds: ['word-problem', 'bar-problem'], skills: ['sub:3d:b1', 'sub:3d:b2', 'sub:4d:b1', 'sub:4d:b2', 'bar:sub'] },
      count: 3,
    }),
    activityNode('memory', {
      kind: 'memory',
      title: 'Memoria de la cueva',
      instructions: 'Repaso de la Cueva: busca las parejas de la tabla del 6.',
      selector: { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] },
      count: 6,
    }),
    activityNode('mountain-shop', {
      kind: 'exercises',
      title: 'La tienda del refugio',
      instructions: 'En el refugio se compra con euros y céntimos. Paga justo y calcula el cambio.',
      selector: { skills: ['money:convert', 'money:pay', 'money:change'] },
      count: 4,
    }),
    lessonNode('lesson-four-ways', 'Dos formas de restar del cole', 'w4-four-ways', { optional: true }),
    guardianNode('El desafío de la osa Nieve', 'w4-guardian'),
  ],
})
