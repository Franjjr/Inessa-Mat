/* Gallery of the board race (die, walking, specials). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import BoardActivity from './index'

const config: ActivityConfig = {
  kind: 'board',
  title: 'Carrera al Castillo',
  instructions: 'Tira el dado y responde.',
  selector: { kinds: ['fact-mul'], tables: [6, 7, 8] },
  count: 12,
  params: {
    squares: 20,
    opponent: 'lumi',
    specials: [
      { at: 4, emoji: '🌀', text: 'Un remolino te lleva atrás.', move: -2 },
      { at: 9, emoji: '🍄', text: '¡Un hongo mágico! Saltas hacia delante.', move: 3 },
    ],
  },
}

const entries: GalleryEntry[] = [
  {
    title: 'Carrera al castillo (ipad)',
    width: 1180,
    height: 820,
    render: () => <BoardActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
  {
    title: 'Carrera al castillo (android)',
    width: 1280,
    height: 800,
    render: () => <BoardActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
