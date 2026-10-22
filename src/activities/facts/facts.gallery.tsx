/* Gallery of the times-table minigames (dev only): /dev/gallery?only=src/activities/facts */
import type { ReactNode } from 'react'
import type { ActivityConfig, ActivityKind } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import Bubbles from '../bubbles'
import Chain from '../chain'
import Family from '../family'
import Facts from './index'
import Maze from '../maze'
import Memory from '../memory'
import Missing from '../missing'
import Necklace from '../necklace'
import Pixel from '../pixel'
import Race from '../race'
import Wheel from '../wheel'

const noop = () => {}
const CRYSTAL = [
  'Y.MMMM.Y',
  '.MPMMPM.',
  'MPPMMPPM',
  'MMMMMMMM',
  '.MPPPPM.',
  '..MPPM..',
  '...MM...',
  'Y......Y',
]

function cfg(kind: ActivityKind, extra: Partial<ActivityConfig> & Pick<ActivityConfig, 'title' | 'instructions' | 'selector'>): ActivityConfig {
  return { kind, ...extra }
}

function activity(Comp: (p: { config: ActivityConfig; onDone: () => void; onExit?: () => void }) => ReactNode, config: ActivityConfig): () => ReactNode {
  return () => <Comp config={config} onDone={noop} onExit={noop} />
}

const W = 1180
const H = 820

const entries: GalleryEntry[] = [
  {
    title: 'facts · práctica tranquila (truco)',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Facts, cfg('facts', {
      title: 'Práctica tranquila',
      instructions: 'Resuelve con calma. ¡Usa los trucos!',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8] },
      count: 8,
      params: { showTrick: true },
    })),
  },
  {
    title: 'race · carrera contra tu récord',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Race, cfg('race', {
      title: 'Carrera contra tu récord',
      instructions: 'Solo compites contra ti.',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [2, 9] },
      count: 10,
      params: { records: [42000, 51000] },
    })),
  },
  {
    title: 'missing · ¿qué número falta?',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Missing, cfg('missing', {
      title: '¿Qué número falta?',
      instructions: 'Piensa en la tabla del 6.',
      selector: { kinds: ['missing-factor'], tables: [6], factorRange: [2, 9] },
      count: 6,
    })),
  },
  {
    title: 'wheel · la rueda del 6',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Wheel, cfg('wheel', {
      title: 'La rueda del 6',
      instructions: 'Multiplica por 6 cada número de la rueda.',
      selector: { kinds: ['fact-mul'], tables: [6], factorRange: [2, 9] },
      count: 8,
      params: { center: 6, numbers: [3, 7, 4, 9, 6, 8, 2, 5] },
    })),
  },
  {
    title: 'necklace · patas de mariquita',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Necklace, cfg('necklace', {
      title: 'Patas de mariquita',
      instructions: 'Cada mariquita tiene 6 patas. ¡Cuenta de 6 en 6!',
      selector: { kinds: ['skip-count'], tables: [6] },
      count: 3,
      params: { beads: 10 },
    })),
  },
  {
    title: 'chain · cadena de dobles',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Chain, cfg('chain', {
      title: 'Cadena de dobles',
      instructions: 'Dobla, dobla y dobla otra vez.',
      selector: { kinds: ['double-chain'], digits: 2 },
      count: 4,
    })),
  },
  {
    title: 'family · familias de números',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Family, cfg('family', {
      title: 'Familias de números',
      instructions: 'Con tres números salen cuatro operaciones.',
      selector: { kinds: ['fact-family'], tables: [6, 7, 8] },
      count: 4,
    })),
  },
  {
    title: 'maze · el laberinto',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Maze, cfg('maze', {
      title: 'El laberinto de las mariquitas',
      instructions: 'Pisa solo números de la tabla del 6. A la derecha o hacia abajo.',
      selector: { kinds: ['fact-mul'], tables: [6] },
      count: 1,
      params: { table: 6, rows: 6, cols: 6 },
    })),
  },
  {
    title: 'pixel · el cristal escondido',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Pixel, cfg('pixel', {
      title: 'El cristal escondido',
      instructions: 'Resuelve cada multiplicación y colorea su casilla.',
      selector: { kinds: ['fact-mul'], tables: [7], factorRange: [2, 10] },
      count: 12,
      params: {
        picture: CRYSTAL,
        legend: {
          P: { product: 42, color: 'var(--w6)', name: 'rosa' },
          M: { product: 56, color: 'var(--w5)', name: 'morado' },
          Y: { product: 49, color: 'var(--c-gold)', name: 'amarillo' },
          '.': { color: 'var(--w2-soft)', name: 'azul' },
        },
      },
    })),
  },
  {
    title: 'memory · parejas del arcoíris',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Memory, cfg('memory', {
      title: 'Parejas del arcoíris',
      instructions: 'Cada multiplicación con su resultado.',
      selector: { kinds: ['fact-mul'], tables: [6, 7, 8], factorRange: [3, 9] },
      count: 6,
    })),
  },
  {
    title: 'bubbles · burbujas del bosque',
    width: W, height: H, background: 'var(--c-bg)',
    render: activity(Bubbles, cfg('bubbles', {
      title: 'Burbujas del bosque',
      instructions: 'Explota la burbuja con el resultado correcto.',
      selector: { kinds: ['fact-mul'], tables: [2, 5, 10], factorRange: [2, 9] },
      count: 8,
      params: { choices: 4 },
    })),
  },
]

export default entries
