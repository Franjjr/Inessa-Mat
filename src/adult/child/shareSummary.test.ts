import { describe, expect, it } from 'vitest'
import { summaryLines } from './shareSummary'

describe('summaryLines', () => {
  it('tells the story in one line per fact, with the nickname and companion only', () => {
    const r = summaryLines({ nickname: 'Inessa', companionName: 'Luna', crystals: 2, totalCrystals: 8, currentWorld: 'Río de las Sumas' })
    expect(r.title).toBe('Inessa y Luna')
    expect(r.lines).toEqual(['Ha recuperado 2 de 8 cristales mágicos.', 'Ahora está en Río de las Sumas.'])
    expect(r.finished).toBe(false)
  })

  it('says when the adventure is finished and when it has not started', () => {
    expect(summaryLines({ nickname: 'Mateo', companionName: 'Pipo', crystals: 8, totalCrystals: 8, currentWorld: null }).lines).toContain('¡Ha completado la aventura!')
    expect(summaryLines({ nickname: 'Mateo', companionName: 'Pipo', crystals: 0, totalCrystals: 8, currentWorld: null }).lines).toEqual(['Su aventura acaba de empezar.'])
  })
})
