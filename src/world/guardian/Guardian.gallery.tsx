import { getGuardian, getWorld } from '@/content'
import type { GalleryEntry } from '@/dev/Gallery'
import GuardianChallenge from './GuardianChallenge'

const owl = getGuardian('w1-guardian')!
const w1 = getWorld('w1')!
const noop = () => {}

const gallery: GalleryEntry[] = [
  {
    title: 'GuardianChallenge · intro (Búho, iPad)',
    width: 1180,
    height: 820,
    render: () => (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <GuardianChallenge guardian={owl} world={w1} onPass={noop} onFail={noop} onExit={noop} />
      </div>
    ),
  },
  {
    title: 'GuardianChallenge · intro (Búho, portrait)',
    width: 820,
    height: 1180,
    render: () => (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <GuardianChallenge guardian={owl} world={w1} onPass={noop} onFail={noop} onExit={noop} />
      </div>
    ),
  },
]

export default gallery
