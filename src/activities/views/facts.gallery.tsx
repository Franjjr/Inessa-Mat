/* Gallery of the facts exercise views (dev only): /dev/gallery?only=src/activities/views */
import type { ReactNode } from 'react'
import { makeDoubleChain, makeFactDiv, makeFactFamily, makeFactMul, makeMissingFactor, makeSkipCount } from '@/engine'
import type { GalleryEntry } from '@/dev/Gallery'
import type { ExerciseViewProps } from '@/types'
import DoubleChainView from './DoubleChainView'
import FactFamilyView from './FactFamilyView'
import FactView from './FactView'
import MissingFactorView from './MissingFactorView'
import SkipCountView from './SkipCountView'

const noop = () => {}

function frame(View: (p: ExerciseViewProps) => ReactNode, props: Partial<ExerciseViewProps> & { exercise: ExerciseViewProps['exercise'] }) {
  return <View onAnswered={noop} allowHints {...props} />
}

const entries: GalleryEntry[] = [
  {
    title: 'FactView · 7 × 6 (pista disponible)',
    width: 560,
    height: 360,
    background: 'var(--c-bg)',
    render: () => <FactView exercise={makeFactMul(7, 6)} onAnswered={noop} allowHints />,
  },
  {
    title: 'FactView · 42 ÷ 6 (guiada)',
    width: 560,
    height: 360,
    background: 'var(--c-bg)',
    render: () => <FactView exercise={makeFactDiv(42, 6)} onAnswered={noop} guided allowHints />,
  },
  {
    title: 'FactView · compacta',
    width: 640,
    height: 220,
    background: 'var(--c-bg)',
    render: () => <FactView exercise={makeFactMul(8, 4)} onAnswered={noop} compact />,
  },
  {
    title: 'MissingFactorView · 6 × ? = 42',
    width: 560,
    height: 360,
    background: 'var(--c-bg)',
    render: () => frame(MissingFactorView, { exercise: makeMissingFactor(6, 7, 'b') }),
  },
  {
    title: 'SkipCountView · collar del 6',
    width: 720,
    height: 420,
    background: 'var(--c-bg)',
    render: () => frame(SkipCountView, { exercise: makeSkipCount(6, 1, 10, [2, 5, 8]) }),
  },
  {
    title: 'DoubleChainView · 3 → 24',
    width: 720,
    height: 420,
    background: 'var(--c-bg)',
    render: () => frame(DoubleChainView, { exercise: makeDoubleChain(3, 3) }),
  },
  {
    title: 'FactFamilyView · 6, 7, 42',
    width: 620,
    height: 620,
    background: 'var(--c-bg)',
    render: () => frame(FactFamilyView, { exercise: makeFactFamily(6, 7) }),
  },
]

export default entries
