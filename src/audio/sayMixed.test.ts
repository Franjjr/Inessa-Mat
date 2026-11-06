import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseMixed, plainMixed, sayMixed } from './sayMixed'
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

describe('parseMixed («*…*» marks the English parts of a line)', () => {
  it('splits a marked line into Spanish and English parts, in order', () => {
    expect(parseMixed('Mira, *seven* es siete.')).toEqual([
      { text: 'Mira, ', lang: 'es' },
      { text: 'seven', lang: 'en' },
      { text: ' es siete.', lang: 'es' },
    ])
  })

  it('a line that starts or ends with English has no empty Spanish part', () => {
    expect(parseMixed('*Good morning*, Mum!')).toEqual([{ text: 'Good morning', lang: 'en' }, { text: ', Mum!', lang: 'es' }])
    expect(parseMixed('Se dice *hello*')).toEqual([{ text: 'Se dice ', lang: 'es' }, { text: 'hello', lang: 'en' }])
  })

  it('a line with no marks is not mixed', () => {
    expect(parseMixed('Hoy {pet} quiere contar.')).toBeNull()
    expect(parseMixed('')).toBeNull()
  })

  it('plainMixed drops the marks, for the text on the screen', () => {
    expect(plainMixed('Mira, *seven* es siete.')).toBe('Mira, seven es siete.')
    expect(plainMixed('Sin marcas.')).toBe('Sin marcas.')
  })
})

describe('sayMixed with the Spanish voice of the speaker', () => {
  it('reads the Spanish parts with the speaker’s voice and the English ones with the english voice', async () => {
    const say = vi.spyOn(speech, 'say').mockResolvedValue()
    await sayMixed([{ text: 'Hola,', lang: 'es' }, { text: 'hello', lang: 'en' }], { spanish: 'companion', interrupt: true })
    expect(say).toHaveBeenNthCalledWith(1, 'Hola,', { voice: 'companion', interrupt: true })
    expect(say).toHaveBeenNthCalledWith(2, 'hello', { voice: 'english', interrupt: false })
  })
})
