/* The division and tables lines of the child's report (same rules as the subtraction line): the favourite, the results per
   method over the attempts, and the method that works better once there are enough attempts. */
import { describe, expect, it } from 'vitest'
import { divisionReportLine, tablesReportLine } from './methodReport'

describe('divisionReportLine', () => {
  it('says the favourite method, and that no division has been done with each method yet', () => {
    expect(divisionReportLine({ preferred: 'galera', byMethod: [] }))
      .toBe('División: prefiere «La galera con restas». Todavía no hay ejercicios hechos con cada método.')
  })

  it('lists the results per method and names the one that works better (with enough attempts)', () => {
    const line = divisionReportLine({
      preferred: 'galera',
      byMethod: [
        { method: 'galera', attempts: 4, correct: 2 },
        { method: 'galera-short', attempts: 5, correct: 5 },
        { method: 'climb', attempts: 2, correct: 2 },
      ],
    })
    expect(line.startsWith('División: prefiere «La galera con restas»; aciertos por método (últimos 30 días): ')).toBe(true)
    expect(line).toContain('La galera con restas: 2 de 4 (50 %)')
    expect(line).toContain('La galera sin restas: 5 de 5 (100 %)')
    // climb has fewer than three attempts: it is listed but not ranked.
    expect(line).toContain('Acierta más con «La galera sin restas».')
  })

  it('does not name a better method when the favourite is already the best', () => {
    const line = divisionReportLine({ preferred: 'div-parts', byMethod: [{ method: 'div-parts', attempts: 3, correct: 3 }, { method: 'galera', attempts: 3, correct: 1 }] })
    expect(line).not.toContain('Acierta más')
  })
})

describe('tablesReportLine', () => {
  it('says that no favourite trick is chosen yet, and lists the tricks used', () => {
    expect(tablesReportLine({ preferred: null, byMethod: [] })).toContain('todavía no ha elegido un truco favorito')
    const line = tablesReportLine({ preferred: 'mirror', byMethod: [{ method: 'five-plus-one', attempts: 3, correct: 2 }, { method: 'mirror', attempts: 3, correct: 3 }] })
    expect(line).toContain('Tablas: prefiere «El espejo»')
    expect(line).toContain('El 5 y uno más: 2 de 3 (67 %)')
  })
})
