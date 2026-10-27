/* Dev gallery of the Lengua de 3.º grammar exercises: /dev/gallery?only=src/activities/views/lengua/lengua.gallery */
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import type { Exercise } from '@/types'
import ClassifyView from './ClassifyView'
import DictationView from './DictationView'
import MissingLetterView from './MissingLetterView'
import OrderWordsView from './OrderWordsView'
import PairWordsView from './PairWordsView'
import PunctuationView from './PunctuationView'
import SyllableView from './SyllableView'
import TapWordsView from './TapWordsView'
import TransformWordView from './TransformWordView'

/** The first exercise of a kind for a skill; box 2 and up asks for the typed answer (see buildLengua). */
const first = (kind: Exercise['kind'], skill: string, box = 0): Exercise =>
  generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(7), mastery: { [skill]: { box } } as never })[0]

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
  {
    title: 'Letra que falta: elegir',
    render: () => <MissingLetterView exercise={first('lng-missing-letter', 'lng:orto:c-qu')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Palabra completa: escribir',
    render: () => <MissingLetterView exercise={first('lng-missing-letter', 'lng:orto:mayusculas', 2)} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Poner los signos a la frase',
    render: () => <PunctuationView exercise={first('lng-punctuation', 'lng:orto:signos:pregunta')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Tocar la sílaba fuerte',
    render: () => <SyllableView exercise={first('lng-stress', 'lng:orto:tonica')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Contar las sílabas',
    render: () => <SyllableView exercise={first('lng-syllables', 'lng:gram:silabas')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Dictado: escuchar y escribir',
    render: () => <DictationView exercise={first('lng-dictation', 'lng:escr:dictado', 2)} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Ordenar por el abecedario',
    render: () => <OrderWordsView exercise={first('lng-alphabet', 'lng:voc:abecedario')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Sinónimos: elegir',
    render: () => <PairWordsView exercise={first('lng-pair-words', 'lng:voc:sinonimos')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Diminutivo: escribir',
    render: () => <PairWordsView exercise={first('lng-pair-words', 'lng:voc:diminutivos')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
]

export default entries