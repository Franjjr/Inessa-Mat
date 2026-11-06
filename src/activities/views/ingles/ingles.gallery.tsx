/* Dev gallery of the Inglés de 3.º exercises: /dev/gallery?only=src/activities/views/ingles/ingles.gallery */
import type { GalleryEntry } from '@/dev/Gallery'
import { createRng, generate } from '@/engine'
import type { Exercise } from '@/types'
import CompleteView from './CompleteView'
import ListenPickView from './ListenPickView'
import MatchView from './MatchView'
import MemoryView from './MemoryView'
import NumberListenView from './NumberListenView'
import NumberWriteView from './NumberWriteView'
import OperationListenView from './OperationListenView'
import ScrambleView from './ScrambleView'
import WriteWordView from './WriteWordView'

/** The first exercise of a kind for a skill (deterministic). */
const first = (kind: Exercise['kind'], skill: string): Exercise =>
  generate({ skills: [skill], kinds: [kind] }, 1, { rng: createRng(7) })[0]

const entries: GalleryEntry[] = [
  {
    title: 'Oír y tocar el dibujo (animales)',
    render: () => <ListenPickView exercise={first('eng-listen-pick', 'eng:voc:animales')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Unir palabras y dibujos (comida)',
    render: () => <MatchView exercise={first('eng-match', 'eng:voc:comida')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Escribir la palabra en inglés (ropa)',
    render: () => <WriteWordView exercise={first('eng-write-word', 'eng:voc:ropa')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Completar la frase (I like…)',
    render: () => <CompleteView exercise={first('eng-complete', 'eng:frase:i-like')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Juego de memoria (animales)',
    render: () => <MemoryView exercise={first('eng-memory', 'eng:voc:animales')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Ordenar las letras (comida)',
    render: () => <ScrambleView exercise={first('eng-scramble', 'eng:voc:comida')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Escribir un número en inglés',
    render: () => <NumberWriteView exercise={first('eng-num-write', 'eng:num:21-100')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Oír un número y escribir las cifras',
    render: () => <NumberListenView exercise={first('eng-num-listen', 'eng:num:0-20')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
  {
    title: 'Oír una operación y escribir el resultado',
    render: () => <OperationListenView exercise={first('eng-op-listen', 'eng:num:ops:plus')} onAnswered={() => {}} showFeedback={false} />,
    width: 390,
  },
]

export default entries
