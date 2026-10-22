/* The view of a column subtraction, whatever method the child uses: pedir prestado and me llevo una (the column),
   por partes and saltos en la recta (their own views). Registered for the kind 'column-sub'. */
import ColumnView, { type ColumnViewProps } from './ColumnView'
import SubLineView from './SubLineView'
import SubPartsView from './SubPartsView'

export default function SubtractionView(props: ColumnViewProps) {
  switch (props.method) {
    case 'parts': return <SubPartsView {...props} />
    case 'line': return <SubLineView {...props} />
    default: return <ColumnView {...props} />
  }
}
