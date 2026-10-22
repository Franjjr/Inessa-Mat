/* One line for the grown-ups: which subtraction method the child prefers and how well each method goes. */
import type { ChildSummary } from '@/types'
import adult from '../shared/adult.module.css'
import { subtractionReportLine } from './subtractionReport'

export function SubtractionMethodsCard({ info }: { info: ChildSummary['subtractionMethods'] }) {
  if (!info) return null
  return (
    <section className={adult.card} aria-labelledby="sub-methods-title">
      <h2 id="sub-methods-title" className={adult.subheading}>Cómo resta</h2>
      <p className={adult.lead} style={{ fontSize: 'var(--fs-sm)' }}>{subtractionReportLine(info)}</p>
    </section>
  )
}
