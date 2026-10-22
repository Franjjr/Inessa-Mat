/* Gallery of the groups minigame (build equal groups, then count and write the total). */
import type { ActivityConfig } from '@/types'
import type { GalleryEntry } from '@/dev/Gallery'
import GroupsActivity from './index'

const config: ActivityConfig = {
  kind: 'groups',
  title: 'Grupos iguales',
  instructions: 'Haz grupos iguales y cuenta.',
  selector: { kinds: ['groups'] },
  count: 2,
}

const entries: GalleryEntry[] = [
  {
    title: 'Actividad grupos (ipad)',
    width: 1180,
    height: 820,
    render: () => <GroupsActivity config={config} onDone={() => {}} onExit={() => {}} />,
  },
]

export default entries
