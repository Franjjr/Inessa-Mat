/* World 4 — La Montaña de las Restas: column subtraction of 3 and 4 digits, borrowing, the zero trap and the
   magic check (+ a review of the 6 table). */
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
  skillsSummary: 'Restas en columna de 3 y 4 cifras: pedir a la vecina, me llevo una, por partes, la recta, ceros y prueba de la resta',
  path: [[0.12, 0.86], [0.42, 0.88], [0.6, 0.84], [0.76, 0.8], [0.86, 0.62], [0.62, 0.54], [0.32, 0.56], [0.15, 0.4], [0.34, 0.26], [0.62, 0.3], [0.56, 0.12]],
  nodes: [
    storyNode('arrival', 'Un bloque de hielo', 'w4-arrival'),
    lessonNode('lesson-borrow', 'Restar en la montaña', 'w4-borrow'),
    lessonNode('lesson-four-ways', 'Cuatro caminos para restar', 'w4-four-ways'),
    lessonNode('lesson-bars', 'Dibujar la historia', 'w4-bars'),
    activityNode('column-3d', {
      kind: 'column',
      title: 'Restas de 3 cifras',
      instructions: 'Si arriba hay un número más pequeño, ¡pide ayuda a la vecina!',
      selector: { kinds: ['column-sub'], digits: 3, regroup: 'any', zeros: false },
      count: 5,
      params: { guided: true },
    }),
    lessonNode('lesson-zero', 'La trampa del cero', 'w4-zero'),
    activityNode('column-zero', {
      kind: 'column',
      title: 'La trampa del cero',
      instructions: 'Si la vecina es un 0, ¡pide ayuda a la casa siguiente!',
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
    guardianNode('El desafío de la osa Nieve', 'w4-guardian'),
  ],
})
