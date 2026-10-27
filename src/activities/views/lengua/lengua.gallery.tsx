/* Dev gallery of the Lengua de 3.º grammar exercises: /dev/gallery?only=src/activities/views/lengua/lengua.gallery */
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import type { Exercise } from '@/types'
import ClassifyView from './ClassifyView'
import TapWordsView from './TapWordsView'
import TransformWordView from './TransformWordView'

const first = (kind: Exercise['kind'], skill: string): Exercise => generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(7) })[0]

const entries: GalleryEntry[] = [
  {
    title: 'Tocar los sustantivos de una frase',
    render: () => <TapWordsView exercise={first('lng-tap-words', 'lng:gram:sustantivo:clase')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Tocar el sujeto',
    render: () => <TapWordsView exercise={first('lng-sentence-parts', 'lng:gram:oracion:sujeto')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Clasificar: común o propio',
    render: () => <ClassifyView exercise={first('lng-classify', 'lng:gram:sustantivo:clase')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Escribir en plural',
    render: () => <TransformWordView exercise={first('lng-transform', 'lng:gram:sustantivo:numero')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
]

export default entries
