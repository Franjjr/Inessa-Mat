/* Gallery of the word-problem minigame (story problems with the operation chosen first). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import WordActivity from './index'

const config: ActivityConfig = {
  kind: 'word',
  title: 'Problemas de Numeria',
  instructions: 'Lee la historia y elige la operación.',
  selector: { kinds: ['word-problem'], digits: 2 },
  count: 3,
  params: { chooseOp: true },
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad problemas (ipad)',
    width: 1180,
    height: 820,
    render: () => <WordActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
  {
    title: 'Actividad problemas (android)',
    width: 1280,
    height: 800,
    render: () => <WordActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
