import { afterEach, describe, expect, it, vi } from 'vitest'
import { sayMixed } from './sayMixed'
import { speech } from './speech'

afterEach(() => vi.restoreAllMocks())

describe('sayMixed', () => {
  it('says each part in order, Spanish with lumi and English with the english voice', async () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    await sayMixed([
      { text: 'Mira, esta es la palabra', lang: 'es' },
      { text: 'seven', lang: 'en' },
      { text: 'Muy bien', lang: 'es' },
    ])
    expect(say).toHaveBeenCalledTimes(3)
    expect(say).toHaveBeenNthCalledWith(1, 'Mira, esta es la palabra', expect.objectContaining({ voice: 'lumi' }))
    expect(say).toHaveBeenNthCalledWith(2, 'seven', expect.objectContaining({ voice: 'english' }))
    expect(say).toHaveBeenNthCalledWith(3, 'Muy bien', expect.objectContaining({ voice: 'lumi' }))
  })

  it('waits for each part to finish before starting the next', async () => {
    let finishFirst!: () => void
    const say = vi.spyOn(speech, 'say')
      .mockImplementationOnce(() => new Promise<void>((r) => { finishFirst = r }))
      .mockResolvedValue()
    const p = sayMixed([{ text: 'uno', lang: 'es' }, { text: 'two', lang: 'en' }])
    expect(say).toHaveBeenCalledTimes(1)
    finishFirst()
    await p
    expect(say).toHaveBeenCalledTimes(2)
  })

  it('passes the options on, and interrupts only with the first part', async () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    await sayMixed([{ text: 'uno', lang: 'es' }, { text: 'two', lang: 'en' }], { interrupt: true, rate: 0.9 })
    expect(say).toHaveBeenNthCalledWith(1, 'uno', { voice: 'lumi', interrupt: true, rate: 0.9 })
    expect(say).toHaveBeenNthCalledWith(2, 'two', { voice: 'english', interrupt: false, rate: 0.9 })
  })
})
