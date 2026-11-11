import { describe, expect, it } from 'vitest'
import type { ChildSummary } from '@/types'
import { subtractionReportLine } from './subtractionReport'

type Info = NonNullable<ChildSummary['subtractionMethods']>

describe('subtractionReportLine', () => {
  it('says the favourite method and that no method has been used yet', () => {
    const info: Info = { preferred: 'borrow', byMethod: [] }
    expect(subtractionReportLine(info)).toBe('Resta: prefiere «Pedir prestado arriba». Todavía no hay restas hechas con cada método.')
  })

  it('lists the results per school method and says which one the child is most accurate with', () => {
    const info: Info = {
      preferred: 'borrow',
      byMethod: [
        { method: 'borrow', attempts: 10, correct: 6 },
        { method: 'carry', attempts: 4, correct: 4 },
        { method: 'line', attempts: 5, correct: 5 },
      ],
    }
    const line = subtractionReportLine(info)
    expect(line.startsWith('Resta: prefiere «Pedir prestado arriba»; aciertos por método (últimos 30 días): ')).toBe(true)
    expect(line).toContain('Pedir prestado arriba: 6 de 10 (60 %)')
    expect(line).toContain('Me llevo una abajo: 4 de 4 (100 %)')
    // A retired method (old attempts with saltos en la recta) is never proposed to the grown-up.
    expect(line).not.toContain('Saltos en la recta')
    expect(line).toContain('Acierta más con «Me llevo una abajo».')
  })

  it('does not name a method with fewer than three attempts as the most accurate one', () => {
    const info: Info = { preferred: 'carry', byMethod: [{ method: 'carry', attempts: 5, correct: 3 }, { method: 'line', attempts: 1, correct: 1 }] }
    expect(subtractionReportLine(info)).not.toContain('Acierta más')
  })
})
