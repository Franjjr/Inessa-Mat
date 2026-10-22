/* World 2 — El Río de las Sumas: place value and column addition of 3 and 4 digits with carries
   (+ a review of the easy tables from the forest). */
import { activityNode, guardianNode, lessonNode, storyNode, world } from './dsl'

export const w2 = world({
  id: 'w2',
  index: 2,
  name: 'El Río de las Sumas',
  shortName: 'Río',
  background: 'river',
  guardian: 'frog',
  crystalName: 'azul',
  predicament: 'bubble',
  hook: '¡{pet} flota río abajo dentro de una burbuja!',
  skillsSummary: 'Valor posicional y sumas en columna de 3 y 4 cifras con llevadas',
  path: [[0.12, 0.5], [0.22, 0.74], [0.42, 0.84], [0.6, 0.68], [0.5, 0.46], [0.36, 0.26], [0.56, 0.14], [0.76, 0.24], [0.87, 0.46], [0.84, 0.78]],
  nodes: [
    storyNode('arrival', 'El puente de piedras mágicas', 'w2-arrival'),
    lessonNode('lesson-placevalue', 'Cada número en su casa', 'w2-placevalue'),
    activityNode('column-easy', {
      kind: 'column',
      title: 'Piedras sin llevadas',
      instructions: 'Empieza siempre por las unidades. ¡Cada cifra en su casa!',
      selector: { kinds: ['column-add'], digits: 3, regroup: 'none' },
      count: 4,
      params: { guided: true },
    }),
    lessonNode('lesson-carry', '¡Me llevo una!', 'w2-carry'),
    activityNode('column-carry', {
      kind: 'column',
      title: 'Piedras con llevadas',
      instructions: 'Escribe la llevada en la cajita de arriba. ¡Que no se escape!',
      selector: { kinds: ['column-add'], skills: ['add:3d:c1', 'add:3d:c2', 'add:3d:c3'] },
      count: 6,
    }),
    storyNode('mid', '¡Borrón quiere las mochilas!', 'w2-mid'),
    activityNode('column-4d', {
      kind: 'column',
      title: 'Sumas de 4 cifras',
      instructions: 'Cuatro casas: unidades de mil, centenas, decenas y unidades. ¡Colócalas tú!',
      selector: { kinds: ['column-add'], digits: 4, regroup: 'any' },
      count: 5,
      params: { place: true },
    }),
    activityNode('word', {
      kind: 'word',
      title: 'El problema del río',
      instructions: 'Lee despacio. ¿Hay que juntar? Entonces, ¡a sumar!',
      selector: { kinds: ['word-problem'], skills: ['add:3d:c1', 'add:3d:c2', 'add:4d:c1', 'add:4d:c2'] },
      count: 3,
    }),
    activityNode('bubbles', {
      kind: 'bubbles',
      title: 'Burbujas del bosque',
      instructions: 'Repaso del Bosque: explota la burbuja que tiene el resultado correcto.',
      selector: { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [2, 9] },
      count: 8,
      params: { choices: 4 },
    }),
    guardianNode('El desafío de la Rana Saltarina', 'w2-guardian'),
  ],
})
