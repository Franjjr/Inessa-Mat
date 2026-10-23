/* Dev gallery of the 4.º exercises: multiplying by parts, 3 × 1 and 4 ÷ 1 in columns, área, simetría, romanos, por 10
   and redondear a millares, at iPad and phone widths. Open /dev/gallery?only=grade4. */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import type { Exercise } from '@/types'
import ColumnView from './ColumnView'
import DivisionView from './DivisionView'
import FigureNumberView from './FigureNumberView'
import MentalView from './MentalView'
import MulPartsView from './MulPartsView'
import RoundView from './RoundView'
import ShapeChoiceView from './ShapeChoiceView'

const ipad = { width: 1180, height: 820 }
const portrait = { width: 820, height: 1180 }
const phone = { width: 390, height: 844 }

const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>
const noop = () => {}
const one = (skill: string, seed: number): Exercise => generate({ skills: [skill] }, 1, { rng: createRng(seed) })[0]

const entries: GalleryEntry[] = [
  { title: 'Multiplicar por partes (ipad)', ...ipad, render: () => frame(<MulPartsView exercise={one('mul:2dx2d', 3)} onAnswered={noop} />) },
  { title: 'Multiplicar por partes (teléfono)', ...phone, render: () => frame(<MulPartsView exercise={one('mul:3dx2d', 4)} onAnswered={noop} />) },
  { title: 'Multiplicar 3 cifras por 1 (ipad vertical)', ...portrait, render: () => frame(<ColumnView exercise={one('mul:3x1:c1', 2)} onAnswered={noop} />) },
  { title: 'Dividir 4 cifras entre 1 (ipad)', ...ipad, render: () => frame(<DivisionView exercise={one('div:4x1:rem', 5)} onAnswered={noop} />) },
  { title: 'Dividir 4 cifras entre 1 (teléfono)', ...phone, render: () => frame(<DivisionView exercise={one('div:4x1:exact', 6)} onAnswered={noop} />) },
  { title: 'Área en cuadraditos (ipad)', ...ipad, render: () => frame(<FigureNumberView exercise={one('geo:area', 2)} onAnswered={noop} />) },
  { title: 'Área en cuadraditos (teléfono)', ...phone, render: () => frame(<FigureNumberView exercise={one('geo:area', 7)} onAnswered={noop} />) },
  { title: 'Simetría (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={one('geo:symmetry', 3)} onAnswered={noop} />) },
  { title: 'Simetría (teléfono)', ...phone, render: () => frame(<ShapeChoiceView exercise={one('geo:symmetry', 8)} onAnswered={noop} />) },
  { title: 'Números romanos (teléfono)', ...phone, render: () => frame(<MentalView exercise={one('mental:romanos', 2)} onAnswered={noop} />) },
  { title: 'Por 10, 100 y 1 000 (ipad)', ...ipad, render: () => frame(<MentalView exercise={one('mental:por10', 4)} onAnswered={noop} />) },
  { title: 'Redondear a millares (ipad vertical)', ...portrait, render: () => frame(<RoundView exercise={one('num:round:1000', 3)} onAnswered={noop} />) },
]

export default entries
