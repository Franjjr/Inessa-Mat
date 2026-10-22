/* Gallery of the division minigame (the galera, step by step). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import DivisionActivity from './index'

const config: ActivityConfig = {
  kind: 'division',
  title: 'La galera',
  instructions: 'Reparte paso a paso.',
  selector: { kinds: ['division'], divisionVariants: ['exact', 'rem', 'long'] },
  count: 3,
  params: { guided: true, proof: true },
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad galera (ipad)',
    width: 1180,
    height: 820,
    render: () => <DivisionActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
  {
    title: 'Actividad galera (portrait)',
    width: 820,
    height: 1180,
    render: () => <DivisionActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
