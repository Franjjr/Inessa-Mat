/* Dev gallery of dinero and medida: every mode of the money and measure views, the coins and notes, at iPad,
   iPad vertical and phone widths. Open /dev/gallery?only=moneyMeasure (the entries are listed by title). */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { buildMeasure, buildMoney, createRng } from '@/engine'
import MeasureView from './MeasureView'
import MoneyView from './MoneyView'
import { MoneyPiece } from './MoneyPiece'

const ipad = { width: 1180, height: 820 }
const portrait = { width: 820, height: 1180 }
const phone = { width: 390, height: 844 }

const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>
const noop = () => {}

const pay = buildMoney('pay', createRng(4), new Set())
const change = buildMoney('change', createRng(7), new Set())
const add = buildMoney('add', createRng(9), new Set())
const recognise = buildMoney('recognise', createRng(2), new Set())
const compare = buildMoney('compare', createRng(5), new Set())
const convert = buildMoney('convert', createRng(8), new Set())
const unit = buildMeasure('unit', 'mass', createRng(3), new Set())
const conv = buildMeasure('convert', 'capacity', createRng(6), new Set())
const ruler = buildMeasure('ruler', null, createRng(11), new Set())
const addM = buildMeasure('add', 'length', createRng(13), new Set())
const est = buildMeasure('estimate', null, createRng(17), new Set())

const entries: GalleryEntry[] = [
  { title: 'Dinero: monedas y billetes (ipad)', ...ipad, render: () => frame(<div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
    {[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].map((v) => <MoneyPiece key={v} value={v} size="md" label />)}
  </div>) },
  { title: 'Dinero: pagar con la bandeja (ipad)', ...ipad, render: () => frame(<MoneyView exercise={pay} onAnswered={noop} showFeedback allowHints guided />) },
  { title: 'Dinero: pagar con la bandeja (teléfono)', ...phone, render: () => frame(<MoneyView exercise={pay} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Dinero: reconocer la moneda (ipad)', ...ipad, render: () => frame(<MoneyView exercise={recognise} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Dinero: el cambio (ipad vertical)', ...portrait, render: () => frame(<MoneyView exercise={change} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Dinero: sumar precios (ipad)', ...ipad, render: () => frame(<MoneyView exercise={add} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Dinero: qué cuesta más (teléfono)', ...phone, render: () => frame(<MoneyView exercise={compare} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Dinero: euros y céntimos (ipad)', ...ipad, render: () => frame(<MoneyView exercise={convert} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: la unidad de un objeto (ipad)', ...ipad, render: () => frame(<MeasureView exercise={unit} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: conversiones (ipad)', ...ipad, render: () => frame(<MeasureView exercise={conv} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: la regla (ipad)', ...ipad, render: () => frame(<MeasureView exercise={ruler} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: la regla (teléfono)', ...phone, render: () => frame(<MeasureView exercise={ruler} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: sumar medidas (ipad vertical)', ...portrait, render: () => frame(<MeasureView exercise={addM} onAnswered={noop} showFeedback allowHints />) },
  { title: 'Medida: ¿es razonable? (teléfono)', ...phone, render: () => frame(<MeasureView exercise={est} onAnswered={noop} showFeedback allowHints />) },
]

export default entries
