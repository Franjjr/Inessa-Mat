/* Dev gallery of the new exercise views: problemas con barras (with and without the drawing, two steps), encuentra el
   error, comprobar, and the division methods (repartir por partes, la galera sin restas, multiplicar hacia arriba).
   Open /dev/gallery?only=newViews (the entries are listed by title). */
import type { ReactNode } from 'react'
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, genBarProblem, genCheckCalc, genErrorHunt, makeDivision, makeDivision3 } from '@/engine'
import BarProblemView from './BarProblemView'
import CheckCalcView from './CheckCalcView'
import DivisionView from './DivisionView'
import ErrorHuntView from './ErrorHuntView'

const bar = genBarProblem('add', createRng(3), true)
const plain = genBarProblem('sub', createRng(8), false)
const twoSteps = genBarProblem('two', createRng(12), true)
const hunt = genErrorHunt('sub', createRng(31), true)
const check = genCheckCalc('sub', createRng(9), false)
const parts = makeDivision(84, 4)
const galeraShort = makeDivision3(384, 4)
const climb = makeDivision(28, 4)

const ipad = { width: 1180, height: 820 }
const portrait = { width: 820, height: 1180 }
const phone = { width: 390, height: 844 }

const frame = (node: ReactNode) => <section style={{ padding: 24 }}>{node}</section>

const entries: GalleryEntry[] = [
  { title: 'Barra: problema con la barra (ipad)', ...ipad, render: () => frame(<BarProblemView exercise={bar} onAnswered={() => {}} showFeedback allowHints guided />) },
  { title: 'Barra: problema con la barra (ipad vertical)', ...portrait, render: () => frame(<BarProblemView exercise={bar} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Barra: problema con la barra (teléfono)', ...phone, render: () => frame(<BarProblemView exercise={bar} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Barra: sin la barra (ipad)', ...ipad, render: () => frame(<BarProblemView exercise={plain} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Barra: dos pasos (ipad)', ...ipad, render: () => frame(<BarProblemView exercise={twoSteps} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Encuentra el error: resta (ipad)', ...ipad, render: () => frame(<ErrorHuntView exercise={hunt} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Comprobar: resta (ipad)', ...ipad, render: () => frame(<CheckCalcView exercise={check} onAnswered={() => {}} showFeedback allowHints />) },
  { title: 'Método: repartir por partes 84 ÷ 4 (ipad)', ...ipad, render: () => frame(<DivisionView exercise={parts} onAnswered={() => {}} divMethod="div-parts" showFeedback allowHints />) },
  { title: 'Método: la galera sin restas 384 ÷ 4 (ipad)', ...ipad, render: () => frame(<DivisionView exercise={galeraShort} onAnswered={() => {}} divMethod="galera-short" showFeedback allowHints />) },
  { title: 'Método: multiplicar hacia arriba 28 ÷ 4 (ipad)', ...ipad, render: () => frame(<DivisionView exercise={climb} onAnswered={() => {}} divMethod="climb" showFeedback allowHints />) },
]

export default entries
