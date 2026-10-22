/* World 6 — El Jardín del Arcoíris: the 7 table (almost all known already; 7×3, 7×7, 7×9 are new) and the 6/7/8
   mix, with the hidden-picture game and a race against one's own record. */
import { activityNode, guardianNode, lessonNode, storyNode, world } from './dsl'

/** "El cristal escondido" from the workbook: an 8×8 picture of a crystal. */
const CRYSTAL_PICTURE = [
  'Y.MMMM.Y',
  '.MPMMPM.',
  'MPPMMPPM',
  'MMMMMMMM',
  '.MPPPPM.',
  '..MPPM..',
  '...MM...',
  'Y......Y',
]

export const w6 = world({
  id: 'w6',
  index: 6,
  name: 'El Jardín del Arcoíris',
  shortName: 'Jardín',
  background: 'rainbow-garden',
  guardian: 'fairy',
  crystalName: 'rosa',
  predicament: 'fog',
  hook: '¡La niebla le ha robado los colores a {pet}!',
  skillsSummary: 'La tabla del 7 y mezcla de las tablas del 6, 7 y 8',
  path: [[0.12, 0.84], [0.17, 0.56], [0.32, 0.32], [0.52, 0.18], [0.71, 0.24], [0.86, 0.44], [0.84, 0.72], [0.64, 0.85], [0.45, 0.74], [0.47, 0.5]],
  nodes: [
    storyNode('arrival', 'Un jardín sin colores', 'w6-arrival'),
    lessonNode('lesson-seven', '¡Ya sabes casi toda!', 'w6-seven'),
    activityNode('wheel', {
      kind: 'wheel',
      title: 'La rueda del 7',
      instructions: 'Multiplica por 7 cada número de la rueda.',
      selector: { kinds: ['fact-mul'], tables: [7], factorRange: [2, 9] },
      count: 8,
      params: { center: 7, numbers: [3, 6, 9, 4, 7, 2, 8, 5] },
    }),
    lessonNode('lesson-nine', 'El truco del 9', 'w6-nine'),
    activityNode('missing', {
      kind: 'missing',
      title: '¿Qué número falta?',
      instructions: 'Piensa: ¿7 por cuánto da ese número?',
      selector: { kinds: ['missing-factor'], tables: [7], factorRange: [2, 9] },
      count: 6,
    }),
    activityNode('pixel', {
      kind: 'pixel',
      title: 'El cristal escondido',
      instructions: 'Resuelve cada multiplicación y colorea su casilla. ¿Qué dibujo aparecerá?',
      selector: { kinds: ['fact-mul'], tables: [7], factorRange: [2, 10] },
      count: 12,
      params: {
        picture: CRYSTAL_PICTURE,
        legend: {
          P: { product: 42, color: 'var(--w6)', name: 'rosa' },
          M: { product: 56, color: 'var(--w5)', name: 'morado' },
          Y: { product: 49, color: 'var(--c-gold)', name: 'amarillo' },
          '.': { color: 'var(--w2-soft)', name: 'azul' },
        },
      },
    }),
    storyNode('mid', 'La rima del arcoíris', 'w6-mid'),
    activityNode('memory', {
      kind: 'memory',
      title: 'Parejas del arcoíris',
      instructions: 'Busca las parejas: cada multiplicación con su resultado.',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [3, 9] },
      count: 6,
    }),
    activityNode('race', {
      kind: 'race',
      title: 'Carrera contra tu récord',
      instructions: 'Solo compites contra ti. ¡Intenta mejorar tu tiempo y tus aciertos!',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [2, 9] },
      count: 20,
    }),
    guardianNode('El desafío del Hada Iris', 'w6-guardian'),
  ],
})
