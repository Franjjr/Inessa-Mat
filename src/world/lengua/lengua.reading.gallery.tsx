/* Dev gallery of the Lengua de 3.º reading screen: /dev/gallery?only=src/world/lengua/lengua.reading.gallery */
import type { GalleryEntry } from '@/dev/Gallery'
import { readingById } from '@/content/lengua/stories'
import { ReadingScreen } from './ReadingScreen'

const entries: GalleryEntry[] = [
  {
    title: 'Lectura: la tarta que quería ir a la playa',
    render: () => <ReadingScreen reading={readingById('historia-tarta')!} onDone={() => {}} />,
  },
]

export default entries
