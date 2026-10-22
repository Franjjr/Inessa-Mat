/* Gallery of the array minigame (fill the frame, then count and see it turn over). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import ArrayActivity from './index'

const config: ActivityConfig = {
  kind: 'array',
  title: 'Construye el rectángulo',
  instructions: 'Llena el rectángulo y cuenta.',
  selector: { kinds: ['array'] },
  count: 2,
  params: { mirror: true },
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad array (ipad)',
    width: 1180,
    height: 820,
    render: () => <ArrayActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
