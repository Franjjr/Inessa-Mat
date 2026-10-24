/* Dev gallery of the number views: the parts of a number (descomponer), with several answer boxes and one check.
   Open /dev/gallery?only=numeric. Each entry uses a fixed seed. */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import OrdinalView from './OrdinalView'
import PlaceValueView from './PlaceValueView'

const noop = () => {}
const ipad = { width: 1180, height: 820 }
const portrait = { width: 820, height: 1180 }
const phone = { width: 390, height: 844 }
const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>
const expanded = () => generate({ skills: ['num:place:expanded'] }, 1, { rng: createRng(3) })[0]
const ordinal = (skill: string, seed: number) => generate({ skills: [skill] }, 1, { rng: createRng(seed) })[0]

const entries: GalleryEntry[] = [
  { title: 'Descomponer (ipad)', ...ipad, render: () => frame(<PlaceValueView exercise={expanded()} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Descomponer (ipad vertical)', ...portrait, render: () => frame(<PlaceValueView exercise={expanded()} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Descomponer (teléfono)', ...phone, render: () => frame(<PlaceValueView exercise={expanded()} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Ordinales en una fila (ipad)', ...ipad, render: () => frame(<OrdinalView exercise={ordinal('num:ordinal:10', 4)} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Ordinales hasta el 30, leer y escribir (teléfono)', ...phone, render: () => frame(<OrdinalView exercise={ordinal('num:ordinal:30', 5)} onAnswered={noop} showFeedback allowHints />) },
]

export default entries
