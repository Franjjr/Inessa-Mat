/* One line each for the grown-ups: the favourite division method and the favourite tables trick, with the results. */
import type { ChildSummary } from '@/types'
import adult from '../shared/adult.module.css'
import { divisionReportLine, tablesReportLine } from './methodReport'

export function OtherMethodsCard({ division, tables }: { division: ChildSummary['divisionMethods']; tables: ChildSummary['tableTricks'] }) {
  if (!division && !tables) return null
  return (
    <section className={adult.card} aria-labelledby="other-methods-title">
      <h2 id="other-methods-title" className={adult.subheading}>Cómo divide y cómo recuerda las tablas</h2>
      {division && <p className={adult.lead} style={{ fontSize: 'var(--fs-sm)' }}>{divisionReportLine(division)}</p>}
      {tables && <p className={adult.lead} style={{ fontSize: 'var(--fs-sm)' }}>{tablesReportLine(tables)}</p>}
    </section>
  )
}
