/* Gallery of the share minigame (repartos justos). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import ShareActivity from './index'

const config: ActivityConfig = {
  kind: 'share',
  title: 'Repartos justos',
  instructions: 'Reparte de una en una.',
  selector: { kinds: ['fact-div'], tables: [6, 7, 8] },
  count: 2,
  params: { emoji: '🍓', container: '🧺' },
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad reparto (ipad)',
    width: 1180,
    height: 820,
    render: () => <ShareActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
