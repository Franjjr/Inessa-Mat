/* World 7 — La Forja del Dragón: 2-digit × 1-digit (by pieces, in column, with carries), the board game to keep
   the 6/7/8 facts fluent, story problems and an adaptive review. */
import { activityNode, guardianNode, lessonNode, reviewNode, storyNode, world } from './dsl'

export const w7 = world({
  id: 'w7',
  index: 7,
  name: 'La Forja del Dragón',
  shortName: 'Forja',
  background: 'volcano',
  guardian: 'dragon',
  crystalName: 'naranja',
  predicament: 'cage',
  hook: '¡{pet} se ha quedado {pg:encerrada|encerrado} en un farolillo!',
  skillsSummary: 'Multiplicar 2 cifras × 1 cifra: por trocitos, en columna y con llevadas',
  path: [[0.12, 0.86], [0.14, 0.58], [0.2, 0.28], [0.38, 0.18], [0.46, 0.46], [0.5, 0.78], [0.68, 0.86], [0.78, 0.58], [0.8, 0.3], [0.86, 0.13]],
  nodes: [
    storyNode('arrival', 'El farolillo de la forja', 'w7-arrival'),
    lessonNode('lesson-split', 'Multiplicar por trocitos', 'w7-split'),
    activityNode('column-easy', {
      kind: 'column',
      title: 'En columna, sin llevadas',
      instructions: 'Primero las unidades, después las decenas.',
      selector: { kinds: ['column-mul'], regroup: 'none' },
      count: 4,
      params: { guided: true, split: true },
    }),
    lessonNode('lesson-carry', 'Multiplicar con llevadas', 'w7-carry'),
    activityNode('column-carry', {
      kind: 'column',
      title: 'Con llevadas',
      instructions: 'Escribe la llevada arriba y súmala después de multiplicar.',
      selector: { kinds: ['column-mul'], regroup: 'one' },
      count: 6,
    }),
    storyNode('mid', 'Las llevadas de la forja', 'w7-mid'),
    activityNode('board', {
      kind: 'board',
      title: 'Carrera al Castillo',
      instructions: 'Tira el dado y di el resultado de tu casilla. ¡Gana quien llegue antes al castillo!',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [2, 9] },
      count: 1,
      params: {
        squares: 30,
        opponent: 'lumi',
        specials: [
          { at: 5, emoji: '🌈', text: '¡Arcoíris! Avanza 2.', move: 2 },
          { at: 9, emoji: '☁️', text: 'Niebla de Borrón: retrocede 2.', move: -2 },
          { at: 13, emoji: '🦄', text: 'Lumi te lleva: avanza 3.', move: 3 },
          { at: 17, emoji: '☁️', text: 'Niebla: retrocede 1.', move: -1 },
          { at: 21, emoji: '⭐', text: 'Di la tabla del 7 en voz alta: avanza 2.', move: 2 },
          { at: 26, emoji: '☁️', text: 'Niebla: vuelve a la casilla 22.', move: -4 },
        ],
      },
    }),
    activityNode('word', {
      kind: 'word',
      title: 'El problema de Chispa',
      instructions: 'Lee despacio. ¿Qué hay que hacer? Elige la operación y resuélvela.',
      selector: { kinds: ['word-problem'], skills: ['mul:2x1:c0', 'mul:2x1:c1'] },
      count: 3,
      params: { chooseOp: true },
    }),
    reviewNode('review', 'Repaso mágico'),
    guardianNode('El desafío de la dragona Chispa', 'w7-guardian'),
  ],
})
