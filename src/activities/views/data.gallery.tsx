/* Dev gallery of gráficos, probabilidad, series y posición: every mode at iPad and phone widths.
   Open /dev/gallery?only=data (the entries are listed by title). */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import type { Exercise } from '@/types'
import DataView from './DataView'

const ipad = { width: 1180, height: 820 }
const portrait = { width: 820, height: 1180 }
const phone = { width: 390, height: 844 }

const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>
const noop = () => {}
const one = (skill: string, seed: number): Exercise => generate({ skills: [skill] }, 1, { rng: createRng(seed) })[0]
const view = (ex: Exercise) => frame(<DataView exercise={ex} onAnswered={noop} showFeedback allowHints />)

const entries: GalleryEntry[] = [
  { title: 'Gráficos: pictograma (ipad)', ...ipad, render: () => view(one('chart:pict', 3)) },
  { title: 'Gráficos: pictograma, cada dibujo vale 5 (teléfono)', ...phone, render: () => view(one('chart:pict:x', 4)) },
  { title: 'Gráficos: barras (ipad)', ...ipad, render: () => view(one('chart:bars', 2)) },
  { title: 'Gráficos: barras (teléfono)', ...phone, render: () => view(one('chart:bars', 5)) },
  { title: 'Gráficos: tabla de doble entrada (teléfono)', ...phone, render: () => view(one('chart:table', 2)) },
  { title: 'Gráficos: la moda (ipad vertical)', ...portrait, render: () => view(one('chart:mode', 1)) },
  { title: 'Probabilidad: la bolsa (ipad)', ...ipad, render: () => view(one('prob:chance', 6)) },
  { title: 'Series: figuras (ipad)', ...ipad, render: () => view(one('pattern:shapes', 2)) },
  { title: 'Series: figuras (teléfono)', ...phone, render: () => view(one('pattern:shapes', 7)) },
  { title: 'Series: números (ipad vertical)', ...portrait, render: () => view(one('pattern:numbers', 3)) },
  { title: 'Series: más adelante (teléfono)', ...phone, render: () => view(one('pattern:predict', 2)) },
  { title: 'Posición: dónde está (ipad)', ...ipad, render: () => view(one('pos:relative', 4)) },
  { title: 'Posición: qué hay al lado (teléfono)', ...phone, render: () => view(one('pos:next', 3)) },
  { title: 'Posición: recorrido (ipad vertical)', ...portrait, render: () => view(one('pos:route', 5)) },
  { title: 'Posición: recorrido (teléfono)', ...phone, render: () => view(one('pos:route', 8)) },
]

export default entries
