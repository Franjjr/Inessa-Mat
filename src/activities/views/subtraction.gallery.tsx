/* Dev gallery for the subtraction methods (352 − 127 with each method), on an iPad landscape and portrait.
   Open /dev/gallery?only=subtraction */
import type { GalleryEntry } from '@/dev/Gallery'
import { makeColumnSub } from '@/engine'
import type { SubMethod } from '@/types'
import SubtractionView from './SubtractionView'

const ex = makeColumnSub(352, 127)
const METHODS: { method: SubMethod; title: string }[] = [
  { method: 'borrow', title: 'Resta: pedir prestado arriba' },
  { method: 'carry', title: 'Resta: me llevo una abajo' },
  { method: 'parts', title: 'Resta: por partes' },
  { method: 'line', title: 'Resta: saltos en la recta' },
]

const entries: GalleryEntry[] = METHODS.flatMap(({ method, title }) => [
  {
    title: `${title} (ipad)`,
    width: 1180,
    height: 820,
    render: () => (
      <section style={{ padding: 24 }}>
        <SubtractionView exercise={ex} onAnswered={() => {}} method={method} guided showFeedback allowHints />
      </section>
    ),
  },
  {
    title: `${title} (ipad vertical)`,
    width: 820,
    height: 1180,
    render: () => (
      <section style={{ padding: 24 }}>
        <SubtractionView exercise={ex} onAnswered={() => {}} method={method} guided showFeedback allowHints />
      </section>
    ),
  },
])

export default entries
