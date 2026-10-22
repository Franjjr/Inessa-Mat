/* World 3 — La Cueva del Seis: the 6 table with two tricks (5 and one more; the rhyming evens), skip counting
   by 6, missing factors (+ a review of column addition). */
import { activityNode, guardianNode, lessonNode, storyNode, world } from './dsl'

export const w3 = world({
  id: 'w3',
  index: 3,
  name: 'La Cueva del Seis',
  shortName: 'Cueva',
  background: 'cave',
  guardian: 'ladybug',
  crystalName: 'rojo',
  predicament: 'stuck',
  hook: '¡{pet} no puede salir de un túnel diminuto!',
  skillsSummary: 'La tabla del 6: el 5 y uno más, los pares que riman y el factor que falta',
  path: [[0.12, 0.84], [0.48, 0.88], [0.84, 0.74], [0.86, 0.4], [0.62, 0.16], [0.3, 0.16], [0.14, 0.42], [0.3, 0.62], [0.56, 0.6], [0.64, 0.4]],
  nodes: [
    storyNode('arrival', 'Las mariquitas luminosas', 'w3-arrival'),
    lessonNode('lesson-five', 'Truco 1: el 5 y uno más', 'w3-five'),
    activityNode('necklace', {
      kind: 'necklace',
      title: 'Patas de mariquita',
      instructions: 'Cada mariquita tiene 6 patas. ¡Cuenta de 6 en 6!',
      selector: { kinds: ['skip-count'], tables: [6] },
      count: 3,
      params: { beads: 10 },
    }),
    activityNode('wheel', {
      kind: 'wheel',
      title: 'La rueda del 6',
      instructions: 'Multiplica por 6 cada número de la rueda.',
      selector: { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] },
      count: 8,
      params: { center: 6, numbers: [3, 7, 4, 9, 6, 8, 2, 5] },
    }),
    lessonNode('lesson-rhyme', 'Truco 2: los pares que riman', 'w3-rhyme'),
    storyNode('mid', '¡Se apagan las luces!', 'w3-mid'),
    activityNode('maze', {
      kind: 'maze',
      title: 'El laberinto de las mariquitas',
      instructions: 'Del unicornio al cristal: pisa solo números de la tabla del 6. A la derecha o hacia abajo.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      count: 1,
      params: { table: 6, rows: 6, cols: 6 },
    }),
    activityNode('missing', {
      kind: 'missing',
      title: '¿Qué número falta?',
      instructions: '¿Por cuánto hay que multiplicar? Piensa en la tabla del 6.',
      selector: { kinds: ['missing-factor'], tables: [6], factorRange: [2, 9] },
      count: 6,
    }),
    activityNode('review-river', {
      kind: 'column',
      title: 'Repaso del río',
      instructions: '¡Que no se te olviden las sumas! Cuidado con las llevadas.',
      selector: { kinds: ['column-add'], skills: ['add:3d:c2', 'add:4d:c2'] },
      count: 2,
    }),
    guardianNode('El desafío de la Reina Mariquita', 'w3-guardian'),
  ],
})
