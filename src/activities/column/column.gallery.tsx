/* Gallery of the column minigame with a story wrapper (sums, subtractions, multiplications). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import ColumnActivity from './index'

const config: ActivityConfig = {
  kind: 'column',
  title: 'Cuentas en columna',
  instructions: 'Escribe el resultado empezando por las unidades.',
  selector: { kinds: ['column-add', 'column-sub', 'column-mul'], digits: 3, regroup: 'one' },
  count: 3,
  params: { guided: true, proof: true },
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad columna (ipad)',
    width: 1180,
    height: 820,
    render: () => <ColumnActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
  {
    title: 'Actividad columna (android)',
    width: 1280,
    height: 800,
    render: () => <ColumnActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
