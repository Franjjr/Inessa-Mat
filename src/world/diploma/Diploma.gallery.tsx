import type { GalleryEntry } from '@/dev/Gallery'
import { makeChild } from '@/world/rewards/testing'
import { DiplomaCertificate } from './DiplomaCertificate'

const gallery: GalleryEntry[] = [
  {
    title: 'DiplomaCertificate · A4 horizontal (iPad)',
    width: 1180,
    height: 820,
    render: () => <DiplomaCertificate child={makeChild()} date="2026-10-22T10:00:00.000Z" />,
  },
]

export default gallery
