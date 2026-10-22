/* Gallery of the operations exercise views (groups, arrays, column, galera, word problems). */
import { makeArray, makeColumnAdd, makeColumnMul, makeColumnSub, makeDivision, makeGroups, makeWordProblem } from '@/engine'
import type { GalleryEntry } from '@/dev/Gallery'
import GroupsView from './GroupsView'
import ArrayView from './ArrayView'
import ColumnView from './ColumnView'
import DivisionView from './DivisionView'
import WordProblemView from './WordProblemView'

const noop = () => {}
const frame = { width: 640 }

const entries: GalleryEntry[] = [
  {
    title: 'Grupos · contar y escribir el total',
    ...frame,
    render: () => <GroupsView exercise={makeGroups(3, 4, '🍄')} onAnswered={noop} showSum allowHints />,
  },
  {
    title: 'Grupos · compacto',
    ...frame,
    render: () => <GroupsView exercise={makeGroups(2, 5, '🌸')} onAnswered={noop} compact />,
  },
  {
    title: 'Array · 3 filas de 5',
    ...frame,
    render: () => <ArrayView exercise={makeArray(3, 5, '⭐')} onAnswered={noop} guided />,
  },
  {
    title: 'Array · se gira (espejo)',
    ...frame,
    render: () => <ArrayView exercise={makeArray(4, 6, '🍎')} onAnswered={noop} mirror />,
  },
  {
    title: 'Columna · suma con llevadas',
    ...frame,
    render: () => <ColumnView exercise={makeColumnAdd([368, 257])} onAnswered={noop} guided />,
  },
  {
    title: 'Columna · resta con préstamos',
    ...frame,
    render: () => <ColumnView exercise={makeColumnSub(503, 128)} onAnswered={noop} proof guided />,
  },
  {
    title: 'Columna · 2 × 1 con llevada',
    ...frame,
    render: () => <ColumnView exercise={makeColumnMul(47, 6)} onAnswered={noop} />,
  },
  {
    title: 'Galera · 84 ÷ 4',
    width: 640,
    render: () => <DivisionView exercise={makeDivision(84, 4)} onAnswered={noop} guided />,
  },
  {
    title: 'Galera · 17 ÷ 5 con resto',
    width: 640,
    render: () => <DivisionView exercise={makeDivision(17, 5)} onAnswered={noop} proof />,
  },
  {
    title: 'Problema · elegir operación',
    ...frame,
    render: () => (
      <WordProblemView
        exercise={makeWordProblem('add-peces', 'En el río nadan {a} peces dorados y {b} peces azules. ¿Cuántos peces hay en total?', 'add', 24, 18, 'peces')}
        onAnswered={noop}
        chooseOp
      />
    ),
  },
]

export default entries
