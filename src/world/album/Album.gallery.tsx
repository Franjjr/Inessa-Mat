import { initialProgress } from '@/content'
import type { GalleryEntry } from '@/dev/Gallery'
import { makeChild } from '@/world/rewards/testing'
import { AlbumView } from './AlbumView'
import { albumPages, albumTotals } from './logic'

const progress = { ...initialProgress('child-test-1'), stickers: ['w1-seta', 'w1-flor', 'w2-pez', 'dias-3'] }
const pages = albumPages(progress, makeChild())
const totals = albumTotals(pages)

const gallery: GalleryEntry[] = [
  {
    title: 'AlbumView · álbum (iPad)',
    width: 1180,
    height: 820,
    render: () => <AlbumView pages={pages} owned={totals.owned} total={totals.total} initialPage="w1" />,
  },
]

export default gallery
