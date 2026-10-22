import { accessories, initialProgress } from '@/content'
import type { GalleryEntry } from '@/dev/Gallery'
import { makeChild } from '@/world/rewards/testing'
import { accessoryStatus, lockedReason } from './logic'
import { ShopView, type ShopItem } from './ShopView'

const child = makeChild({ companion: { ...makeChild().companion, equipped: ['lollipop'] } })
const progress = { ...initialProgress('child-test-1'), stars: 21, starsSpent: 6, accessoriesOwned: ['lollipop', 'bow'], worlds: {} }

const items: ShopItem[] = accessories.map((a) => {
  const status = accessoryStatus(progress, child.companion, a.id)
  return { accessory: a, status, reason: status === 'locked' ? lockedReason(a) : undefined }
})

const noop = () => {}

const gallery: GalleryEntry[] = [
  {
    title: 'ShopView · tienda (iPad)',
    width: 1180,
    height: 820,
    render: () => (
      <ShopView
        companion={child.companion}
        companionName="Bigotes"
        stars={21}
        items={items}
        previewId="cap"
        wearing={['lollipop', 'cap']}
        onPick={noop}
        onBuy={noop}
        onEquip={noop}
        onUnequip={noop}
      />
    ),
  },
  {
    title: 'ShopView · tienda (portrait)',
    width: 820,
    height: 1180,
    render: () => (
      <ShopView
        companion={child.companion}
        companionName="Bigotes"
        stars={21}
        items={items}
        previewId={null}
        wearing={['lollipop']}
        onPick={noop}
        onBuy={noop}
        onEquip={noop}
        onUnequip={noop}
      />
    ),
  },
]

export default gallery
