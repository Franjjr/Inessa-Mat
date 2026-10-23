import { describe, expect, it } from 'vitest'
import type { ChildSummary } from '@/types'
import { subtractionReportLine } from './subtractionReport'

type Info = NonNullable<ChildSummary['subtractionMethods']>

describe('subtractionReportLine', () => {
  it('says the favourite method and that no method has been used yet', () => {
    const info: Info = { preferred: 'borrow', byMethod: [] }
    expect(subtractionReportLine(info)).toBe('Resta: prefiere «Pedir prestado arriba». Todavía no hay restas hechas con cada método.')
  })

  it('lists the results per method and says which one the child is most accurate with', () => {
    const info: Info = {
      preferred: 'borrow',
      byMethod: [
        { method: 'borrow', attempts: 10, correct: 6 },
        { method: 'parts', attempts: 4, correct: 4 },
        { method: 'line', attempts: 2, correct: 2 },
      ],
    }
    const line = subtractionReportLine(info)
    expect(line.startsWith('Resta: prefiere «Pedir prestado arriba»; aciertos por método (últimos 30 días): ')).toBe(true)
    expect(line).toContain('Pedir prestado arriba: 6 de 10 (60 %)')
    expect(line).toContain('Por partes: 4 de 4 (100 %)')
    expect(line).toContain('Saltos en la recta: 2 de 2 (100 %)')
    // Only 'parts' has the minimum of attempts and beats the favourite.
    expect(line).toContain('Acierta más con «Por partes».')
  })

  it('does not name a method with fewer than three attempts as the most accurate one', () => {
    const info: Info = { preferred: 'carry', byMethod: [{ method: 'carry', attempts: 5, correct: 3 }, { method: 'line', attempts: 1, correct: 1 }] }
    expect(subtractionReportLine(info)).not.toContain('Acierta más')
  })
})
