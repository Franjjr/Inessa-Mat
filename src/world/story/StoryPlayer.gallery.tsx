/* Gallery: the prologue and a rescue scene in iPad landscape and portrait frames. */
import type { GalleryEntry } from '@/dev/Gallery'
import { getStory } from '@/content'
import StoryPlayer from './StoryPlayer'

const IDS = ['prologue', 'w1-rescue']
const FRAMES = [
  { name: 'ipad', width: 1180, height: 820 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
]

const entries: GalleryEntry[] = FRAMES.flatMap((frame) =>
  IDS.map((id) => ({
    title: `StoryPlayer ${id} · ${frame.name}`,
    width: frame.width,
    height: frame.height,
    background: 'var(--c-bg)',
    render: () => {
      const story = getStory(id)
      return story ? <StoryPlayer story={story} onDone={() => undefined} /> : <p>Sin historia {id}</p>
    },
  })),
)

export default entries
