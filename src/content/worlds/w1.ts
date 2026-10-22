/* World 1 — El Bosque de los Grupos: what multiplying is (equal groups, arrays), the mirror rule and the easy
   tables ×1 ×2 ×5 ×10, with a gentle review of ×3 and ×4. */
import { activityNode, guardianNode, lessonNode, storyNode, world } from './dsl'

export const w1 = world({
  id: 'w1',
  index: 1,
  name: 'El Bosque de los Grupos',
  shortName: 'Bosque',
  background: 'forest',
  guardian: 'owl',
  crystalName: 'verde',
  predicament: 'vines',
  hook: '¡{pet} se ha enredado en las lianas de las hadas!',
  skillsSummary: 'Qué es multiplicar, la regla del espejo y las tablas fáciles (×1, ×2, ×5, ×10)',
  path: [[0.12, 0.82], [0.36, 0.86], [0.62, 0.8], [0.84, 0.64], [0.68, 0.5], [0.4, 0.52], [0.18, 0.4], [0.3, 0.2], [0.58, 0.15], [0.86, 0.2]],
  nodes: [
    storyNode('arrival', 'Las lianas de las hadas', 'w1-arrival'),
    lessonNode('lesson-groups', '¿Qué es multiplicar?', 'w1-groups'),
    activityNode('groups', {
      kind: 'groups',
      title: 'Cuenta los grupos de las hadas',
      instructions: 'Cuenta los grupos. Escribe la suma y después la multiplicación.',
      selector: { kinds: ['groups'], factorRange: [2, 5] },
      count: 6,
      params: { showSum: true },
    }),
    activityNode('array', {
      kind: 'array',
      title: 'Filas de flores',
      instructions: '¿Cuántas filas hay? ¿Cuántas flores en cada fila?',
      selector: { kinds: ['array'], factorRange: [2, 6] },
      count: 6,
      params: { mirror: true },
    }),
    lessonNode('lesson-easy', 'Las tablas fáciles', 'w1-easy'),
    activityNode('necklace', {
      kind: 'necklace',
      title: 'Los collares de las hadas',
      instructions: 'Cuenta saltando y escribe las cuentas que faltan.',
      selector: { kinds: ['skip-count'], tables: [2, 3, 4, 5] },
      count: 4,
      params: { beads: 10 },
    }),
    storyNode('mid', '¡Borrón desordena las setas!', 'w1-mid'),
    activityNode('facts', {
      kind: 'facts',
      title: 'Tablas fáciles',
      instructions: 'Usa los trucos: por 1, por 2, por 5 y por 10. ¡Y no te olvides del espejo!',
      selector: { kinds: ['fact-mul'], tables: [1, 2, 5, 10] },
      count: 12,
      params: { showTrick: true },
    }),
    activityNode('memory', {
      kind: 'memory',
      title: 'Parejas del bosque',
      instructions: 'Da la vuelta a dos cartas. Busca cada multiplicación con su resultado.',
      selector: { kinds: ['fact-mul'], tables: [2, 3, 4, 5], factorRange: [2, 5] },
      count: 6,
    }),
    guardianNode('El desafío del Búho Sabio', 'w1-guardian'),
  ],
})
