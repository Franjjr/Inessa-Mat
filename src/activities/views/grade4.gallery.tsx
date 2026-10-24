/* Dev gallery of the 4.º exercises: multiplying by parts and in columns (partial rows), 3 × 1, 4 ÷ 1 and dividing by two digits, adding fractions,
   área, simetría, romanos, por 10 and redondear a millares, at iPad and phone widths. Open /dev/gallery?only=grade4. */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, genFractionAdd, generate } from '@/engine'
import type { Exercise } from '@/types'
import ColumnView from './ColumnView'
import DivisionView from './DivisionView'
import FigureNumberView from './FigureNumberView'
import FractionAddView from './FractionAddView'
import LongMulView from './LongMulView'
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
  { title: 'Multiplicar en columna por filas parciales (ipad)', ...ipad, render: () => frame(<LongMulView exercise={one('mul:col:3x2', 7)} onAnswered={noop} />) },
  { title: 'Multiplicar en columna por filas parciales (teléfono)', ...phone, render: () => frame(<LongMulView exercise={one('mul:col:2x2', 8)} onAnswered={noop} />) },
  { title: 'Multiplicar 3 cifras por 1 (ipad vertical)', ...portrait, render: () => frame(<ColumnView exercise={one('mul:3x1:c1', 2)} onAnswered={noop} />) },
  { title: 'Dividir 4 cifras entre 1 (ipad)', ...ipad, render: () => frame(<DivisionView exercise={one('div:4x1:rem', 5)} onAnswered={noop} />) },
  { title: 'Dividir 4 cifras entre 1 (teléfono)', ...phone, render: () => frame(<DivisionView exercise={one('div:4x1:exact', 6)} onAnswered={noop} />) },
  { title: 'Dividir entre 2 cifras (ipad)', ...ipad, render: () => frame(<DivisionView exercise={one('div:3x2:rem', 4)} onAnswered={noop} guided />) },
  { title: 'Dividir entre 2 cifras (teléfono)', ...phone, render: () => frame(<DivisionView exercise={one('div:3x2:rem', 9)} onAnswered={noop} />) },
  { title: 'Sumar fracciones (ipad)', ...ipad, render: () => frame(<FractionAddView exercise={genFractionAdd(createRng(2), 'add', 'drawing')} onAnswered={noop} />) },
  { title: 'Restar fracciones (teléfono)', ...phone, render: () => frame(<FractionAddView exercise={genFractionAdd(createRng(3), 'sub', 'drawing')} onAnswered={noop} />) },
  { title: 'Sumar fracciones con números (teléfono)', ...phone, render: () => frame(<FractionAddView exercise={genFractionAdd(createRng(4), 'add', 'numbers')} onAnswered={noop} />) },
  { title: 'Área en cuadraditos (ipad)', ...ipad, render: () => frame(<FigureNumberView exercise={one('geo:area', 2)} onAnswered={noop} />) },
  { title: 'Área en cuadraditos (teléfono)', ...phone, render: () => frame(<FigureNumberView exercise={one('geo:area', 7)} onAnswered={noop} />) },
  { title: 'Simetría (ipad)', ...ipad, render: () => frame(<ShapeChoiceView exercise={one('geo:symmetry', 3)} onAnswered={noop} />) },
  { title: 'Simetría (teléfono)', ...phone, render: () => frame(<ShapeChoiceView exercise={one('geo:symmetry', 8)} onAnswered={noop} />) },
  { title: 'Números romanos (teléfono)', ...phone, render: () => frame(<MentalView exercise={one('mental:romanos', 2)} onAnswered={noop} />) },
  { title: 'Por 10, 100 y 1 000 (ipad)', ...ipad, render: () => frame(<MentalView exercise={one('mental:por10', 4)} onAnswered={noop} />) },
  { title: 'Redondear a millares (ipad vertical)', ...portrait, render: () => frame(<RoundView exercise={one('num:round:1000', 3)} onAnswered={noop} />) },
]

export default entries
