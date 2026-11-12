/* The view of a column subtraction: always the column, with the school method the grown-up chose (pedir prestado or
   me llevo una). Old data may still name a retired method (por partes, saltos en la recta): it is shown as the column
   with pedir prestado. Registered for the kind 'column-sub'. */
import { normaliseSubMethod } from '@/engine'
import ColumnView, { type ColumnViewProps } from './ColumnView'

export default function SubtractionView(props: ColumnViewProps) {
  return <ColumnView {...props} method={normaliseSubMethod(props.method)} />
}
