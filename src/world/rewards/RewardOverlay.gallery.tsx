import { getWorld } from '@/content'
import type { GalleryEntry } from '@/dev/Gallery'
import RewardOverlay from './RewardOverlay'

// The overlay is position: fixed; a transformed wrapper keeps it inside the gallery frame.
const frame = (node: React.ReactNode) => (
  <div style={{ position: 'relative', width: '100%', height: '100%', transform: 'translateZ(0)', overflow: 'hidden' }}>{node}</div>
)

const w1 = getWorld('w1')!
const w4 = getWorld('w4')!

const gallery: GalleryEntry[] = [
  {
    title: 'RewardOverlay · 3 estrellas',
    width: 1180,
    height: 820,
    render: () => frame(<RewardOverlay kind="node" stars={3} world={w1} newStickers={['w1-seta']} onContinue={() => {}} />),
  },
  {
    title: 'RewardOverlay · cristal (Bosque)',
    width: 1180,
    height: 820,
    render: () => frame(<RewardOverlay kind="crystal" stars={3} world={w1} letter="V" newStickers={['w1-buho']} onContinue={() => {}} />),
  },
  {
    title: 'RewardOverlay · cristal (Montaña, portrait)',
    width: 820,
    height: 1180,
    render: () => frame(<RewardOverlay kind="crystal" stars={2} world={w4} letter="I" onContinue={() => {}} />),
  },
  {
    title: 'RewardOverlay · temporada',
    width: 1180,
    height: 820,
    render: () => frame(<RewardOverlay kind="season" stars={3} world={w4} letter="E" onContinue={() => {}} />),
  },
]

export default gallery
